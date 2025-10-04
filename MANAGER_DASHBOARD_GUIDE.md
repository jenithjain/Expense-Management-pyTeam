# Manager Dashboard Guide

## 🎯 Overview

The Manager Dashboard provides comprehensive insights into your approval responsibilities and team performance. Track pending approvals, review team expenses, and monitor spending patterns all in one place.

---

## 📊 Dashboard Sections

### 1. **Approval Statistics**

Real-time metrics about your approval activity:

| Metric | Description |
|--------|-------------|
| **Pending** | Number of expenses awaiting your approval |
| **Approved (Month)** | Expenses you approved this month |
| **Rejected (Month)** | Expenses you rejected this month |
| **Total Approved** | All-time approved count |
| **Total Rejected** | All-time rejected count |

**🎨 Visual Indicators:**
- 🔵 Blue: Pending items
- 🟢 Green: Approved items
- 🔴 Red: Rejected items

---

### 2. **Total Pending Amount**

Large, prominent card showing the total monetary value of all expenses awaiting your approval.

**Example:**
```
💵 Total Pending Amount
   $12,450.75 USD
```

---

### 3. **Team Statistics**

Overview of your team's expense activity:

| Metric | Description |
|--------|-------------|
| **Team Members** | Number of employees reporting to you |
| **Total Expenses** | All expenses submitted by your team |
| **Pending** | Team expenses awaiting approval |
| **Approved** | Team expenses that have been approved |

**Total Team Spending Card:**
Shows the total approved spending by your team members.

---

### 4. **Team Spending by Category**

Breakdown of approved expenses by category:
- Travel
- Meals
- Accommodation
- Office Supplies
- Software
- Other

Each category shows:
- Total amount spent
- Number of expenses
- Currency

**Example Card:**
```
Travel                    3 expenses
$5,240.50 USD
```

---

### 5. **Your Team**

Visual cards showing each team member:
- Avatar with initial
- Full name
- Email address
- Role (employee/manager)

**No Team Message:**
If you have no team members assigned:
```
👥 No Team Members Yet
Ask your admin to assign employees to you as their manager.
```

---

### 6. **Recent Approval Activity**

Timeline of your last 5 approval actions:
- Merchant name
- Employee who submitted
- Amount and currency
- Status badge (Approved/Rejected)

---

## 🔍 How It Works

### **Data Sources**

The dashboard pulls data from multiple sources:

1. **Approval Requests**: Your personal approval queue
2. **Team Members**: Users where `managerId` equals your user ID
3. **Team Expenses**: All expenses submitted by team members
4. **Company Settings**: Default currency

### **Real-Time Updates**

- Dashboard refreshes when you navigate to it
- Recent approvals update after you approve/reject an expense
- Team statistics update when team members submit expenses
- Spending totals update when expenses are approved

---

## 📋 Manager Workflow

### **Daily Routine**

1. **Check Pending Approvals**
   - See count in blue "Pending" card
   - Note total pending amount
   - Navigate to "Pending Approvals" tab

2. **Review Team Activity**
   - Check team spending by category
   - Identify high-spending categories
   - Monitor team member activity

3. **Process Approvals**
   - Go to "Pending Approvals" tab
   - Review each expense detail
   - Approve or reject with comments

### **Weekly Review**

1. **Analyze Spending Trends**
   - Review approved vs rejected ratios
   - Check category spending patterns
   - Identify unusual spending

2. **Team Management**
   - Verify team member list is current
   - Check if any team members have excessive pending items
   - Follow up on rejected expenses

### **Monthly Review**

1. **Performance Metrics**
   - Review "Approved (Month)" count
   - Review "Rejected (Month)" count
   - Compare with previous months

2. **Budget Analysis**
   - Review total team spending
   - Compare against budget allocations
   - Identify cost-saving opportunities

---

## 🎨 Visual Design

### **Color Coding**

- **Blue (🔵)**: Pending, awaiting action
- **Green (🟢)**: Approved, completed successfully
- **Red (🔴)**: Rejected, denied
- **Purple (🟣)**: Team-related metrics
- **Orange (🟠)**: Warnings or attention needed

### **Card Styles**

- **Gradient Cards**: Important totals (Pending Amount, Team Spending)
- **Hover Effects**: Cards brighten on hover for better interaction
- **Icons**: Lucide React icons for visual clarity
- **Badges**: Category counts, status indicators

---

## 🔧 Technical Details

### **API Endpoint**

```
GET /api/dashboard/manager
```

