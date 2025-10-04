# Testing Guide: Gemini AI Receipt Scanning

## Quick Test Checklist

### ✅ Pre-Test Setup

1. **Verify API Key is Set**
   ```bash
   # Check if GEMINI_API_KEY exists in .env.local
   # It should contain: AIzaSyDQV2g4eHbekOTBsO11xAPC7WxRLJi-UJU
   ```

2. **Restart Development Server**
   ```bash
   npm run dev
   ```

3. **Open the Application**
   - Navigate to the employee expense submission page
   - You should see the expense form with file upload

### 🧪 Test Scenarios

#### Test 1: Auto-Scan Feature (Default)

1. **Ensure auto-scan is enabled** (checkbox should be checked)
2. **Upload a receipt image** (JPEG, PNG, or PDF)
3. **Expected behavior:**
   - ✓ File uploads successfully
   - ✓ Toast notification: "Receipt uploaded - Auto-scanning receipt..."
   - ✓ Loading indicator: "🤖 AI is analyzing your receipt..."
   - ✓ Form fields auto-fill within 2-5 seconds
   - ✓ Success toast: "Receipt scanned! 🎉"

4. **Verify auto-filled fields:**
   - Merchant Name
   - Amount
   - Currency
   - Date
   - Category
   - Description

#### Test 2: Manual Scan Feature

1. **Uncheck the "Auto-scan on upload" checkbox**
2. **Upload a receipt image**
3. **Expected behavior:**
   - ✓ File uploads successfully
   - ✓ Toast: "Receipt uploaded - Click 'Scan Receipt' to extract data"
   - ✓ "Scan Receipt" button appears

4. **Click "Scan Receipt" button**
5. **Expected behavior:**
   - ✓ Button shows "Scanning..."
   - ✓ Form auto-fills with extracted data
   - ✓ Success toast appears

#### Test 3: Different Receipt Types

Test with various receipt types:

**A. Restaurant Receipt**
- Expected category: "Food & Dining"
- Should extract: merchant, total, date, items

**B. Gas Station Receipt**
- Expected category: "Transportation"
- Should detect fuel/gas keywords

**C. Hotel Receipt**
- Expected category: "Lodging"
- Should extract accommodation details

**D. Office Supply Receipt**
- Expected category: "Office Supplies"
- Should identify office-related purchases

**E. PDF Receipt**
- Should work with PDF files
- Same extraction quality as images

#### Test 4: Currency Detection

Test receipts with different currencies:
- **$ symbol** → USD
- **€ symbol** → EUR
- **£ symbol** → GBP
- **₹ symbol** → INR
- **¥ symbol** → JPY

#### Test 5: Error Handling

**A. No Receipt Uploaded**
1. Click "Scan Receipt" without uploading
2. Expected: Error toast "No receipt - Please upload a receipt first"

**B. Invalid File Type**
1. Try uploading a .txt or .doc file
2. Expected: File input should reject it

**C. Corrupted/Unreadable Image**
1. Upload a very blurry or blank image
2. Expected: AI should still return defaults, no crash

### 📊 Expected Data Quality

| Field | Accuracy | Notes |
|-------|----------|-------|
| **Merchant Name** | 90-95% | Usually very accurate |
| **Amount** | 95-99% | Highly accurate for clear receipts |
| **Currency** | 90-95% | Based on symbols and context |
| **Date** | 85-90% | May need manual verification |
| **Category** | 80-85% | AI-inferred, review recommended |
| **Description** | 70-80% | Generated from context |

### 🔍 Debugging

#### Check Console Logs

Open browser DevTools (F12) and check console for:

```
Using Gemini AI for receipt extraction...
Sending request to Gemini 1.5 Flash...
Gemini response: {...}
```

#### Check Network Tab

1. Look for `/api/upload/receipt` - should return `{ url: "..." }`
2. Look for `/api/ocr/scan` - should return `{ data: {...} }`

#### Server Logs

Check terminal where `npm run dev` is running:

```
Using Gemini AI for receipt extraction...
Sending request to Gemini 1.5 Flash...
```

### 🐛 Common Issues & Solutions

#### Issue: "Scan failed" error

**Solutions:**
1. Check if `GEMINI_API_KEY` is in `.env.local`
2. Restart the dev server
3. Check API key is valid (not expired/revoked)
4. Check internet connection

#### Issue: Form not auto-filling

**Solutions:**
1. Check browser console for errors
2. Verify receipt uploaded successfully
3. Wait 5-10 seconds (large files take longer)
4. Try manual scan button

#### Issue: Incorrect data extracted

**Solutions:**
1. Ensure receipt image is clear and well-lit
2. Try a different image format (PNG vs JPEG)
3. Manually correct the fields (this is expected behavior)
4. Some receipts are harder to parse than others

#### Issue: "Gemini extraction failed, falling back to Tesseract"

**This is normal fallback behavior:**
- Gemini API might be temporarily unavailable
- API quota might be exceeded
- Network issues
- Tesseract will still extract basic text

### 📝 Test Data Samples

Create test receipts with:

**Sample 1: Simple Restaurant Receipt**
```
Starbucks Coffee
123 Main Street

2x Latte          $5.50
1x Muffin         $3.99
--------------------------
Subtotal:         $9.49
Tax:              $0.76
--------------------------
TOTAL:           $10.25

Date: 10/04/2025
Card: ****1234
```

**Sample 2: Gas Station Receipt**
```
Shell Gas Station

Regular Unleaded
Gallons: 12.5
Price/Gal: $3.45

TOTAL: $43.13
Date: 10/04/2025
```

### ✨ Success Criteria

The integration is working correctly if:

- ✅ Receipts upload without errors
- ✅ Auto-scan triggers automatically (when enabled)
- ✅ At least 3/6 fields are correctly extracted
- ✅ Form is editable after auto-fill
- ✅ Manual scan button works
- ✅ Error messages are clear and helpful
- ✅ No console errors during normal operation

### 🎯 Performance Benchmarks

| Metric | Target | Acceptable |
|--------|--------|------------|
| Upload time | < 2s | < 5s |
| Scan time | < 3s | < 8s |
| Total time (upload + scan) | < 5s | < 10s |
| Accuracy (clear receipts) | > 85% | > 70% |

### 📸 Screenshot Checklist

Take screenshots of:
1. ✅ Form with auto-scan checkbox
2. ✅ Receipt uploading state
3. ✅ AI analyzing message
4. ✅ Successfully auto-filled form
5. ✅ Success toast notification

### 🚀 Next Steps After Testing

1. **If all tests pass:**
   - Deploy to production
   - Monitor API usage
   - Collect user feedback

2. **If issues found:**
   - Check the troubleshooting section
   - Review console/server logs
   - Verify API key and environment setup

3. **Optimization opportunities:**
   - Add progress indicators
   - Implement caching for repeated scans
   - Add confidence scores to UI
   - Allow users to report incorrect extractions

---

**Happy Testing! 🧪✨**

For issues, check `GEMINI_SETUP.md` or review the implementation in:
- `lib/gemini-ocr.ts` - Gemini integration
- `lib/ocr.ts` - OCR orchestration
- `components/employee/expense-form.tsx` - UI component
