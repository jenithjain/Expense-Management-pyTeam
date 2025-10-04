# AI Chatbot Assistant - Implementation Guide

## Overview

The Expense Management System now includes an intelligent AI chatbot powered by **Gemini 2.0 Flash**, designed to assist employees, managers, and admins with expense-related queries, policy questions, and system navigation.

## Features

### 🎯 Role-Based Assistance

The chatbot adapts its responses based on the user's role:

#### **For Employees**
- **Status & Transparency**: Check expense status, approval progress, rejection reasons, reimbursement timelines
- **Company Policy**: Per diem rates, expense limits, receipt requirements, claimable expenses
- **How-To Guidance**: Submit expenses, handle foreign currency, deal with lost receipts, create reports
- **Proactive Reminders**: Pending submissions, deadlines, unsubmitted receipts

Example Questions:
- "What is the status of my expense from last week?"
- "Who is approving my ₹8,500 expense?"
- "What's the per diem for travel to Delhi?"
- "How do I submit a foreign currency expense?"
- "Do I need a receipt for expenses under ₹500?"

#### **For Managers**
- **Approval Workflow**: View pending approvals, filter by amount/team member, display approval chains
- **Team Analytics**: Spending summaries, top spenders, category breakdowns, budget tracking
- **Quick Actions**: Approve/reject directly from chat (future feature)
- **Team Management**: Spending patterns and compliance monitoring

Example Questions:
- "How many expenses are pending my approval?"
- "Show pending expenses over ₹10,000"
- "What's my team's total spend this quarter?"
- "Who are the top 5 spenders on my team?"
- "Which category does my team spend most on?"

#### **For Admins**
- **System Configuration**: Approval rules, user assignments, department settings, workflow configurations
- **User Management**: User roles, manager assignments, access permissions
- **Policy Management**: Active policies, approval thresholds, rule sequences
- **System Analytics**: Company-wide spending insights and compliance metrics

Example Questions:
- "Who is Sameer Gupta's manager?"
- "What's the approval rule for Marketing department?"
- "Show approver sequence for expenses over ₹50,000"
- "Is CFO auto-approval active?"
- "How many users are in the system?"

## Implementation

### Files Created

1. **`lib/gemini-chatbot.ts`** - Core chatbot logic with Gemini AI integration
2. **`app/api/chatbot/route.ts`** - API endpoint for chatbot requests
3. **`components/shared/chatbot.tsx`** - Reusable chatbot UI component
4. **`app/employee/assistant/page.tsx`** - Dedicated assistant page for employees
5. **`app/manager/assistant/page.tsx`** - Dedicated assistant page for managers
6. **`app/admin/assistant/page.tsx`** - Dedicated assistant page for admins

### Integration Points

#### Floating Chatbot (Employee & Manager Pages)
```tsx
import { Chatbot } from "@/components/shared/chatbot"

<Chatbot 
  variant="floating"
  placeholder="Ask about expenses, policies, or status..."
  suggestedQuestions={[
    "What's the status of my latest expense?",
    "Show me my pending expenses"
  ]}
/>
```

#### Embedded Chatbot (Dedicated Pages)
```tsx
<Chatbot 
  variant="embedded"
  placeholder="Ask me anything..."
  suggestedQuestions={["Question 1", "Question 2"]}
/>
```

## Configuration

### Environment Variables

Ensure `GEMINI_API_KEY` is set in your `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env.local`

## Usage

### For Employees

1. **Floating Button**: Click the purple floating button in the bottom-right corner on the dashboard
2. **Dedicated Page**: Navigate to the "AI Assistant" section from the employee menu
3. **Ask Questions**: Type your question or click on suggested questions
4. **Get Instant Answers**: Receive contextual, role-specific responses

### For Managers

1. **Floating Button**: Available on the manager dashboard
2. **Dedicated Page**: Access via the manager navigation menu
3. **Quick Insights**: Get team analytics and approval summaries instantly

### For Admins

1. **Sidebar Navigation**: Click "AI Assistant" in the admin sidebar
2. **System Queries**: Ask about configurations, users, and policies
3. **Embedded Interface**: Full-screen chat interface for extended conversations

## Technical Details

