import Tesseract from 'tesseract.js';
import path from 'path';
import { extractReceiptDataWithGemini } from './gemini-ocr';

/**
 * Extract receipt data from image using OCR
 * Uses Gemini AI if API key is available, falls back to Tesseract
 */
export async function extractReceiptData(imageUrl: string): Promise<any> {
  try {
    // Try Gemini AI first if API key is available
    if (process.env.GEMINI_API_KEY) {
      console.log('Using Gemini AI for receipt extraction...');
      try {
        return await extractReceiptDataWithGemini(imageUrl);
      } catch (geminiError: any) {
        console.error('Gemini extraction failed, falling back to Tesseract:', geminiError.message);
      }
    }

    // Fallback to Tesseract OCR
    console.log('Using Tesseract OCR for receipt extraction...');
    
    // Convert relative URL to absolute path if needed
    let imagePath = imageUrl;
    if (imageUrl.startsWith('/receipts/')) {
      imagePath = path.join(process.cwd(), 'public', imageUrl);
    }

    // Create Tesseract worker with proper configuration for Next.js
    const worker = await Tesseract.createWorker('eng', 1, {
      workerPath: typeof window === 'undefined' 
        ? path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js')
        : undefined,
      logger: (m) => console.log(m),
    });

    // Perform OCR
    const result = await worker.recognize(imagePath);
    
    // Terminate worker to free resources
    await worker.terminate();

    const text = result.data.text;

    // Parse the extracted text
    const parsedData = parseReceiptText(text);

    return {
      ...parsedData,
      rawText: text,
      confidence: result.data.confidence,
      requiresReview: true,
    };
  } catch (error: any) {
    console.error('OCR extraction error:', error);
    throw new Error(`Failed to extract receipt data: ${error.message}`);
  }
}

/**
 * Parse receipt text to extract structured data
 */
export function parseReceiptText(text: string): any {
  const lines = text.split('\n').filter((line) => line.trim());

  // Extract amount
  let amount = 0;
  let originalCurrency = 'USD';

  // Look for total, amount, sum keywords
  const amountRegex = /(?:total|amount|sum|grand total|subtotal)[:\s]*([₹€£¥$])?[\s]*(\d+[.,]\d{2})/gi;
  const amountMatch = amountRegex.exec(text);

  if (amountMatch) {
    amount = parseFloat(amountMatch[2].replace(',', '.'));
    
    // Detect currency from symbol
    const symbol = amountMatch[1];
    if (symbol) {
      originalCurrency = detectCurrency(symbol);
    }
  } else {
    // Try to find any number that looks like a price
    const priceRegex = /([₹€£¥$])?\s*(\d+[.,]\d{2})/g;
    const prices: number[] = [];
    let match;

    while ((match = priceRegex.exec(text)) !== null) {
      prices.push(parseFloat(match[2].replace(',', '.')));
      if (match[1]) {
        originalCurrency = detectCurrency(match[1]);
      }
    }

    // Take the largest price as the total
    if (prices.length > 0) {
      amount = Math.max(...prices);
    }
  }

  // Extract date
  let date = new Date();
  const dateRegex = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})|(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/g;
  const dateMatch = dateRegex.exec(text);

  if (dateMatch) {
    if (dateMatch[1]) {
      // DD/MM/YYYY or MM/DD/YYYY format
      const part1 = parseInt(dateMatch[1]);
      const part2 = parseInt(dateMatch[2]);
      const year = parseInt(dateMatch[3]);
      
      // Assume MM/DD/YYYY for US format
      date = new Date(year > 99 ? year : 2000 + year, part1 - 1, part2);
    } else if (dateMatch[4]) {
      // YYYY/MM/DD format
      date = new Date(parseInt(dateMatch[4]), parseInt(dateMatch[5]) - 1, parseInt(dateMatch[6]));
    }
  }

  // Extract merchant name (usually first few lines)
  let merchantName = 'Unknown Merchant';
  if (lines.length > 0) {
    merchantName = lines[0].trim();
    
    // Take up to 3 lines for merchant info
    if (lines.length > 1) {
      merchantName = lines.slice(0, Math.min(3, lines.length))
        .filter((line) => !dateRegex.test(line) && !amountRegex.test(line))
        .join(' ')
        .trim();
    }
  }

  // Extract line items
  const expenseLines: any[] = [];
  const itemRegex = /(.+?)\s+(\d+)\s*x\s*([₹€£¥$])?\s*(\d+[.,]\d{2})/gi;
  let itemMatch;

  while ((itemMatch = itemRegex.exec(text)) !== null) {
    expenseLines.push({
      description: itemMatch[1].trim(),
      quantity: parseInt(itemMatch[2]),
      amount: parseFloat(itemMatch[4].replace(',', '.')),
    });
  }

  // Determine category based on merchant name and items
  const category = determineCategory(merchantName, expenseLines);

  return {
    amount,
    date: date.toISOString().split('T')[0],
    merchantName: merchantName.substring(0, 100) || 'Unknown Merchant',
    originalCurrency,
    expenseLines,
    description: `Receipt from ${merchantName}`,
    category,
  };
}

/**
 * Detect currency from symbol
 */
function detectCurrency(symbol: string): string {
  const currencyMap: { [key: string]: string } = {
    '₹': 'INR',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY',
    '$': 'USD',
  };

  return currencyMap[symbol] || 'USD';
}

/**
 * Determine expense category based on merchant and items
 */
function determineCategory(merchantName: string, items: any[]): string {
  const lowerMerchant = merchantName.toLowerCase();

  if (lowerMerchant.includes('restaurant') || lowerMerchant.includes('cafe') || lowerMerchant.includes('food')) {
    return 'Food & Dining';
  }

  if (lowerMerchant.includes('hotel') || lowerMerchant.includes('inn') || lowerMerchant.includes('motel')) {
    return 'Lodging';
  }

  if (lowerMerchant.includes('gas') || lowerMerchant.includes('fuel') || lowerMerchant.includes('petrol')) {
    return 'Transportation';
  }

  if (lowerMerchant.includes('airline') || lowerMerchant.includes('flight') || lowerMerchant.includes('airport')) {
    return 'Travel';
  }

  if (lowerMerchant.includes('office') || lowerMerchant.includes('supply') || lowerMerchant.includes('store')) {
    return 'Office Supplies';
  }

  return 'Other';
}
