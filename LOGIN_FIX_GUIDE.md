# Login Issue - Fixed & Debug Guide

## 🐛 Issue: Login Returns 401 (Unauthorized)

**Problem:** Created a manager user but unable to login - getting 401 error on POST `/api/auth/callback/credentials`

---

## ✅ Fixes Applied

### 1. **Improved Login Error Handling** (`app/api/auth/[...nextauth]/route.ts`)

**Changes:**
- ✅ Removed `.populate('companyId')` which could cause errors if Company doesn't exist
- ✅ Changed from throwing errors to returning `null` (NextAuth best practice)
- ✅ Added console.log statements for debugging
- ✅ Added try-catch block to prevent crashes
- ✅ Made companyId optional with fallback: `user.companyId?.toString() || ''`

**Before:**
```typescript
const user = await User.findOne({ email }).populate('companyId');
if (!user) throw new Error('Invalid email or password');
```

**After:**
```typescript
const user = await User.findOne({ email });
if (!user) {
  console.log('User not found:', credentials.email);
  return null;
}
```

### 2. **Enhanced Frontend Logging** (`components/auth/login-form.tsx`)

Added detailed console logging to track login attempts:
```typescript
console.log('Attempting login with email:', form.email)
console.log('Login result:', result)
console.error('Login error:', result.error)
```

### 3. **Debug Endpoint Created** (`/api/auth/debug-user`)

Check if a user exists in the database:
```
GET /api/auth/debug-user?email=manager@example.com
```

---

## 🔍 How to Debug

### Step 1: Check if User Exists
Visit in browser:
```
http://localhost:3000/api/auth/debug-user?email=MANAGER_EMAIL_HERE
```

**Expected Response:**
```json
{
  "found": true,
  "user": {
    "_id": "...",
    "email": "manager@example.com",
    "name": "Manager Name",
    "role": "MANAGER",
    "companyId": "...",
    "managerId": null
  }
}
```

### Step 2: Check Browser Console
Open browser DevTools → Console tab when logging in. You should see:
```
Attempting login with email: manager@example.com
Login result: { ok: true, status: 200, ... }
```

### Step 3: Check Server Logs (Terminal)
Look for these logs in your terminal running `npm run dev`:
- `User not found: [email]` - User doesn't exist
- `Invalid password for user: [email]` - Wrong password
- `Login error: [error message]` - Other errors

---

## 🔑 Common Login Issues & Solutions

### Issue 1: "User not found"
**Cause:** Email doesn't exist in database
**Solution:** 
1. Check user was created: Visit `/api/auth/debug-user?email=...`
2. Re-create user from admin panel if needed
3. Verify email is lowercase (emails are stored lowercase)

### Issue 2: "Invalid password"
**Cause:** Password doesn't match hashed password in database
**Solution:**
1. Ensure you're using the exact password used during signup
2. Password is case-sensitive
3. Try resetting password or creating new user

### Issue 3: "Missing companyId"
**Cause:** User created without companyId
**Solution:** 
- Users created by admin should inherit admin's companyId automatically
- Check the user in debug endpoint - companyId should not be null

### Issue 4: 401 without specific error
**Cause:** Database connection issue or user schema mismatch
**Solution:**
1. Check MongoDB URI in `.env.local` is correct
2. Restart development server: `npm run dev`
3. Check database is accessible

---

## ✨ Test the Fix

1. **Restart your dev server:**
   ```powershell
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Try logging in with the manager account**
   - Email: The email you used when creating the manager
   - Password: The password you set

3. **Check console logs:**
   - Browser console (F12)
   - Terminal (where npm run dev is running)

4. **If still failing:**
   - Visit `/api/auth/debug-user?email=YOUR_EMAIL`
   - Share the response and any error messages

---

## 📝 Notes

- ✅ Login now returns `null` instead of throwing errors (NextAuth best practice)
- ✅ CompanyId is optional to prevent populate errors
- ✅ All errors are logged to console for debugging
- ✅ Frontend shows user-friendly error message
- ✅ Debug endpoint available to check user data

**Your login should work now!** 🎉
