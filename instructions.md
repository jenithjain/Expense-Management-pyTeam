# Expense Management System - AI Agent Implementation Guide

## Project Overview
Implement a comprehensive expense reimbursement management system with multi-level approvals, conditional workflows, and OCR receipt scanning using Next.js and MongoDB.

## Tech Stack
- **Frontend**: Next.js (existing)
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with MongoDB adapter
- **OCR**: Tesseract.js or Google Vision API
- **APIs**: 
  - Countries/Currencies: https://restcountries.com/v3.1/all?fields=name,currencies
  - Currency Conversion: https://api.exchangerate-api.com/v4/latest/{BASE_CURRENCY}

---

## Phase 1: Database Setup & Schema Design

### Step 1.1: Install Dependencies
Install mongoose, next-auth with MongoDB adapter, bcryptjs, tesseract.js, axios, swr, zod, and @tanstack/react-query.

### Step 1.2: Create Database Connection
Create `lib/mongodb.ts` with connection pooling that reuses connections in development and creates new ones in production.

### Step 1.3: Create Mongoose Schemas

**Company Schema** (`models/Company.ts`)
- Fields: name, defaultCurrency, country, createdAt, updatedAt

**User Schema** (`models/User.ts`)
- Fields: email (unique), password, name, role (enum: ADMIN/MANAGER/EMPLOYEE), companyId (ref to Company), managerId (self-reference), isManagerApprover (boolean), timestamps

**Expense Schema** (`models/Expense.ts`)
- Fields: amount, originalCurrency, convertedAmount (in company currency), category, description, merchantName, date, status (enum: PENDING/APPROVED/REJECTED), employeeId (ref), companyId (ref), receiptUrl, currentApprovalStep, expenseLines (subdocument array), timestamps
- ExpenseLines subdocument: description, amount, quantity

**ApprovalRule Schema** (`models/ApprovalRule.ts`)
- Fields: companyId (ref), name, ruleType (enum: SEQUENTIAL/PERCENTAGE/SPECIFIC_APPROVER/HYBRID), percentageRequired, specificApproverId (ref), approvalSteps (subdocument array), isActive, timestamps
- ApprovalSteps subdocument: stepNumber, approverId (ref), isRequired

**ApprovalRequest Schema** (`models/ApprovalRequest.ts`)
- Fields: expenseId (ref), approverId (ref), stepNumber, status (enum: PENDING/APPROVED/REJECTED), comments, approvedAt, timestamps

---

## Phase 2: Authentication & User Management

### Step 2.1: Configure NextAuth with MongoDB
Create `app/api/auth/[...nextauth]/route.ts`:
- Use CredentialsProvider for email/password authentication
- Hash passwords with bcryptjs (10 salt rounds)
- Populate user with companyId on authentication
- Add JWT callback to include role, companyId, userId
- Add session callback to expose these in session object

Create `lib/mongodb-client.ts` for NextAuth adapter connection.

### Step 2.2: Create Company Auto-Creation on Signup
Create `app/api/auth/signup/route.ts`:
- Accept email, password, name, countryCode
- Check if user already exists
- Fetch currency from countries API using countryCode
- Create Company with defaultCurrency from API response
- Hash password and create Admin user linked to company
- Return userId and companyId

### Step 2.3: User Management API Routes

**POST /api/users/create**
- Admin role required
- Accept email, password, name, role, managerId, isManagerApprover
- Hash password and create user in admin's company

**PUT /api/users/[id]/role**
- Admin only, update user role

**PUT /api/users/[id]/manager**
- Admin only, assign or change manager for employee

**GET /api/users/company**
- Get all users in the authenticated user's company
- Support filtering by role

---

## Phase 3: Expense Submission & Management

### Step 3.1: Create Expense Submission API

**POST /api/expenses/create**
- Require authentication
- Accept amount, originalCurrency, category, description, merchantName, date, receiptUrl, expenseLines
- Fetch company's defaultCurrency
- Convert amount using exchange rate API
- Create Expense document with status PENDING
- Check if employee has managerId with isManagerApprover=true
- If yes, create ApprovalRequest for manager at stepNumber 0
- If no, initiate approval rule flow
- Return created expense

### Step 3.2: Currency Conversion Helper

Create `lib/currency.ts`:
- Function getExchangeRates(baseCurrency) - fetches rates from API and caches for 1 hour using Map
- Function convertCurrency(amount, fromCurrency, toCurrency) - uses cached rates
- Handle API errors gracefully
- Round converted amounts to 2 decimals

