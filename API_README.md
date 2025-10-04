# Expense Management System

A comprehensive expense reimbursement management system with multi-level approvals, conditional workflows, and OCR receipt scanning built with Next.js and MongoDB.

## Features

- 🔐 **Authentication & Authorization** - NextAuth.js with role-based access (Admin, Manager, Employee)
- 💰 **Expense Management** - Create, track, and manage expense submissions
- 🌍 **Multi-Currency Support** - Automatic currency conversion with real-time exchange rates
- 📸 **OCR Receipt Scanning** - Extract data from receipts using Tesseract.js
- ✅ **Flexible Approval Workflows** - Sequential, percentage-based, specific approver, and hybrid rules
- 📊 **Role-Based Dashboards** - Custom dashboards for Admin, Manager, and Employee
- 👥 **User Management** - Create and manage company users with hierarchical structure
- 📈 **Analytics** - Spending reports by category, employee, and time period

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js
- **OCR**: Tesseract.js
- **UI Components**: Radix UI, shadcn/ui

## Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or MongoDB Atlas)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/expense-tracker

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

### 3. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Documentation

See [API_DOCS.md](./API_DOCS.md) for complete API documentation.

## User Roles

- **Admin**: Full access, user management, approval rules
- **Manager**: Team management, approve team expenses
- **Employee**: Submit expenses, track status

## Project Structure

```
expense-tracker/
├── app/api/          # API routes
├── models/           # Mongoose schemas
├── lib/              # Utility functions
├── components/       # React components
└── types/            # TypeScript types
```

## License

MIT License
