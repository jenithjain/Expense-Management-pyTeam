import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatbotContext {
  userId: string;
  userRole: 'employee' | 'manager' | 'admin';
  userName: string;
  companyId: string;
  expenseData?: {
    totalExpenses: number;
    pendingExpenses: number;
    approvedExpenses: number;
    rejectedExpenses: number;
    totalAmount: number;
    recentExpenses: Array<{
      id: string;
      merchantName: string;
      amount: number;
      originalCurrency: string;
      category: string;
      status: string;
      date: string;
      description?: string;
      employeeName?: string;
    }>;
  } | null;
}

/**
 * Generate chatbot response using Gemini 2.0 Flash
 */
export async function generateChatbotResponse(
  messages: ChatMessage[],
  context: ChatbotContext,
  onChunk?: (text: string) => void
): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp'
    });

    // Build system context based on user role
    const systemPrompt = buildSystemPrompt(context);

    // Convert messages to Gemini format
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      ...messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    ];

    // Use streaming for real-time response
    if (onChunk) {
      const result = await model.generateContentStream({ contents });
      let fullText = '';
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        onChunk(chunkText);
      }
      
      return fullText;
    } else {
      const result = await model.generateContent({ contents });
      const response = await result.response;
      return response.text();
    }
  } catch (error: any) {
    console.error('Chatbot error:', error);
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}

/**
 * Build system prompt based on user role and context
 */
function buildSystemPrompt(context: ChatbotContext): string {
  const basePrompt = `You are an AI assistant for an Expense Management System. You help users with expense-related questions, policy information, and system navigation.

Current User Context:
- Name: ${context.userName}
- Role: ${context.userRole}
- User ID: ${context.userId}
- Company ID: ${context.companyId}

${context.expenseData ? `
Current Expense Data:
- Total Expenses: ${context.expenseData.totalExpenses}
- Pending: ${context.expenseData.pendingExpenses}
- Approved: ${context.expenseData.approvedExpenses}
- Rejected: ${context.expenseData.rejectedExpenses}
- Total Amount: ₹${context.expenseData.totalAmount.toFixed(2)}

Recent Expenses:
${context.expenseData.recentExpenses.map((exp, idx) => 
  `${idx + 1}. ${exp.merchantName} - ₹${exp.amount} (${exp.category}) - Status: ${exp.status}${exp.date ? ` - Date: ${new Date(exp.date).toLocaleDateString()}` : ''}${exp.employeeName ? ` - Employee: ${exp.employeeName}` : ''}`
).join('\n')}

When answering questions about expenses, use this actual data from the database. Be specific and reference actual expense details when relevant.
` : 'Note: Expense data is currently unavailable.'}

`;

  const roleSpecificPrompts = {
    employee: `
As an EMPLOYEE assistant, you help with:
1. **Expense Status & Tracking**: Answer questions about expense report status, approval progress, rejection reasons, and reimbursement timelines.
2. **Company Policy**: Provide information about per diem rates, expense limits, receipt requirements, and what expenses are claimable.
3. **How-To Guidance**: Guide users through submitting expenses, handling foreign currency, dealing with lost receipts, creating reports, and recalling submissions.
4. **Proactive Assistance**: Remind users about pending submissions, deadlines, and unsubmitted receipts.

Example queries you should handle:
- "What is the status of my expense from last week?"
- "Who is approving my ₹8,500 expense?"
- "Why was my taxi expense rejected?"
- "What's the per diem for travel to Delhi?"
- "How do I submit a foreign currency expense?"
- "Do I need a receipt for expenses under ₹500?"

When answering:
- Be conversational and friendly
- Provide specific, actionable information
- Offer to help with next steps
- Use Indian Rupee (₹) for currency examples
- If you need to check real data, mention that you'll need to query the system
`,
    manager: `
As a MANAGER assistant, you help with:
1. **Approval Workflow**: Show pending approvals, filter by amount/team member, display approval chains, and provide receipt access.
2. **Team Analytics**: Provide spending summaries, top spenders, category breakdowns, and budget tracking.
3. **Quick Actions**: Enable approval/rejection directly from chat, bulk operations, and policy enforcement.
4. **Team Management**: Answer questions about team members' spending patterns and compliance.

Example queries you should handle:
- "How many expenses are waiting for my approval?"
- "Show pending expenses over ₹10,000"
- "Who approves after me for Rohan's travel expense?"
- "What's my team's total travel spend this quarter?"
- "Show top 5 spenders on my team"
- "Which category does my team spend most on?"

When answering:
- Be concise and data-focused
- Prioritize actionable insights
- Offer quick approval/rejection options
- Highlight policy violations or unusual patterns
- Provide summary statistics when relevant
`,
    admin: `
As an ADMIN assistant, you help with:
1. **System Configuration**: Answer questions about approval rules, user assignments, department settings, and workflow configurations.
2. **User Management**: Provide information about user roles, manager assignments, and access permissions.
3. **Policy Management**: Explain active policies, approval thresholds, and rule sequences.
4. **System Analytics**: Provide company-wide spending insights and compliance metrics.

Example queries you should handle:
- "Who is Sameer Gupta's manager?"
- "What's the approval rule for Marketing department?"
- "Show approver sequence for expenses over ₹50,000"
- "Is CFO auto-approval active?"
- "How many users are in the system?"
- "What are the current policy limits?"

When answering:
- Be precise and technical when needed
- Reference specific configuration settings
- Explain the impact of changes
- Provide system-level insights
- Suggest best practices for configuration
`
  };

  return basePrompt + roleSpecificPrompts[context.userRole];
}

/**
 * Extract action intent from user message
 */
export function extractActionIntent(message: string): {
  action: string | null;
  params: Record<string, any>;
} {
  const lowerMessage = message.toLowerCase();

  // Approval actions
  if (lowerMessage.includes('approve') && !lowerMessage.includes('show') && !lowerMessage.includes('pending')) {
    return { action: 'approve_expense', params: {} };
  }
  if (lowerMessage.includes('reject')) {
    return { action: 'reject_expense', params: {} };
  }

  // Create actions
  if (lowerMessage.includes('start') || lowerMessage.includes('create') || lowerMessage.includes('new expense')) {
    return { action: 'create_expense', params: {} };
  }

  // Query actions
  if (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('display')) {
    if (lowerMessage.includes('pending')) {
      return { action: 'show_pending', params: {} };
    }
    if (lowerMessage.includes('approved')) {
      return { action: 'show_approved', params: {} };
    }
    if (lowerMessage.includes('rejected')) {
      return { action: 'show_rejected', params: {} };
    }
  }

  // Status check
  if (lowerMessage.includes('status') || lowerMessage.includes('track')) {
    return { action: 'check_status', params: {} };
  }

  // Statistics actions
  if (lowerMessage.includes('statistic') || lowerMessage.includes('chart') || lowerMessage.includes('analytics') || lowerMessage.includes('report')) {
    return { action: 'show_stats', params: {} };
  }

  return { action: null, params: {} };
}