### Step 3.3: Expense History APIs

**GET /api/expenses/my-expenses**
- Employee role, return user's expenses with pagination
- Include approval status and approver info

**GET /api/expenses/[id]**
- Return expense details with populated employee and company
- Include all approval requests with comments

---

## Phase 4: Approval Workflow System

### Step 4.1: Approval Rule Configuration API

**POST /api/approval-rules/create**
- Admin only
- Accept name, ruleType, approvalSteps array, percentageRequired, specificApproverId
- Create rule for admin's company with isActive=true

**GET /api/approval-rules/company**
- Return active approval rules for company

**PUT /api/approval-rules/[id]/activate**
- Admin only, toggle isActive status

### Step 4.2: Approval Logic Implementation

Create `lib/approval-engine.ts`:

**Function initiateApprovalFlow(expenseId, ruleId)**
- Find rule and expense
- For SEQUENTIAL: Create only first step approval request, set currentApprovalStep
- For PERCENTAGE/SPECIFIC_APPROVER/HYBRID: Create approval requests for all approvers in rule

**Function processApproval(approvalRequestId, action, comments)**
- Find approval request and update status to APPROVED/REJECTED
- Add comments and approvedAt timestamp
- If REJECTED, set expense status to REJECTED and stop
- If APPROVED, check if approval is complete using checkApprovalCompletion
- For SEQUENTIAL type, create next step approval request if exists
- Update expense currentApprovalStep
- Return final status

**Function checkApprovalCompletion(expenseId, rule)**
- For SEQUENTIAL: Check if last step is approved
- For PERCENTAGE: Calculate approved count / total * 100, compare with percentageRequired
- For SPECIFIC_APPROVER: Check if specific approver approved
- For HYBRID: Return true if either percentage OR specific approver condition met
- Return boolean

### Step 4.3: Approval Action API

**POST /api/approvals/[id]/action**
- Manager or Admin role required
- Accept action (APPROVE/REJECT) and optional comments
- Verify approver matches current approval request
- Call processApproval function
- Return updated expense status

**GET /api/approvals/pending**
- Manager or Admin role
- Return approval requests where approverId matches user and status is PENDING
- Populate expense details with employee info
- Show amounts in company default currency

---

## Phase 5: OCR Receipt Scanning

### Step 5.1: File Upload Handler

**POST /api/upload/receipt**
- Accept file from FormData
- Validate file type (jpeg, png, jpg, pdf only) and size (max 5MB)
- Sanitize filename (remove special characters, limit length)
- Save to public/receipts directory with timestamp prefix
- Return public URL path

### Step 5.2: OCR Processing

Create `lib/ocr.ts`:

**Function extractReceiptData(imageUrl)**
- Use Tesseract.recognize with English language
- Pass extracted text to parseReceiptText
- Return structured data
- Handle OCR errors gracefully

**Function parseReceiptText(text)**
- Use regex to extract amount: look for "total", "amount", "sum" followed by currency symbols and numbers
- Use regex to extract date: match common date patterns (DD/MM/YYYY, MM-DD-YYYY, etc.)
- Extract merchant name from first lines of text
- Parse line items: look for pattern "description quantity x amount"
- Detect currency from symbols (₹=INR, €=EUR, £=GBP, ¥=JPY, $=USD default)
- Return object with amount, date, merchantName, originalCurrency, expenseLines, description, category

**POST /api/ocr/scan**
- Accept imageUrl
- Call extractReceiptData
- Return parsed data for user review
- Mark as requiresReview=true

---

## Phase 6: Dashboard & Views

### Step 6.1: Admin Dashboard API

**GET /api/dashboard/admin**
- Admin role required
- Count total, pending, approved, rejected expenses for company
- Aggregate total approved amount in company currency
- Aggregate top 5 spending categories with totals
- Fetch 10 most recent expenses with employee details
- Return all statistics

### Step 6.2: Manager Dashboard API

**GET /api/dashboard/manager**
- Manager role required
- Find all users where managerId equals current user
- Count pending approval requests for manager
- Count team's total and approved expenses
- Aggregate team spending by category
- Return statistics with team member count

### Step 6.3: Employee Dashboard API

**GET /api/dashboard/employee**
- Authenticated user
- Count personal expenses by status
- Fetch 10 most recent expenses
- Aggregate current month's spending
- Return summary statistics

---

## Phase 7: Additional Features

### Step 7.1: Notifications System

