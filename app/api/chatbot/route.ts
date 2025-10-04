import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateChatbotResponse, ChatMessage, ChatbotContext, extractActionIntent } from '@/lib/gemini-chatbot';
import connectDB from '@/lib/mongodb';
import Expense from '@/models/Expense';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { messages, stream = false } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Get user details
    const user = await User.findById((session.user as any).id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[Chatbot] User found:', { 
      userId: user._id?.toString(), 
      role: user.role,
      name: user.name 
    });

    // Fetch user's expense data - pass the _id directly, not as string
    const expenseData = await fetchExpenseData(user._id?.toString() || '', user.role as any);

    // Build context from session
    const context: ChatbotContext = {
      userId: (user._id as any).toString(),
      userRole: user.role.toLowerCase() as 'employee' | 'manager' | 'admin',
      userName: session.user.name || 'User',
      companyId: user.companyId?.toString() || '',
      expenseData, // Add expense data to context
    };

    // Handle streaming response
    if (stream) {
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            await generateChatbotResponse(
              messages,
              context,
              (chunk: string) => {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
                );
              }
            );
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error: any) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: error.message })}\n\n`
              )
            );
            controller.close();
          }
        },
      });

      return new Response(customReadable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Check for special actions
    const lastMessage = messages[messages.length - 1].content;
    const { action } = extractActionIntent(lastMessage);
    if (action === 'show_stats' && (user.role === 'MANAGER' || user.role === 'ADMIN')) {
      // Fetch statistics based on role
      const stats = await fetchStatistics((user._id as any).toString(), user.role, user.companyId?.toString() || '');
      return NextResponse.json({ 
        type: 'statistics',
        stats, 
        userRole: user.role,
        timestamp: new Date().toISOString() 
      });
    }
    // Handle normal chat response
    const response = await generateChatbotResponse(messages, context, undefined, undefined, session);
    
    // Check if the response contains chart data
    try {
      const parsedResponse = JSON.parse(response);
      if (parsedResponse.hasCharts && parsedResponse.chartData) {
        return NextResponse.json({ 
          response: parsedResponse.response,
          hasCharts: true,
          chartData: parsedResponse.chartData,
          userRole: parsedResponse.userRole,
          timestamp: new Date().toISOString() 
        });
      }
    } catch (e) {
      // If it's not JSON, it's a regular text response
    }
    
    return NextResponse.json({ response, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}

/**
 * Fetch expense data for the user based on their role
 */
async function fetchExpenseData(userId: string, role: string) {
  try {
    console.log('[Chatbot] Fetching expense data for userId:', userId, 'role:', role);
    
    // First, let's check what expenses exist in the database
    const allExpenses = await Expense.find({}).limit(5).lean();
    console.log('[Chatbot] Total expenses in DB:', await Expense.countDocuments({}));
    if (allExpenses.length > 0) {
      console.log('[Chatbot] Sample expense employeeId:', allExpenses[0].employeeId?.toString());
      console.log('[Chatbot] UserId we are searching for:', userId);
      console.log('[Chatbot] Do they match?', allExpenses[0].employeeId?.toString() === userId);
    }
    
    const expenseData: any = {
      totalExpenses: 0,
      pendingExpenses: 0,
      approvedExpenses: 0,
      rejectedExpenses: 0,
      totalAmount: 0,
      recentExpenses: [],
    };

    // Normalize role to lowercase for comparison
    const normalizedRole = role.toLowerCase();

    if (normalizedRole === 'employee') {
      // Fetch employee's own expenses
      const expenses = await Expense.find({ employeeId: userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      console.log('[Chatbot] Employee query:', { employeeId: userId });
      console.log('[Chatbot] Found', expenses.length, 'expenses for employee');
      if (expenses.length > 0) {
        console.log('[Chatbot] Sample expense:', {
          id: expenses[0]._id,
          employeeId: expenses[0].employeeId,
          merchantName: expenses[0].merchantName,
          status: expenses[0].status
        });
      }
      
      expenseData.totalExpenses = expenses.length;
      expenseData.pendingExpenses = expenses.filter((e: any) => e.status === 'PENDING').length;
      expenseData.approvedExpenses = expenses.filter((e: any) => e.status === 'APPROVED').length;
      expenseData.rejectedExpenses = expenses.filter((e: any) => e.status === 'REJECTED').length;
      expenseData.totalAmount = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      
      expenseData.recentExpenses = expenses.slice(0, 10).map((e: any) => ({
        id: e._id.toString(),
        merchantName: e.merchantName,
        amount: e.amount,
        originalCurrency: e.originalCurrency,
        category: e.category,
        status: e.status,
        date: e.date,
        description: e.description,
      }));

    } else if (normalizedRole === 'manager') {
      // Fetch team members
      const teamMembers = await User.find({ managerId: userId }).select('_id').lean();
      const teamMemberIds = teamMembers.map((m: any) => m._id);

      console.log('[Chatbot] Manager has', teamMembers.length, 'team members');

      // Fetch expenses for team members
      const expenses = await Expense.find({ employeeId: { $in: teamMemberIds } })
        .populate('employeeId', 'name email')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      console.log('[Chatbot] Found', expenses.length, 'expenses for manager\'s team');

      expenseData.totalExpenses = expenses.length;
      expenseData.pendingExpenses = expenses.filter((e: any) => e.status === 'PENDING').length;
      expenseData.approvedExpenses = expenses.filter((e: any) => e.status === 'APPROVED').length;
      expenseData.rejectedExpenses = expenses.filter((e: any) => e.status === 'REJECTED').length;
      expenseData.totalAmount = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      
      expenseData.recentExpenses = expenses.slice(0, 10).map((e: any) => ({
        id: e._id.toString(),
        merchantName: e.merchantName,
        amount: e.amount,
        originalCurrency: e.originalCurrency,
        category: e.category,
        status: e.status,
        date: e.date,
        description: e.description,
        employeeName: e.employeeId?.name || 'Unknown',
      }));

    } else if (normalizedRole === 'admin') {
      // Fetch all expenses for the company
      const user = await User.findById(userId).select('companyId').lean();
      const expenses = await Expense.find({ companyId: user?.companyId })
        .populate('employeeId', 'name email')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      console.log('[Chatbot] Found', expenses.length, 'expenses for admin\'s company');

      expenseData.totalExpenses = expenses.length;
      expenseData.pendingExpenses = expenses.filter((e: any) => e.status === 'PENDING').length;
      expenseData.approvedExpenses = expenses.filter((e: any) => e.status === 'APPROVED').length;
      expenseData.rejectedExpenses = expenses.filter((e: any) => e.status === 'REJECTED').length;
      expenseData.totalAmount = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      
      expenseData.recentExpenses = expenses.slice(0, 10).map((e: any) => ({
        id: e._id.toString(),
        merchantName: e.merchantName,
        amount: e.amount,
        originalCurrency: e.originalCurrency,
        category: e.category,
        status: e.status,
        date: e.date,
        description: e.description,
        employeeName: e.employeeId?.name || 'Unknown',
      }));
    }

    return expenseData;
  } catch (error) {
    console.error('Error fetching expense data:', error);
    return null;
  }
}
/**
 * Fetch statistics for manager or admin
 */
async function fetchStatistics(userId: string, role: string, companyId: string) {
  // Connect to database and import models
  // (Assumes already connected earlier)
  let expenses: any[] = [];
  if (role === 'MANAGER') {
    // Team members
    const team = await User.find({ managerId: userId }).select('_id name').lean();
    const ids = team.map(m => m._id);
    expenses = await Expense.find({ employeeId: { $in: ids } }).populate('employeeId', 'name').lean();
  } else if (role === 'ADMIN') {
    // All company expenses
    expenses = await Expense.find({ companyId: companyId }).populate('employeeId', 'name').lean();
  }
  // Compute basic metrics
  const totalExpenses = expenses.length;
  const pending = expenses.filter(e => e.status === 'PENDING').length;
  const approved = expenses.filter(e => e.status === 'APPROVED').length;
  const rejected = expenses.filter(e => e.status === 'REJECTED').length;
  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  // Category breakdown
  const byCategory: Record<string, { count: number; amount: number }> = {};
  expenses.forEach(e => {
    if (!byCategory[e.category]) byCategory[e.category] = { count: 0, amount: 0 };
    byCategory[e.category].count++;
    byCategory[e.category].amount += e.amount || 0;
  });
  const categoryStats = Object.entries(byCategory).map(([cat, v]) => ({ category: cat, count: v.count, amount: v.amount }));
  // Monthly spending last 6 months
  const now = new Date();
  const monthly: Record<string, number> = {};
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    monthly[key] = 0;
  }
  expenses.forEach(e => {
    const d = new Date(e.date);
    const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    if (monthly[key] !== undefined) monthly[key] += e.amount || 0;
  });
  const monthlyStats = Object.entries(monthly).map(([month, amt]) => ({ month, amount: amt }));
  // Top spenders (for manager)
  let topSpenders: Array<{ name: string; amount: number }> = [];
  if (role === 'MANAGER') {
    const spendMap: Record<string, { amount: number; name: string }> = {};
    for (const e of expenses) {
      const id = e.employeeId._id.toString();
      const name = e.employeeId.name || 'Unknown';
      if (!spendMap[id]) spendMap[id] = { amount: 0, name };
      spendMap[id].amount += e.amount || 0;
    }
    topSpenders = Object.values(spendMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }
  return { totalExpenses, pending, approved, rejected, totalAmount, categoryStats, monthlyStats, topSpenders };
}