**Returns:**
```json
{
  "pendingApprovals": 12,
  "approvedThisMonth": 45,
  "rejectedThisMonth": 3,
  "totalApproved": 234,
  "totalRejected": 18,
  "pendingAmount": 12450.75,
  "currency": "USD",
  "recentApprovals": [...],
  "teamStatistics": {
    "teamMemberCount": 8,
    "totalTeamExpenses": 156,
    "pendingTeamExpenses": 12,
    "approvedTeamExpenses": 132,
    "totalTeamSpending": 45600.25
  },
  "teamSpendingByCategory": [...],
  "teamMembers": [...]
}
```

### **Team Member Query**

Finds users where:
```typescript
User.find({ managerId: currentManagerId })
```

### **Team Expense Query**

Finds expenses where:
```typescript
Expense.find({ 
  employeeId: { $in: teamMemberIds },
  status: ExpenseStatus.APPROVED
})
```

---

## 🐛 Troubleshooting

### **No Team Members Showing**

**Problem**: "No Team Members Yet" message appears but you should have team members.

**Possible Causes:**
1. No employees assigned to you as manager
2. Database managerId field not set correctly
3. Session user ID mismatch

**Solutions:**
1. Ask admin to assign employees in User Management
2. Check browser console for errors
3. Verify your user ID in session

**Debug Steps:**
```javascript
// Open browser console (F12)
// Check the dashboard data
console.log('Manager dashboard data:', dashData)
// Look for teamMembers array and teamStatistics
```

---

### **Team Expenses Not Showing**

**Problem**: Team statistics show 0 expenses but team members have submitted expenses.

**Possible Causes:**
1. Expenses not yet approved
2. Expenses belong to different company
3. Database query issue

**Solutions:**
1. Check "Pending Approvals" tab
2. Verify expenses are from same company
3. Check console for API errors

---

### **Pending Amount Incorrect**

**Problem**: Pending amount doesn't match expected total.

**Possible Causes:**
1. Currency conversion issues
2. Some expenses not assigned to you for approval
3. Approval rules routing to different manager

**Solutions:**
1. Check individual expense amounts in "Pending Approvals"
2. Verify approval rules in Admin panel
3. Check if expenses have multiple approvers

---

### **Recent Approvals Not Updating**

**Problem**: Just approved an expense but it doesn't show in recent activity.

**Possible Causes:**
1. Page needs refresh
2. API cache issue
3. Approval status not updated correctly

**Solutions:**
1. Refresh the page
2. Navigate away and back to dashboard
3. Check expense status in "Pending Approvals" tab

---

## 📈 Best Practices

### **1. Regular Monitoring**
- Check dashboard daily for pending approvals
- Don't let pending approvals accumulate
- Review team spending weekly

### **2. Clear Communication**
- Add comments when rejecting expenses
- Provide feedback on unusual spending
- Communicate approval policies to team

### **3. Budget Management**
- Monitor team spending by category
- Set expectations for spending limits
- Flag unusual patterns early

### **4. Team Support**
- Respond to approval requests promptly
- Provide guidance on expense policies
- Help team understand rejection reasons

### **5. Data-Driven Decisions**
- Use spending trends to inform budget planning
- Identify cost-saving opportunities
- Share insights with leadership

---

## 🚀 Features in Action

### **Example: Processing Approvals**

1. **Dashboard shows:**
   ```
   Pending: 5 approvals
   Pending Amount: $2,450.75
   ```

2. **Navigate to "Pending Approvals" tab**

3. **Review each expense:**
   - Check merchant, amount, category
   - View receipt if available
   - Read description

4. **Make decision:**
   - Click "Review" button
   - Add optional comments
   - Click "Approve" or "Reject"

5. **Dashboard updates:**
   ```
   Pending: 4 approvals
   Approved (Month): +1
   Pending Amount: $1,950.25
   ```

### **Example: Team Analysis**

**Dashboard shows:**
```
Team Members: 8
Total Team Spending: $45,600.25

Spending by Category:
- Travel: $18,500.00 (42 expenses)
- Meals: $12,300.50 (89 expenses)
- Software: $8,400.75 (15 expenses)
```

**Analysis:**
- Travel is highest category → Review travel policy
- Meals have most expenses → Check per-diem compliance
- Software costs high → Consider bulk licensing

---

## ✅ Summary

The Manager Dashboard provides:
- ✅ **Real-time approval metrics** - Know what needs your attention
- ✅ **Team performance insights** - Monitor team spending patterns
- ✅ **Spending breakdowns** - Understand where money goes
- ✅ **Recent activity timeline** - Track your approval history
- ✅ **Team member overview** - See who reports to you
- ✅ **Visual, intuitive design** - Easy to understand at a glance

**Key Benefits:**
1. 📊 Data-driven expense management
2. ⚡ Quick approval status overview
3. 👥 Team performance visibility
4. 💰 Budget monitoring and control
5. 🎯 Clear action items (pending approvals)

---

*Last Updated: December 2024*