Create `lib/notifications.ts`:
- Configure nodemailer transporter with SMTP settings
- Function sendApprovalRequestEmail: sends email to approver with expense details
- Function sendApprovalStatusEmail: notifies employee when expense approved/rejected
- Include expense details and comments in email body

### Step 7.2: Audit Trail

Create `models/AuditLog.ts`:
- Fields: action, entityType, entityId, userId, details (mixed type), timestamp
- Log all important actions: expense creation, approvals, rejections, role changes

### Step 7.3: Report Generation

**GET /api/reports/expenses**
- Admin only
- Accept query params: startDate, endDate, status, category, employeeId
- Build MongoDB query with filters
- Find expenses matching criteria
- Populate employee details
- Calculate total amount and count
- Return expenses array with summary

### Step 7.4: Bulk Operations

**POST /api/expenses/bulk-approve**
- Manager or Admin role
- Accept array of approvalRequestIds and optional comments
- Loop through each ID and call processApproval
- Collect results and errors
- Return array of results with success/failure status

---

## Phase 8: Frontend Integration

### Step 8.1: Required Frontend Components

**Authentication Pages**
- Login form calling NextAuth signin
- Signup form with country selector calling /api/auth/signup
- Use useSession hook for session state

**Admin Panel**
- User management table with create/edit modals
- Role assignment dropdowns
- Manager assignment interface
- Approval rule configuration with step builder

**Expense Module**
- Submission form with file upload, OCR scan button, currency selector
- Display OCR results for user review and editing
- My Expenses table with status filters and pagination
- Expense detail modal showing approval flow

**Approvals Module**
- Pending approvals list card view
- Expense review with approve/reject buttons and comments
- Show amounts in company currency
- Display approval history

**Dashboards**
- Role-based views (admin/manager/employee)
- Charts using recharts for spending by category
- Statistics cards with counts
- Recent activity lists

### Step 8.2: API Client Hooks

Create hooks using React Query:
- useMyExpenses: fetches user's expenses
- useCreateExpense: mutation for submitting expenses
- usePendingApprovals: fetches approvals awaiting user action
- useProcessApproval: mutation for approve/reject actions
- Configure query client with appropriate staleTime and cacheTime

### Step 8.3: State Management
- Use React Query for all server state
- Use React Context for UI state (modals, filters, theme)
- Use NextAuth useSession for authentication state

### Step 8.4: Error Handling
- Create error boundary component
- Display API errors in toast notifications
- Implement retry logic for failed requests
- Show validation errors inline on forms

---

## Phase 9: Testing & Validation

### Step 9.1: Test Scenarios

**Authentication Flow**
- New user signup creates company and admin user with correct currency
- Login works with correct credentials
- Session persists and includes role, companyId
- Unauthorized access returns 401

**User Management**
- Admin can create employees and managers
- Admin can assign managers to employees
- Admin can change user roles
- isManagerApprover flag works correctly

**Expense Submission**
- Employee submits expense successfully
- Currency conversion calculates correctly
- Receipt upload works
- OCR extracts reasonable data
- User can edit OCR data before submission

**Approval Workflows**
- Manager approval triggers when isManagerApprover is true
- Sequential approval moves step by step
- Percentage rule approves when threshold met
- Specific approver rule works
- Hybrid rule approves on either condition
- Rejection stops flow immediately

**Currency Handling**
- Exchange rates fetch and cache correctly
- Conversion calculations are accurate
- Managers see company currency amounts
- Cache prevents excessive API calls

**Edge Cases**
- Invalid currency codes handled
- Missing approval rules default gracefully
- Deleted approver scenarios handled
- File upload validates type and size
- Network errors caught and displayed

### Step 9.2: Data Validation

Use Zod schemas for all API input validation:
- ExpenseSchema: validate amount, currency, category, dates
- UserSchema: validate email, password length, role
- ApprovalRuleSchema: validate percentages, step numbers
- Apply validation in all POST/PUT routes before database operations

---

## Phase 10: Deployment

### Step 10.1: Environment Variables

Create .env.local with:
- MONGODB_URI: connection string from MongoDB Atlas
- NEXTAUTH_SECRET: random secure string for JWT signing
- NEXTAUTH_URL: application URL
- EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD: SMTP settings for notifications
- GOOGLE_VISION_API_KEY: optional for enhanced OCR

### Step 10.2: MongoDB Setup

1. Create MongoDB Atlas account
2. Create new cluster and database
3. Whitelist application IP addresses or allow all (0.0.0.0/0)
4. Create database user with read/write permissions
5. Get connection string and add to MONGODB_URI
6. Create indexes for performance