### Architecture

```
User Input → API Route → Gemini Chatbot Library → Gemini 2.0 Flash API → Response
```

### Key Components

#### `generateChatbotResponse()`
- Handles message history and context
- Builds role-specific system prompts
- Supports streaming responses for real-time feedback

#### `buildSystemPrompt()`
- Creates contextual prompts based on user role
- Includes user information (name, role, company)
- Provides role-specific capabilities and example queries

#### `extractActionIntent()`
- Parses user messages for actionable intents
- Identifies commands like "approve", "reject", "show pending"
- Returns structured action objects for future automation

### API Endpoint

**POST** `/api/chatbot`

Request Body:
```json
{
  "messages": [
    { "role": "user", "content": "What's my expense status?" },
    { "role": "assistant", "content": "..." }
  ],
  "stream": false
}
```

Response:
```json
{
  "response": "Your latest expense of ₹8,500 is pending approval...",
  "timestamp": "2025-10-04T15:30:00.000Z"
}
```

## Future Enhancements

### Phase 1 (Current)
- ✅ Role-based conversational assistance
- ✅ Context-aware responses
- ✅ Suggested questions
- ✅ Floating and embedded variants

### Phase 2 (Planned)
- 🔄 **Direct Actions**: Approve/reject expenses from chat
- 🔄 **Expense Creation**: "Start a new expense" workflow in chat
- 🔄 **Real-time Data**: Query actual expense data from database
- 🔄 **Proactive Notifications**: "You have 3 pending approvals"

### Phase 3 (Future)
- 📋 **Voice Input**: Speak your questions
- 📊 **Visual Analytics**: Generate charts and graphs in chat
- 🔔 **Smart Reminders**: Automated deadline notifications
- 🤖 **Workflow Automation**: Complete multi-step processes via chat

## Customization

### Adding New Suggested Questions

Edit the respective page files:
- `app/employee/assistant/page.tsx`
- `app/manager/assistant/page.tsx`
- `app/admin/assistant/page.tsx`

```tsx
const SUGGESTED_QUESTIONS = [
  "Your new question here",
  "Another question",
  // ...
]
```

### Modifying System Prompts

Edit `lib/gemini-chatbot.ts` in the `buildSystemPrompt()` function:

```typescript
const roleSpecificPrompts = {
  employee: `Your custom employee prompt...`,
  manager: `Your custom manager prompt...`,
  admin: `Your custom admin prompt...`
}
```

### Styling the Chatbot

The chatbot uses Tailwind CSS and can be customized in `components/shared/chatbot.tsx`:

```tsx
// Change colors
className="bg-gradient-to-br from-purple-500 to-pink-500"

// Change size
className="w-96 h-[600px]"

// Change position
className="fixed bottom-6 right-6"
```

## Troubleshooting

### Chatbot Not Responding

1. **Check API Key**: Ensure `GEMINI_API_KEY` is set correctly
2. **Check Console**: Look for errors in browser console
3. **Check Network**: Verify `/api/chatbot` endpoint is accessible
4. **Check Session**: Ensure user is logged in

### Slow Responses

1. **Enable Streaming**: Set `stream: true` in API request
2. **Optimize Prompts**: Reduce system prompt length
3. **Check API Quota**: Verify Gemini API usage limits

### Incorrect Responses

1. **Improve Prompts**: Add more context to system prompts
2. **Add Examples**: Include few-shot examples in prompts
3. **Validate Input**: Check user message formatting

## Best Practices

1. **Keep Prompts Concise**: Shorter prompts = faster responses
2. **Use Suggested Questions**: Guide users to ask effective questions
3. **Provide Context**: Include relevant user information in prompts
4. **Handle Errors Gracefully**: Show friendly error messages
5. **Test Thoroughly**: Test with different user roles and scenarios

## Support

For issues or questions:
1. Check this guide first
2. Review the code comments in `lib/gemini-chatbot.ts`
3. Test the API endpoint directly using tools like Postman
4. Check Gemini API documentation: https://ai.google.dev/docs

## License

This chatbot implementation is part of the Expense Management System and follows the same license terms.

---

**Powered by Gemini 2.0 Flash** 🚀
