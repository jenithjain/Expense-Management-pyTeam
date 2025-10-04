# Approval Rules Approver Structure Fix

## Problem
When creating approval rules, the API was receiving a `CastError` because the `approvers` field was being sent as an array of objects, but the MongoDB schema expected an array of `ObjectId` references.

### Error Message
```
ApprovalRule validation failed: approvers.0: Cast to [ObjectId] failed for value "[\n' +
  '  {\n' +
  "    approverId: '68e0c4b97224ec2f8d6abc4b',\n" +
  "    approverName: 'Manager1',\n" +
  '    stepNumber: 0,\n' +
  '    required: true\n' +
  '  }\n' +
  ']" (type string) at path "approvers.0"
```

## Root Cause
The frontend component (`approval-rules-management.tsx`) was designed to work with a rich approver structure containing:
- `approverId`: The user's ObjectId
- `approverName`: The user's display name
- `stepNumber`: The approval sequence order
- `required`: Whether this approver is mandatory

However, the MongoDB schema in `models/ApprovalRule.ts` only supported an array of ObjectIds without the additional metadata.

## Solution

### 1. Updated ApprovalRule Model (`models/ApprovalRule.ts`)

Added a new `IApprover` interface and `ApproverSchema`:

```typescript
export interface IApprover {
  approverId: Types.ObjectId;
  approverName: string;
  stepNumber: number;
  required: boolean;
}

const ApproverSchema = new Schema<IApprover>({
  approverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  approverName: {
    type: String,
    required: true,
  },
  stepNumber: {
    type: Number,
    required: true,
    default: 0,
  },
  required: {
    type: Boolean,
    default: true,
  },
}, { _id: false });
```

Updated the main schema to use the new approver structure:
```typescript
approvers: [ApproverSchema]
```

### 2. Updated API Route (`app/api/approval-rules/route.ts`)

Added processing to convert `approverId` strings to ObjectIds before saving:

```typescript
// Convert approverId strings to ObjectIds
const processedApprovers = approvers.map((approver: any) => ({
  approverId: new mongoose.Types.ObjectId(approver.approverId),
  approverName: approver.approverName,
  stepNumber: approver.stepNumber,
  required: approver.required !== false,
}));
```

### 3. Updated Approval Engine (`lib/approval-engine.ts`)

Modified the `initiateApprovalFlow` function to work with the new approver structure:

```typescript
// Sort by stepNumber to ensure correct order
const sortedApprovers = [...rule.approvers].sort((a, b) => a.stepNumber - b.stepNumber);

for (const approver of sortedApprovers) {
  await ApprovalRequest.create({
    expenseId: expense._id,
    approverId: approver.approverId,
    stepNumber: approver.stepNumber,
    status: ApprovalStatus.PENDING,
  });
}
```

### 4. Migration Script

Created `scripts/migrate-approver-structure.js` to convert any existing approval rules from the old format to the new format.

## Benefits of the New Structure

1. **Sequential Approvals**: The `stepNumber` field allows explicit control over approval order
2. **Optional Approvers**: The `required` field enables flexible approval workflows
3. **Better UX**: Storing `approverName` reduces database lookups when displaying rules
4. **Type Safety**: The new structure provides better TypeScript support

## Testing

To test the fix:

1. **Run the migration script** (if you have existing approval rules):
   ```bash
   node scripts/migrate-approver-structure.js
   ```

2. **Create a new approval rule**:
   - Navigate to Admin Dashboard → Approval Rules
   - Click "Create Rule"
   - Select a category
   - Add one or more approvers
   - Set amount thresholds (optional)
   - Save the rule

3. **Verify the rule**:
   - Switch to "Existing Rules" tab
   - Confirm the rule displays correctly with approver names and sequence

4. **Test approval workflow**:
   - Log in as an employee
   - Submit an expense matching the rule criteria
   - Log in as the assigned approver(s)
   - Verify the approval appears in their dashboard

## Files Modified

- ✅ `models/ApprovalRule.ts` - Updated schema to support rich approver structure
- ✅ `app/api/approval-rules/route.ts` - Added ObjectId conversion
- ✅ `lib/approval-engine.ts` - Updated to work with new approver structure
- ✅ `scripts/migrate-approver-structure.js` - Migration script (new file)

## Migration Required

If you have existing approval rules in your database, you **must** run the migration script:

```bash
cd e:\Amalthea\expense-tracker
node scripts/migrate-approver-structure.js
```

This will convert existing rules from the old format to the new format without data loss.