### Step 10.3: Security Checklist

- Environment variables not in git
- Passwords hashed with bcrypt (10+ rounds)
- NextAuth secret is strong random string
- All API routes check authentication
- Role-based access control on all routes
- File uploads validate type and size
- Input sanitization with Zod
- Rate limiting on API routes
- CORS configured correctly

### Step 10.4: Performance Optimization

Create database indexes:
- User: email (unique), companyId
- Expense: employeeId + companyId + status, date descending
- ApprovalRequest: approverId + status, expenseId
- ApprovalRule: companyId + isActive

Enable query optimization:
- Use .lean() for read-only queries
- Use projection to limit returned fields
- Implement pagination on large lists
- Cache exchange rates for 1 hour

### Step 10.5: Deployment Steps

For Vercel:
- Install Vercel CLI and run vercel command
- Add all environment variables in dashboard
- Configure MongoDB connection string
- Set up custom domain

For other platforms:
- Build with npm run build
- Start with npm start
- Ensure Node.js version matches

---

## Implementation Priority Order

### Phase 1: Core Setup (Days 1-2)
1. Install all dependencies
2. Setup MongoDB connection with pooling
3. Create all Mongoose schemas (Company, User, Expense, ApprovalRule, ApprovalRequest)
4. Configure NextAuth with credentials provider
5. Create signup API with auto-company creation and currency fetch
6. Test authentication flow end-to-end

### Phase 2: Basic Features (Days 3-4)
7. Create user management APIs (create, update role, assign manager)
8. Build currency conversion helper with caching
9. Implement basic expense submission without OCR
10. Create expense history APIs with pagination
11. Test expense creation with different currencies

### Phase 3: Approval System (Days 5-7)
12. Implement manager-first approval check
13. Build sequential approval flow logic
14. Add percentage-based approval calculation
15. Implement specific approver rule
16. Create hybrid rule combining percentage and specific
17. Build approval request and action APIs
18. Test all approval scenarios thoroughly

### Phase 4: Advanced Features (Days 8-9)
19. Create file upload endpoint with validation
20. Integrate Tesseract.js for OCR
21. Build receipt text parsing with regex
22. Create OCR scan API endpoint
23. Test with various receipt formats

### Phase 5: Dashboards & UI (Days 10-11)
24. Build admin dashboard API with aggregations
25. Create manager dashboard API with team stats
26. Build employee dashboard API
27. Create React Query hooks for all endpoints
28. Connect frontend components to APIs
29. Implement error handling and loading states

### Phase 6: Polish & Deploy (Days 12-14)
30. Add email notification system
31. Implement audit logging for all actions
32. Build report generation API
33. Add bulk approval operations
34. Complete end-to-end testing
35. Deploy to production
36. Monitor and fix issues

---

## Key Implementation Notes

### Manager Approval First Logic
When creating expense, check if employee.managerId exists and employee.managerId.isManagerApprover is true. If yes, create approval request at stepNumber 0 for manager. After manager approves step 0, then initiate the configured approval rule flow. If no manager approval needed, start rule flow immediately.

### Handling Combined Flows
The system supports both manager approval AND rule-based approval together. Manager approval always happens first (step 0), then rule-based flow starts (step 1+). Track this with currentApprovalStep on expense document.

### Currency Display
Always display convertedAmount with company defaultCurrency to managers and admins. Never show originalCurrency amounts to approvers. Only show original amounts to the employee who submitted.

### OCR Best Practices
OCR is never 100% accurate. Always return extracted data to user for review before creating expense. Provide manual override for all fields. Store original receipt image regardless of OCR success.

### MongoDB Indexing
Create compound indexes on frequently queried field combinations. Index: companyId + status for filtering, employeeId + date for history, approverId + status for pending approvals. Add indexes after schema creation.

### Population Pattern
Use .populate() to join referenced documents. For expense details, populate both employeeId and companyId. For nested populations, use populate with path and nested populate object.

### Aggregation for Statistics
Use MongoDB aggregation pipeline for dashboards. Group by category for spending stats, sum convertedAmount for totals, count documents for statistics. Sort results appropriately.

### Caching Strategy
Cache exchange rates in memory Map for 1 hour. Check cache before API call. For production, consider Redis for distributed caching. Don't cache user-specific data.

---

## API Route Structure

