import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { generateChatbotResponse, ChatMessage, ChatbotContext } from '@/lib/gemini-chatbot';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
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

    // Build context from session
    const context: ChatbotContext = {
      userId: (session.user as any).id || '',
      userRole: (session.user as any).role || 'employee',
      userName: session.user.name || 'User',
      companyId: (session.user as any).companyId || '',
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

    // Handle non-streaming response
    const response = await generateChatbotResponse(messages, context);

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}
