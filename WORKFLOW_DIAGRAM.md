# Receipt Scanning Workflow Diagram

## 🔄 Complete User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                             │
└─────────────────────────────────────────────────────────────────┘

    1. User opens expense form
           │
           ▼
    2. User uploads receipt (JPEG/PNG/PDF)
           │
           ▼
    ┌──────────────────────────────────┐
    │  Auto-scan enabled?              │
    │  [✓] Auto-scan on upload         │
    └──────────┬───────────────────────┘
               │
       ┌───────┴────────┐
       │                │
      YES              NO
       │                │
       ▼                ▼
    Auto-scan      User clicks
    triggered      "Scan Receipt"
       │                │
       └────────┬───────┘
                │
                ▼
    ┌──────────────────────────────────┐
    │  🤖 AI is analyzing receipt...   │
    │  (Loading indicator shown)       │
    └──────────┬───────────────────────┘
               │
               ▼

┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND PROCESSING                          │
└─────────────────────────────────────────────────────────────────┘

    1. API receives scan request
       POST /api/ocr/scan
       Body: { imageUrl: "/receipts/abc123.jpg" }
           │
           ▼
    2. OCR orchestrator checks environment
       lib/ocr.ts → extractReceiptData()
           │
           ▼
    ┌──────────────────────────────────┐
    │  GEMINI_API_KEY exists?          │
    └──────────┬───────────────────────┘
               │
       ┌───────┴────────┐
       │                │
      YES              NO
       │                │
       ▼                ▼
    ┌─────────────┐  ┌─────────────┐
    │ Gemini AI   │  │ Tesseract   │
    │ (Primary)   │  │ (Fallback)  │
    └──────┬──────┘  └──────┬──────┘
           │                │
           └────────┬───────┘
                    │
                    ▼

┌─────────────────────────────────────────────────────────────────┐
│                      GEMINI AI PROCESSING                        │
└─────────────────────────────────────────────────────────────────┘

    1. Load receipt image from file system
       fs.readFileSync(imagePath)
           │
           ▼
    2. Convert to base64
       fileData.toString('base64')
           │
           ▼
    3. Prepare Gemini prompt
       "Extract receipt data as JSON..."
           │
           ▼
    4. Send to Gemini 1.5 Flash
       model.generateContent({ contents })
           │
           ▼
    5. Receive AI response (2-5 seconds)
       {
         "merchantName": "Starbucks",
         "amount": 15.99,
         "originalCurrency": "USD",
         "date": "2025-10-04",
         "category": "Food & Dining",
         "description": "Coffee and snacks",
         "items": [...]
       }
           │
           ▼
    6. Parse and validate JSON
       JSON.parse() + normalization
           │
           ▼
    7. Return structured data
       {
         merchantName: "Starbucks",
         amount: 15.99,
         currency: "USD",
         date: "2025-10-04",
         category: "Food & Dining",
         description: "Coffee and snacks",
         expenseLines: [...],
         requiresReview: true
       }
           │
           ▼

┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND UPDATE                             │
└─────────────────────────────────────────────────────────────────┘

    1. Receive API response
       const { data } = await response.json()
           │
           ▼
    2. Update form state
       setForm({
         merchantName: data.merchantName,
         amount: data.amount.toString(),
         currency: data.originalCurrency,
         date: data.date,
         category: data.category,
         description: data.description
       })
           │
           ▼
    3. Show success notification
       toast({
         title: "Receipt scanned! 🎉",
         description: "Form auto-filled..."
       })
           │
           ▼
    4. User reviews data
       ┌──────────────────────────────────┐
       │ Merchant: Starbucks              │
       │ Amount: 15.99                    │
       │ Currency: USD                    │
       │ Date: 2025-10-04                 │
       │ Category: Food & Dining          │
       │ Description: Coffee and snacks   │
       └──────────────────────────────────┘
           │
           ▼
    5. User edits if needed (optional)
           │
           ▼
    6. User submits expense
       POST /api/expenses/create
           │
           ▼
    ✅ EXPENSE CREATED!
```

---

## 🔀 Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      ERROR SCENARIOS                             │
└─────────────────────────────────────────────────────────────────┘

    Gemini API Error
         │
         ▼
    ┌──────────────────────────────────┐
    │  Log error to console            │
    │  "Gemini extraction failed..."   │
    └──────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────────────────┐
    │  Fallback to Tesseract OCR       │
    └──────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────────────────┐
    │  Extract text with Tesseract     │
    │  Parse with regex patterns       │
    └──────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────────────────┐
    │  Return best-effort data         │
    │  (may be less accurate)          │
    └──────────┬───────────────────────┘
               │
               ▼
         Form auto-fills
         (user reviews)

    ─────────────────────────────────────

    Upload Error
         │
         ▼
    ┌──────────────────────────────────┐
    │  Show error toast                │
    │  "Upload failed"                 │
    └──────────┬───────────────────────┘
               │
               ▼
         User retries

    ─────────────────────────────────────

    No Receipt Uploaded
         │
         ▼
    ┌──────────────────────────────────┐
    │  Show warning toast              │
    │  "Please upload a receipt first" │
    └──────────────────────────────────┘
```

---

## 📊 Data Transformation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   RAW RECEIPT IMAGE                              │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────┐
    │  Starbucks Coffee                │
    │  123 Main Street                 │
    │                                  │
    │  2x Latte          $5.50         │
    │  1x Muffin         $3.99         │
    │  ─────────────────────────       │
    │  Subtotal:         $9.49         │
    │  Tax:              $0.76         │
    │  ─────────────────────────       │
    │  TOTAL:           $10.25         │
    │                                  │
    │  Date: 10/04/2025                │
    │  Card: ****1234                  │
    └──────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  Gemini AI     │
         │  Processing    │
         └────────┬───────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   STRUCTURED JSON OUTPUT                         │
