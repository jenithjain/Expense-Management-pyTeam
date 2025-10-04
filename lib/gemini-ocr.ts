import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import mime from 'mime';
import path from 'path';

/**
 * Helper function to convert a local file into the format Gemini API needs
 */
function fileToGenerativePart(filePath: string) {
  const fileData = fs.readFileSync(filePath);
  const mimeType = mime.getType(filePath);
  if (!mimeType) {
    throw new Error(`Could not determine MIME type for file: ${filePath}`);
  }
  return {
    inlineData: {
      data: fileData.toString('base64'),
      mimeType,
    },
  };
}

/**
 * Extract receipt data from image using Gemini AI
 */
export async function extractReceiptDataWithGemini(imageUrl: string): Promise<any> {
  try {
    // Initialize the GoogleGenerativeAI client
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Convert relative URL to absolute path if needed
    let imagePath = imageUrl;
    if (imageUrl.startsWith('/receipts/')) {
      imagePath = path.join(process.cwd(), 'public', imageUrl);
    }

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File not found: ${imagePath}`);
    }

    // Set up the model configuration
    // Using Gemini 2.0 Flash for multimodal (text + image) processing
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp'
    });

    // Prepare the prompt and image
    const imagePart = fileToGenerativePart(imagePath);
    const prompt = `You are an expert at extracting structured data from receipts and invoices. Analyze this receipt/invoice image and extract the following information in JSON format:

{
  "merchantName": "Name of the merchant/store/restaurant",
  "amount": "Total amount as a number (e.g., 45.99)",
  "originalCurrency": "Currency code (USD, EUR, GBP, INR, JPY, CAD, AUD, or CNY)",
  "date": "Date in YYYY-MM-DD format",
  "category": "One of: Food & Dining, Transportation, Lodging, Office Supplies, Travel, Entertainment, or Other",
  "description": "Brief description of the purchase",
  "items": [
    {
      "name": "Item name",
      "quantity": 1,
      "price": 10.00
    }
  ]
}

CRITICAL RULES FOR AMOUNT EXTRACTION:
1. Look for keywords like "TOTAL AMOUNT DUE", "TOTAL", "GRAND TOTAL", "AMOUNT DUE", "NET AMOUNT", or "FINAL AMOUNT"
2. Extract the FINAL/TOTAL amount - this is usually the largest number and appears at the bottom
3. DO NOT extract subtotal, tax amount, or individual line item amounts as the main amount
4. If there are multiple totals, choose the one labeled as "TOTAL AMOUNT DUE" or "GRAND TOTAL"
5. Include decimal places (e.g., 14160.00 not 14160)
6. Remove any currency symbols or commas from the number (e.g., ₹14,160.00 becomes 14160.00)

Other Rules:
7. If you see a currency symbol (₹, €, £, ¥, $), identify the correct currency
8. Infer the category based on the merchant name and items
9. If date is not found, use today's date
10. Return ONLY valid JSON, no additional text
11. Extract all line items with their descriptions and amounts`;

    console.log('Sending request to Gemini...');
    const result = await model.generateContent([
      prompt,
      imagePart
    ]);

    const response = await result.response;
    const text = response.text();

    console.log('Gemini response:', text);

    // Parse the JSON response
    let extractedData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError: any) {
      console.error('Failed to parse Gemini response:', parseError);
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    // Validate and normalize the data
    const normalizedData = {
      merchantName: extractedData.merchantName || 'Unknown Merchant',
      amount: parseFloat(extractedData.amount) || 0,
      originalCurrency: extractedData.originalCurrency || 'USD',
      date: extractedData.date || new Date().toISOString().split('T')[0],
      category: extractedData.category || 'Other',
      description: extractedData.description || `Receipt from ${extractedData.merchantName || 'merchant'}`,
      expenseLines: extractedData.items || [],
      rawText: text,
      requiresReview: true,
    };

    return normalizedData;
  } catch (error: any) {
    console.error('Gemini OCR extraction error:', error);
    throw new Error(`Failed to extract receipt data with Gemini: ${error.message}`);
  }
}

/**
 * Extract receipt data using streaming (for real-time feedback)
 */
export async function extractReceiptDataWithGeminiStream(
  imageUrl: string,
  onChunk?: (chunk: string) => void
): Promise<any> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    let imagePath = imageUrl;
    if (imageUrl.startsWith('/receipts/')) {
      imagePath = path.join(process.cwd(), 'public', imageUrl);
    }

    if (!fs.existsSync(imagePath)) {
      throw new Error(`File not found: ${imagePath}`);
    }

    // Using Gemini 2.0 Flash for multimodal (text + image) processing
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp'
    });

    const imagePart = fileToGenerativePart(imagePath);
    const prompt = `Extract receipt/invoice data and return as JSON with fields: merchantName, amount (MUST be the TOTAL AMOUNT DUE or GRAND TOTAL, not subtotal or individual items), originalCurrency, date (YYYY-MM-DD), category (Food & Dining, Transportation, Lodging, Office Supplies, Travel, Entertainment, or Other), description, and items array. 

CRITICAL: For amount, look for "TOTAL AMOUNT DUE", "GRAND TOTAL", or "FINAL AMOUNT" - extract the largest final amount with decimals (e.g., 14160.00). Remove currency symbols and commas.

Return ONLY valid JSON.`;

    console.log('Sending streaming request to Gemini...');
    const result = await model.generateContentStream([prompt, imagePart]);

    let fullText = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      if (onChunk) {
        onChunk(chunkText);
      }
    }

    // Parse the accumulated response
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in streamed response');
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    return {
      merchantName: extractedData.merchantName || 'Unknown Merchant',
      amount: parseFloat(extractedData.amount) || 0,
      originalCurrency: extractedData.originalCurrency || 'USD',
      date: extractedData.date || new Date().toISOString().split('T')[0],
      category: extractedData.category || 'Other',
      description: extractedData.description || `Receipt from ${extractedData.merchantName || 'merchant'}`,
      expenseLines: extractedData.items || [],
      rawText: fullText,
      requiresReview: true,
    };
  } catch (error: any) {
    console.error('Gemini streaming OCR error:', error);
    throw new Error(`Failed to extract receipt data: ${error.message}`);
  }
}
