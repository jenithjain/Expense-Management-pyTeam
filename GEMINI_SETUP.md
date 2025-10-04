# Gemini AI Receipt Scanning Setup

This project now supports intelligent receipt scanning using Google's Gemini AI API.

## Features

- **Auto-fill expense forms** from receipt images (JPEG, PNG, PDF)
- **Intelligent data extraction**: merchant name, amount, date, category, currency
- **Auto-scan on upload**: Automatically scans receipts when uploaded
- **Fallback support**: Falls back to Tesseract OCR if Gemini API is not configured

## Setup Instructions

### 1. Get Your Gemini API Key

You already have your API key:
```
AIzaSyDQV2g4eHbekOTBsO11xAPC7WxRLJi-UJU
```

### 2. Add API Key to Environment Variables

Add the following line to your `.env.local` file:

```env
GEMINI_API_KEY=AIzaSyDQV2g4eHbekOTBsO11xAPC7WxRLJi-UJU
```

### 3. Restart Your Development Server

After adding the API key, restart your Next.js development server:

```bash
npm run dev
```

## How It Works

### Auto-Scan Feature

1. **Upload a receipt** (image or PDF)
2. **AI automatically scans** the receipt (if auto-scan is enabled)
3. **Form is auto-filled** with extracted data:
   - Merchant name
   - Total amount
   - Currency
   - Date
   - Category (intelligently inferred)
   - Description

### Manual Scan

If you disable auto-scan:
1. Upload the receipt
2. Click the **"Scan Receipt"** button
3. Review the extracted data

## Supported File Types

- **Images**: JPEG, JPG, PNG
- **Documents**: PDF

## Data Extracted

The Gemini AI extracts:

| Field | Description |
|-------|-------------|
| **Merchant Name** | Name of the store/restaurant |
| **Amount** | Total amount (not subtotal) |
| **Currency** | Detected from currency symbols (₹, €, £, ¥, $) |
| **Date** | Transaction date in YYYY-MM-DD format |
| **Category** | Auto-categorized (Food & Dining, Transportation, etc.) |
| **Description** | Brief description of the purchase |
| **Items** | Individual line items (if available) |

## Category Auto-Detection

The AI intelligently categorizes expenses:

- **Food & Dining**: Restaurants, cafes, food delivery
- **Transportation**: Gas stations, ride-sharing, parking
- **Lodging**: Hotels, motels, accommodations
- **Office Supplies**: Office stores, supplies
- **Travel**: Airlines, flights, airports
- **Entertainment**: Entertainment venues
- **Other**: Everything else

## Fallback Behavior

If the Gemini API key is not configured or fails:
- The system automatically falls back to **Tesseract OCR**
- Basic text extraction still works
- You may need to manually review and correct more fields

## API Usage

The Gemini integration uses the `gemini-1.5-flash` model, which is:
- **Fast**: Quick response times
- **Accurate**: High-quality OCR and data extraction
- **Cost-effective**: Optimized for production use

## Troubleshooting

### Receipt not scanning?

1. **Check API key**: Ensure `GEMINI_API_KEY` is in `.env.local`
2. **Restart server**: Restart your dev server after adding the key
3. **Check console**: Look for error messages in the browser console
4. **File format**: Ensure the receipt is in a supported format

### Incorrect data extracted?

- The AI provides a **best-effort extraction**
- Always **review the data** before submitting
- You can manually edit any field after auto-fill

### API Quota Issues?

- Gemini has generous free tier limits
- If you exceed limits, the system falls back to Tesseract
- Consider upgrading your Gemini API plan if needed

## Security Notes

- **Never commit** `.env.local` to version control
- The API key is only used server-side
- Receipt images are processed securely

## Example Usage

```typescript
// The integration is automatic, but you can also use it programmatically:
import { extractReceiptDataWithGemini } from '@/lib/gemini-ocr';

const data = await extractReceiptDataWithGemini('/receipts/my-receipt.jpg');
console.log(data);
// {
//   merchantName: "Starbucks",
//   amount: 15.99,
//   originalCurrency: "USD",
//   date: "2025-10-04",
//   category: "Food & Dining",
//   description: "Receipt from Starbucks",
//   ...
// }
```

## Next Steps

1. ✅ Add `GEMINI_API_KEY` to `.env.local`
2. ✅ Restart your dev server
3. 🎉 Upload a receipt and watch the magic happen!

---

**Powered by Google Gemini AI** 🤖✨
