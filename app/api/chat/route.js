import OpenAI from 'openai';
import { SYSTEM_PROMPT } from '@/utils/data/chatbot-data';

export const runtime = 'nodejs';

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const model = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-super-120b-a12b';

    const stream = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT ||
            `You are a helpful AI assistant on Prabhakar Maurya's developer portfolio. 
             Answer questions about Prabhakar professionally and concisely. 
             If you don't have specific information, politely say so and suggest the visitor reach out via the contact section.`,
        },
        ...messages,
      ],
      temperature: 0.5,
      top_p: 1,
      max_tokens: 1024,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate response. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
