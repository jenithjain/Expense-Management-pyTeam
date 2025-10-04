# User Management Guide

## 🎯 Overview

The User Management system provides comprehensive controls for creating users, assigning roles, and managing reporting hierarchies within your organization.

---

## 📋 Features

### ✅ **Create New Users**
- Add users with name, email, password, role, and optional manager
- Inline form at the top of the user table
- Real-time validation

### ✅ **Role Management**
- Three role types: **Employee**, **Manager**, **Admin**
- Change roles dynamically via dropdown
- **Protected Admin Roles**: Admin users cannot have their roles changed for security

### ✅ **Manager Assignment**
- Assign managers to any user
- Remove manager assignments
- Prevent self-assignment (users can't be their own manager)
- Visual feedback showing current manager
- Dynamic dropdown showing only users with manager/admin roles

### ✅ **Search & Filter**
- Search users by name or email
- Real-time filtering
- Clear "no results" messaging

---

## 🔐 Role Types

### **Employee**
- Default role for new users
- Can submit expenses
- Can view their own expense history
- Dashboard shows personal statistics

### **Manager**
- All employee permissions
- Can approve/reject expenses
- Can view pending approvals dashboard
- Can be assigned as manager to other users
- Appears in manager assignment dropdowns

### **Admin**
- All manager permissions
- Full access to admin panel
- Can create/manage users
- Can configure approval rules
- Can view company-wide expenses
- Can manage company settings
- **Protected role** - cannot be changed once assigned

---

## 🎨 User Interface

### **User Table Columns**

| Column | Description |
|--------|-------------|
| **User** | Name with "Protected" badge for admins |
| **Role** | Dropdown to change role (disabled for admins) |
| **Manager** | Dropdown to assign/change manager |
| **Email** | User's email address |
| **Actions** | Shows current manager assignment |

### **Visual Indicators**

- 🛡️ **Protected Badge**: Blue badge with shield icon for admin users
- 🔒 **Disabled Dropdown**: Grayed out role selector for admins
- 📊 **Role Display**: Shows role in manager dropdown: "John Doe (manager)"
- ⚠️ **No Managers Available**: Helpful message when no managers exist

---

## 📖 How to Use

### **Creating a New User**

1. **Fill in the top row**:
   - Name: Full name of the user
   - Role: Select Employee, Manager, or Admin
   - Manager: Select a manager or "No Manager"
   - Email: User's email address
   - Password: Initial password (user should change after first login)

2. **Click "Add user"**

3. **Result**:
   - User appears in table below
   - Toast notification confirms creation
   - Form resets for next user
   - If role is Manager/Admin, they now appear in manager dropdowns

### **Changing User Roles**

1. **Locate user in table**
2. **Click Role dropdown**
3. **Select new role**:
   - **To Manager**: User can now approve expenses and be assigned as manager
   - **To Admin**: User gets full admin access (cannot be changed back!)
   - **To Employee**: User loses manager/admin privileges

4. **Result**:
   - Role updates immediately
   - Toast notification confirms change
   - Manager dropdowns refresh to include/exclude user

**⚠️ Important**: Admin roles are protected and **cannot be changed** for security reasons.

### **Assigning Managers**

1. **Locate user in table**
2. **Click Manager dropdown**
3. **Select manager**:
   - Choose from available managers/admins
   - Or select "No Manager" to remove assignment

4. **Result**:
   - Manager updates immediately
   - Toast notification confirms assignment
   - Actions column shows new manager name

### **Removing Manager Assignment**

1. Click Manager dropdown for user
2. Select "No Manager"
3. Manager assignment is cleared

### **Searching Users**

1. Type in search box at top
2. Results filter by name or email
3. Clear search to see all users

---

## 🔍 Debugging

### **No Managers in Dropdown?**

**Check browser console** (F12):
- Look for `Fetched users:` log
- Look for `Managers found:` log

**Possible causes**:
1. **No managers exist yet**
   - Solution: Create a user with role "Manager" or "Admin"

2. **All users are employees**
   - Solution: Change at least one user's role to Manager

3. **Case sensitivity issue**
   - Solution: Already handled with `.toLowerCase()` filter

4. **User filtering out themselves**
   - Expected behavior: Users can't be their own manager

### **Role Change Not Working?**

1. **Check if user is admin**
   - Admin roles are protected and cannot be changed
   - Look for "Protected" badge next to name

2. **Check console for errors**
   - API might be returning an error
   - Network tab shows request/response

3. **Check permissions**
   - Only admins can change roles

### **Manager Assignment Not Saving?**

1. **Check browser console**
   - Look for API errors
   - Look for `Fetched users:` after assignment

2. **Verify manager exists**
   - Manager must have role "manager" or "admin"
   - Manager cannot be the user themselves

3. **Check network tab**
   - API endpoint: `/api/users/assign-manager`
   - Method: PATCH
   - Body: `{ userId, managerId }`

---

## 🛠️ Technical Details

### **API Endpoints**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/company` | GET | Fetch all users in company |
| `/api/users/create` | POST | Create new user |
| `/api/users/update-role` | PATCH | Update user role |
| `/api/users/assign-manager` | PATCH | Assign/remove manager |

### **Role Filter Logic**

```typescript
const managers = users.filter((u) => {
  const role = u.role?.toLowerCase()
  return role === "manager" || role === "admin"
})
```

- Case-insensitive matching
- Filters users with manager OR admin role
- Excludes employees from manager dropdowns

### **Admin Protection**

```typescript
async function handleUpdateRole(userId, newRole, currentRole) {
  if (currentRole === "admin") {
    toast({
      title: "Cannot change admin role",
      description: "Admin users cannot have their role changed for security reasons.",
      variant: "destructive",
    })
    return
  }
  // ... proceed with role change
}
```

### **Self-Assignment Prevention**

```typescript
{managers
  .filter((m) => m._id !== u._id) // Don't allow self-assignment
  .map((m) => (
    <SelectItem key={m._id} value={m._id}>
      {m.name} ({m.role})
    </SelectItem>
  ))
}
```

---

## 🎓 Best Practices

### **1. Create Admin First**
When setting up a new system:
1. Create at least one Admin user
2. Use a strong password
3. Admin role is permanent - choose wisely!

### **2. Organize Hierarchy**
- Create Managers before assigning them to Employees
- Use clear naming conventions
- Document reporting structure outside the system

### **3. Security**
- Admin roles are protected for a reason - don't work around it
- Users should change their initial passwords
- Review user roles periodically

### **4. Manager Assignments**
- Not all users need managers
- Managers don't need managers (unless multi-level hierarchy)
- Update manager assignments when org structure changes

---

## 🐛 Known Limitations

1. **Cannot demote admins** - By design for security
2. **No bulk operations** - Must update users one at a time
3. **No user deletion** - Prevents data loss (can be added if needed)
4. **No password reset** - Users must contact admin
5. **No multi-level approval display** - Just shows direct manager

---

## 🚀 Future Enhancements

- [ ] Bulk user import (CSV upload)
- [ ] User deactivation (soft delete)
- [ ] Password reset functionality
- [ ] Email invitations for new users
- [ ] Org chart visualization
- [ ] Multi-level manager hierarchy display
- [ ] User activity logs
- [ ] Role permissions customization

---

## ✅ Summary

The User Management system provides:
- ✅ Dynamic role changes (except protected admins)
- ✅ Flexible manager assignment
- ✅ Case-insensitive role filtering
- ✅ Visual feedback and protection indicators
- ✅ Real-time updates and validation
- ✅ Debug logging for troubleshooting

**Key Security Feature**: Admin roles are permanently protected and cannot be changed, ensuring system stability and preventing accidental privilege loss.

---

*Last Updated: December 2024*
