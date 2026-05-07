import { NextRequest } from 'next/server';
import { streamChatResponse } from '@/lib/gemini';
import { HighlightCard, ChatMessage } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, context, history = [] } = body;

        if (!message) {
            return new Response(
                JSON.stringify({ error: 'Missing required field: message' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        console.log('💬 Chat request:', { message, hasContext: !!context, historyLength: history.length });

        // Create a ReadableStream for SSE
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const encoder = new TextEncoder();

                    // Build system prompt with context
                    const systemPrompt = context
                        ? `You are an election data analyst. The user is asking about this specific election card:\n\n${context}\n\nAnswer their question based on this information.`
                        : 'You are an election data analyst. Answer questions about the 2026 Indian Assembly Elections.';

                    // Send system prompt as first message
                    const systemData = `data: ${JSON.stringify({ content: '', system: true })}\n\n`;
                    controller.enqueue(encoder.encode(systemData));

                    // For now, send a simple response since we need to integrate Gemini properly
                    const response = `Based on the election data: ${message}`;

                    // Stream the response character by character for demo
                    for (let i = 0; i < response.length; i += 5) {
                        const chunk = response.substring(i, i + 5);
                        const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
                        controller.enqueue(encoder.encode(data));
                        await new Promise(resolve => setTimeout(resolve, 20));
                    }

                    // Send completion signal
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    console.error('Chat stream error:', error);
                    controller.error(error);
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Error in chat endpoint:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to process chat request' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
