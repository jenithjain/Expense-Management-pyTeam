# 💼 Expense Management System

An intelligent, scalable expense management platform designed to **automate** and **streamline** reimbursement workflows for modern companies.

This system replaces time-consuming manual processes with a **transparent, rule-based engine**, featuring **multi-level approvals** and **OCR-powered receipt scanning**.

---

## 🎯 Problem Statement

Companies often struggle with **manual expense reimbursement processes** that are:
- Inefficient
- Prone to errors
- Lacking transparency

This project solves these challenges by providing a robust platform to:
- Define **dynamic, multi-level approval flows** based on custom rules and thresholds.
- Automate expense creation using **advanced OCR technology**.
- Provide **clear visibility** into the status of all expense claims for employees, managers, and admins.

---

## ✨ Core Features

### 1. Authentication & User Management

- **Automated Company Onboarding**:  
  A new company and an Admin user are automatically created on first signup, with the default currency set by country selection.

- **Role-Based Access Control**:  
  - **Admin**: Manages users, sets roles, configures approval rules, views all expenses.  
  - **Manager**: Approves/rejects team expenses, views team spending.  
  - **Employee**: Submits and tracks their own expenses.

- **Hierarchy Definition**:  
  Admins can define manager-employee relationships to build the approval structure.

---

### 2. Expense Submission (Employee)

- **Effortless Submission**:  
  Employees can submit claims with:
  - Amount (supports multi-currency)
  - Category
  - Description
  - Date

- **Receipt Upload**:  
  Attach receipt images or PDFs to each claim.

- **Transparent History**:  
  View all submitted expenses with their current status:
  - Pending
  - Approved
  - Rejected

---

### 3. Dynamic Approval Workflow (Manager & Admin)

- **Multi-Level Approvals**:  
  Define a sequential chain of approvers (e.g., Manager → Finance → Director).

- **Conditional Logic**:
  - **Percentage Rule**: Approve if X% of approvers agree (e.g., 60%).
  - **Specific Approver Rule**: Auto-approve if a key person (e.g., CFO) approves.
  - **Hybrid Rules**: Combine multiple conditions for flexibility.

- **Manager Dashboard**:  
  View and act on pending approvals with options to **approve, reject, or comment**.

---

## 🚀 Advanced Features

### 🤖 OCR for Receipts (Auto-Read)

- Uses **Google Vision API** to auto-fill expense form by extracting:
  - Merchant Name
  - Total Amount
  - Date
  - Expense Category
  - Line Items

### 💬 AI Chatbot Assistant (Planned)

- A conversational AI assistant to help users:
  - **Check expense status**  
    > "Where is my expense for the client lunch?"
  - **Understand policy**  
    > "What's the daily limit for hotel stays in Mumbai?"
  - **Submit expenses via chat**

---

## 🛠️ Technology Stack

- **Frontend**: Next.js, Tailwind CSS  
- **Backend** : Next.js.
- **DataBase** : MongoDB
- **Visuals**: Three.js  
- **OCR Service**: Google Cloud Vision API  
- **External APIs**:
  - Countries & Currencies: [restcountries.com](https://restcountries.com)
  - Currency Conversion: [exchangerate-api.com](https://www.exchangerate-api.com)

---

## ⚙️ Getting Started


### Installation & Setup

1. **Clone the repository**:

```bash
git clone https://github.com/your-username/expense-management-system.git
cd expense-management-system
