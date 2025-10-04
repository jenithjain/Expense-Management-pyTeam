import { GoogleGenerativeAI, FunctionDeclarationsTool, Part, Content, SchemaType } from '@google/generative-ai';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isChart?: boolean;
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
  onChunk?: (text: string) => void,
  onChart?: (chartData: any) => void,
  userSession?: any
): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const tools: FunctionDeclarationsTool[] = [
      {
        functionDeclarations: [
          {
            name: 'get_expense_statistics',
            description: 'Fetches expense statistics and displays beautiful charts. Call this function when users ask for statistics, charts, analytics, data visualization, spending breakdown, financial overview, company statistics, team statistics, or phrases like "show me the numbers", "display charts", "expense breakdown", "analytics dashboard".',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {},
            },
          },
        ],
      },
    ];

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      tools: tools,
    });

    // Build system context based on user role
    const systemPrompt = buildSystemPrompt(context);

    const history: Content[] = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const lastMessage = history.pop();

    const contents: Content[] = [
      ...history,
      ...(lastMessage ? [lastMessage] : [])
    ];

    // Add system prompt to the beginning of the contents
    contents.unshift({
        role: 'user',
        parts: [{ text: systemPrompt }]
    });

    const result = await model.generateContent({ contents });
    const response = result.response;
    const call = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;

    if (call) {
      if (call.name === 'get_expense_statistics') {
        // Call statistics function directly instead of making HTTP request
        const stats = await getStatisticsData(userSession);
        if (!stats) {
          return "Sorry, I couldn't fetch the statistics right now.";
        }

        // Return the statistics data along with the response
        const toolResponse: Content = {
          role: 'user',
          parts: [{
            functionResponse: {
              name: 'get_expense_statistics',
              response: {
                name: 'get_expense_statistics',
                content: JSON.stringify(stats),
              },
            },
          }],
        };

        const result2 = await model.generateContent({
          contents: [...contents, { role: 'model', parts: [ { functionCall: call } ] }, toolResponse],
        });
        
        const responseText = result2.response.candidates?.[0]?.content?.parts?.[0]?.text || "Here are the statistics.";
        
        // Return both the text response and the stats data
        return JSON.stringify({
          response: responseText,
          hasCharts: true,
          chartData: stats,
          userRole: userSession?.user?.role?.toUpperCase()
        });
      }
    }

    // Fallback to streaming for regular chat
    if (onChunk) {
      const streamResult = await model.generateContentStream({ contents });
      let fullText = '';
      
      for await (const chunk of streamResult.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        onChunk(chunkText);
      }
      
      return fullText;
    } else {
      return response.candidates?.[0]?.content?.parts?.[0]?.text || "";
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
5. **Statistics & Charts**: When users ask for team statistics, analytics, charts, data visualization, spending breakdown, financial overview, or say "show me the numbers", "display charts", "team analytics", "expense breakdown" - ALWAYS call the get_expense_statistics function to provide beautiful visual charts.

Example queries you should handle:
- "Show me team statistics" (CALL get_expense_statistics)
- "Display team analytics" (CALL get_expense_statistics)
- "What's my team's spending breakdown?" (CALL get_expense_statistics)
- "Show me the numbers" (CALL get_expense_statistics)
- "How many expenses are waiting for my approval?"
- "Show pending expenses over ₹10,000"
- "Who approves after me for Rohan's travel expense?"

IMPORTANT: Whenever a user asks for statistics, analytics, charts, or data visualization, you MUST call the get_expense_statistics function to provide visual charts and data.

When answering:
- Be concise and data-focused
- Prioritize actionable insights
- Offer quick approval/rejection options
- Highlight policy violations or unusual patterns
- For statistics requests, ALWAYS use the get_expense_statistics function
- Provide summary statistics when relevant
`,
    admin: `
As an ADMIN assistant, you help with:
1. **System Configuration**: Answer questions about approval rules, user assignments, department settings, and workflow configurations.
2. **User Management**: Provide information about user roles, manager assignments, and access permissions.
3. **Policy Management**: Explain active policies, approval thresholds, and rule sequences.
4. **System Analytics**: Provide company-wide spending insights and compliance metrics.
5. **Statistics & Charts**: When users ask for statistics, analytics, charts, data visualization, spending breakdown, financial overview, company statistics, or say "show me the numbers", "display charts", "expense breakdown", "analytics dashboard" - ALWAYS call the get_expense_statistics function to provide beautiful visual charts.

Example queries you should handle:
- "Show me the company statistics" (CALL get_expense_statistics)
- "What's the total expense breakdown?" (CALL get_expense_statistics)
- "Display analytics dashboard" (CALL get_expense_statistics)
- "Show me the numbers" (CALL get_expense_statistics)
- "Who is Sameer Gupta's manager?"
- "What's the approval rule for Marketing department?"
- "How many users are in the system?"

IMPORTANT: Whenever a user asks for statistics, analytics, charts, or data visualization, you MUST call the get_expense_statistics function to provide visual charts and data.

When answering:
- Be precise and technical when needed
- Reference specific configuration settings
- Explain the impact of changes
- Provide system-level insights
- For statistics requests, ALWAYS use the get_expense_statistics function
- Suggest best practices for configuration
`
  };

  return basePrompt + roleSpecificPrompts[context.userRole];
}

/**
 * Get statistics data directly without HTTP call
 */
async function getStatisticsData(userSession: any) {
  if (!userSession?.user) {
    return null;
  }

  const userId = userSession.user.id;
  
  try {
    // Import models here to avoid circular dependencies
    const { default: dbConnect } = await import('@/lib/mongodb');
    const { default: User } = await import('@/models/User');
    const { default: Expense } = await import('@/models/Expense');

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return null;
    }

    let stats;
    if (user.role === "ADMIN") {
      stats = await getAdminStatsInternal(user.companyId.toString());
    } else if (user.role === "MANAGER") {
      stats = await getManagerStatsInternal(userId, user.companyId.toString());
    } else {
      return null;
    }

    return stats;
  } catch (error) {
    console.error("Error fetching stats:", error);
    return null;
  }
}

async function getAdminStatsInternal(companyId: string) {
  const { default: Expense } = await import('@/models/Expense');
  const { default: User } = await import('@/models/User');

  const totalExpenses = await Expense.aggregate([
    { $match: { companyId: companyId } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const expensesByCategory = await Expense.aggregate([
    { $match: { companyId: companyId } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
  ]);

  const expensesByStatus = await Expense.aggregate([
    { $match: { companyId: companyId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const totalUsers = await User.countDocuments({ companyId: companyId });

  return {
    totalExpenses: totalExpenses[0]?.total || 0,
    expensesByCategory: expensesByCategory.map((item: { _id: string; total: number }) => ({
      name: item._id,
      value: item.total,
    })),
    expensesByStatus: expensesByStatus.map((item: { _id: string; count: number }) => ({
      name: item._id,
      value: item.count,
    })),
    totalUsers,
  };
}

async function getManagerStatsInternal(managerId: string, companyId: string) {
  const { default: Expense } = await import('@/models/Expense');
  const { default: User } = await import('@/models/User');

  const teamMembers = await User.find({ managerId: managerId });
  const teamMemberIds = teamMembers.map((user: any) => user._id);
  teamMemberIds.push(managerId); // Include manager's own expenses

  const totalTeamExpenses = await Expense.aggregate([
    { $match: { employeeId: { $in: teamMemberIds }, companyId: companyId } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const teamExpensesByCategory = await Expense.aggregate([
    { $match: { employeeId: { $in: teamMemberIds }, companyId: companyId } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
  ]);

  const teamExpensesByStatus = await Expense.aggregate([
    { $match: { employeeId: { $in: teamMemberIds }, companyId: companyId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const teamExpensesByUser = await Expense.aggregate([
    { $match: { employeeId: { $in: teamMemberIds }, companyId: companyId } },
    { $group: { _id: "$employeeId", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
  ]);

  const users = await User.find({ _id: { $in: teamExpensesByUser.map((item: { _id: string }) => item._id) } }).select('name email');
  const userMap = users.reduce((acc: { [key: string]: string }, user: any) => {
    acc[user._id.toString()] = user.name || user.email;
    return acc;
  }, {});

  return {
    totalTeamExpenses: totalTeamExpenses[0]?.total || 0,
    teamExpensesByCategory: teamExpensesByCategory.map((item: { _id: string; total: number }) => ({
      name: item._id,
      value: item.total,
    })),
    teamExpensesByStatus: teamExpensesByStatus.map((item: { _id: string; count: number }) => ({
      name: item._id,
      value: item.count,
    })),
    teamExpensesByUser: teamExpensesByUser.map((item: { _id: any; total: number }) => ({
      name: userMap[item._id.toString()],
      value: item.total,
    })),
    teamSize: teamMembers.length,
  };
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