└─────────────────────────────────────────────────────────────────┘

    {
      "merchantName": "Starbucks Coffee",
      "amount": 10.25,
      "originalCurrency": "USD",
      "date": "2025-10-04",
      "category": "Food & Dining",
      "description": "Receipt from Starbucks Coffee",
      "items": [
        {
          "name": "Latte",
          "quantity": 2,
          "price": 5.50
        },
        {
          "name": "Muffin",
          "quantity": 1,
          "price": 3.99
        }
      ]
    }
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FORM AUTO-FILL                                 │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────┐
    │ Merchant Name: Starbucks Coffee  │
    │ Amount: 10.25                    │
    │ Currency: USD                    │
    │ Date: 2025-10-04                 │
    │ Category: Food & Dining          │
    │ Description: Receipt from...     │
    └──────────────────────────────────┘
```

---

## 🎯 Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT HIERARCHY                           │
└─────────────────────────────────────────────────────────────────┘

ExpenseForm (expense-form.tsx)
    │
    ├─ State Management
    │   ├─ form (merchant, amount, date, category, currency, description)
    │   ├─ receiptFile (uploaded file)
    │   ├─ receiptUrl (server URL)
    │   ├─ loading (upload state)
    │   ├─ scanning (OCR state)
    │   └─ autoScan (toggle)
    │
    ├─ Event Handlers
    │   ├─ handleReceiptUpload()
    │   │   ├─ Upload file to /api/upload/receipt
    │   │   ├─ Set receiptUrl
    │   │   └─ Trigger auto-scan (if enabled)
    │   │
    │   ├─ handleScanReceipt()
    │   │   ├─ Call /api/ocr/scan
    │   │   ├─ Receive extracted data
    │   │   └─ Update form state
    │   │
    │   └─ handleSubmit()
    │       └─ Submit to /api/expenses/create
    │
    └─ UI Components
        ├─ Auto-scan checkbox
        ├─ File input
        ├─ Scan button (conditional)
        ├─ Loading indicator
        ├─ Form fields (auto-filled)
        └─ Submit button

                    │
                    ▼

API Routes
    │
    ├─ /api/upload/receipt
    │   └─ Saves file, returns URL
    │
    ├─ /api/ocr/scan
    │   ├─ Calls lib/ocr.ts
    │   └─ Returns extracted data
    │
    └─ /api/expenses/create
        └─ Creates expense record

                    │
                    ▼

Libraries
    │
    ├─ lib/gemini-ocr.ts
    │   ├─ extractReceiptDataWithGemini()
    │   └─ extractReceiptDataWithGeminiStream()
    │
    └─ lib/ocr.ts
        └─ extractReceiptData()
            ├─ Try Gemini (if API key exists)
            └─ Fallback to Tesseract
```

---

## ⚡ Performance Timeline

```
Time (seconds)
0s ─────────────────────────────────────────────────────────────── 10s
│
│  User uploads receipt
│  ▼
├─ 0.0s: Upload starts
│
├─ 0.5s: File uploaded to server
│        receiptUrl set
│        Auto-scan triggered (if enabled)
│
├─ 0.6s: API call to /api/ocr/scan
│
├─ 0.7s: Gemini AI request sent
│        "🤖 AI is analyzing..."
│
├─ 1.0s: Gemini processing...
│
├─ 2.0s: Gemini processing...
│
├─ 3.0s: Gemini processing...
│
├─ 3.5s: Gemini response received
│        JSON parsed
│
├─ 3.6s: Form state updated
│        Fields auto-filled
│
├─ 3.7s: Success toast shown
│        "Receipt scanned! 🎉"
│
└─ 4.0s: COMPLETE ✅
         User reviews data
```

---

## 🔐 Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
└─────────────────────────────────────────────────────────────────┘

    Client (Browser)
         │
         │ 1. User uploads receipt
         │    (File stays in browser)
         │
         ▼
    ┌──────────────────────────────────┐
    │  FormData with file              │
    │  No API key exposed              │
    └──────────┬───────────────────────┘
               │
               │ HTTPS
               │
               ▼
    Server (Next.js API)
         │
         │ 2. Authenticate user
         │    (NextAuth session check)
         │
         ▼
    ┌──────────────────────────────────┐
    │  Session verified ✓              │
    └──────────┬───────────────────────┘
               │
               │ 3. Save file securely
               │    (public/receipts/)
               │
               ▼
    ┌──────────────────────────────────┐
    │  File saved with unique name     │
    │  /receipts/abc123.jpg            │
    └──────────┬───────────────────────┘
               │
               │ 4. OCR processing
               │    (Server-side only)
               │
               ▼
    ┌──────────────────────────────────┐
    │  Read GEMINI_API_KEY from env    │
    │  (Never sent to client)          │
    └──────────┬───────────────────────┘
               │
               │ HTTPS
               │
               ▼
    Gemini API (Google)
         │
         │ 5. Process receipt
         │    Return JSON
         │
         ▼
    ┌──────────────────────────────────┐
    │  Extracted data (sanitized)      │
    └──────────┬───────────────────────┘
               │
               │ 6. Return to client
               │    (JSON only, no API key)
               │
               ▼
    Client (Browser)
         │
         │ 7. Display data
         │    User reviews
         │
         ▼
    ✅ SECURE END-TO-END
```

---

**Visual diagrams complete!** 🎨

Use these diagrams to understand the complete workflow and architecture.
