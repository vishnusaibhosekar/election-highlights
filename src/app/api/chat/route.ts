import { NextRequest } from 'next/server';
import { streamChatResponse } from '@/lib/gemini';
import { HighlightCard, ChatMessage } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { card, userMessage, chatHistory = [] } = body;

        if (!card || !userMessage) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: card, userMessage' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Create a ReadableStream for SSE
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const encoder = new TextEncoder();

                    // Send streaming response
                    for await (const chunk of streamChatResponse(
                        card as HighlightCard,
                        '', // electionData - we'll fetch if needed
                        userMessage,
                        chatHistory as ChatMessage[]
                    )) {
                        const data = `data: ${JSON.stringify({ chunk })}\n\n`;
                        controller.enqueue(encoder.encode(data));
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