```
/app/api
  /auth
    /[...nextauth]/route.ts - NextAuth configuration
    /signup/route.ts - User & company creation
  /users
    /create/route.ts - Create user (Admin)
    /[id]/role/route.ts - Update role
    /[id]/manager/route.ts - Assign manager
    /company/route.ts - List company users
  /expenses
    /create/route.ts - Submit expense
    /[id]/route.ts - Get expense details
    /my-expenses/route.ts - User's expenses
    /bulk-approve/route.ts - Bulk approve (Manager/Admin)
  /approvals
    /[id]/action/route.ts - Approve/Reject
    /pending/route.ts - Pending approvals
  /approval-rules
    /create/route.ts - Create rule (Admin)
    /[id]/route.ts - Get/Update rule
    /[id]/activate/route.ts - Toggle active
    /company/route.ts - Get company rules
  /ocr
    /scan/route.ts - Process receipt OCR
  /upload
    /receipt/route.ts - Upload receipt image
  /dashboard
    /admin/route.ts - Admin stats
    /manager/route.ts - Manager stats
    /employee/route.ts - Employee stats
  /reports
    /expenses/route.ts - Generate report
```

---

## Common MongoDB Patterns

**Population (Joins)**
Use .populate('fieldName') to load referenced documents. For nested refs, use .populate({ path: 'field', populate: { path: 'nested' } }).

**Aggregation Pipelines**
Use $match to filter, $group to aggregate, $sum/$avg for calculations, $sort for ordering. Chain stages with array of objects.

**Transactions**
For critical multi-document operations, use mongoose.startSession(), session.startTransaction(), pass session to operations, commit or abort, finally endSession.

**Lean Queries**
Use .lean() for read-only data to get plain JavaScript objects instead of Mongoose documents. Much faster but no methods.

**Projection**
Pass second argument to find() with field names to return only specific fields. Use 1 for include, 0 for exclude.

---

## Troubleshooting Guide

**MongoDB Connection Timeout**
- Verify MONGODB_URI format is correct
- Check IP whitelist in MongoDB Atlas
- Ensure cluster is not paused
- Test connection with MongoDB Compass

**NextAuth Session Issues**
- Verify NEXTAUTH_SECRET is set and consistent
- Check NEXTAUTH_URL matches your domain
- Clear browser cookies and test
- Review JWT and session callbacks

**Currency API Rate Limits**
- Caching should prevent this (1 hour cache)
- Consider alternative API (frankfurter.app)
- Store rates in database as backup
- Use paid tier for higher limits

**OCR Not Accurate**
- Ensure images are high quality (300+ DPI)
- Test with Google Vision API for comparison
- Provide manual entry fallback
- Parse common receipt formats specifically

**Approval Flow Not Progressing**
- Check ApprovalRequest status updates in DB
- Verify currentApprovalStep increments
- Review approval rule configuration
- Check checkApprovalCompletion logic
- Add console logs in approval engine

**File Upload Fails**
- Verify /public/receipts directory exists
- Check write permissions on directory
- Validate file size and type restrictions
- Consider cloud storage for production
- Check server upload size limits

---

## Success Criteria

✅ Admin can signup and company auto-creates with correct currency
✅ Admin can manage users, assign roles and managers
✅ Employees submit expenses with any currency
✅ Currency converts accurately to company default
✅ OCR extracts data from receipts reasonably well
✅ Manager approval works when isManagerApprover enabled
✅ Sequential multi-step approval flows correctly
✅ Percentage rule approves at correct threshold
✅ Specific approver rule triggers properly
✅ Hybrid rule works with OR logic
✅ Both manager and rule flows work together
✅ Approvers see amounts in company currency
✅ All roles see appropriate dashboards
✅ Notifications send on approval events
✅ Reports generate with filters
✅ System performs well under load

---

## Resources

- MongoDB Docs: https://www.mongodb.com/docs/
- Mongoose Docs: https://mongoosejs.com/docs/
- Next.js Docs: https://nextjs.org/docs
- NextAuth Docs: https://next-auth.js.org/
- Tesseract.js: https://tesseract.projectnaptha.com/
- React Query: https://tanstack.com/query/latest
- Zod Docs: https://zod.dev/

---

**Implementation Tips:**
- Start with Phase 1 and complete each phase before moving on
- Test each feature thoroughly before building next
- Use MongoDB Compass to inspect data during development
- Add console.logs liberally for debugging
- Commit code frequently with clear messages
- Deploy early and often to catch issues
- Monitor logs after deployment

**Good luck! Build systematically and test thoroughly.**