# Approval Rules Schema Migration Fix

## Problem

Getting error when creating approval rules:
```
ApprovalRule validation failed: ruleType: Rule type is required, name: Rule name is required
```

This happens because MongoDB is still using the old schema definition.

## Solutions

### Option 1: Drop Collection Manually (Recommended)

1. **Stop the dev server** (Ctrl+C)

2. **Connect to MongoDB** using MongoDB Compass or mongosh

3. **Drop the collection**:
   ```javascript
   use expense-tracker  // or your database name
   db.approvalrules.drop()
   ```

4. **Restart dev server**:
   ```bash
   npm run dev
   ```

5. **Try creating approval rule again** - should work now!

---

### Option 2: Run Migration Script

1. **Stop the dev server** (Ctrl+C)

2. **Run the migration script**:
   ```bash
   node scripts/migrate-approval-rules.js
   ```

3. **Restart dev server**:
   ```bash
   npm run dev
   ```

---

### Option 3: Quick Manual Fix (If you have data to preserve)

If you have existing approval rules you want to keep:

1. **Export existing rules** (if any):
   ```javascript
   db.approvalrules.find().pretty()
   // Copy the output
   ```

2. **Drop the collection**:
   ```javascript
   db.approvalrules.drop()
   ```

3. **Restart dev server**

4. **Recreate rules manually** through the UI

---

## Why This Happened

The ApprovalRule model was updated from:
```typescript
// OLD SCHEMA
{
  name: string,
  ruleType: "SEQUENTIAL" | "PERCENTAGE" | etc,
  approvalSteps: [...],
  ...
}
```

To:
```typescript
// NEW SCHEMA
{
  category: string,
  minAmount: number,
  maxAmount: number,
  approvers: ObjectId[],
  requireAllApprovers: boolean,
  minApprovalPercentage: number,
  specificApproverId: ObjectId,
  isManagerFirst: boolean,
  ...
}
```

MongoDB doesn't automatically migrate existing collections, so we need to drop and recreate it.

---

## Verification

After applying the fix, test by:

1. Go to **Admin → Approval Rules**
2. Click **Create Rule** tab
3. Fill in:
   - Category: "Travel"
   - Min Amount: 100
   - Max Amount: 5000
   - Add at least one approver
4. Click **Create Rule**

Should see success message: ✅ "Approval rule created successfully"

---

## Future Prevention

The model now includes this line to prevent caching issues:
```typescript
// Clear the model if it exists to force new schema
if (mongoose.models.ApprovalRule) {
  delete mongoose.models.ApprovalRule;
}
```

This ensures the new schema is always used.

---

## Need Help?

If you still get errors after trying all options:

1. **Check console logs** - Look for MongoDB connection errors
2. **Verify MongoDB is running** - `mongosh` should connect
3. **Check database name** - Ensure you're using the correct database
4. **Restart everything** - Stop dev server, restart MongoDB, start dev server

---

*Created: December 2024*
