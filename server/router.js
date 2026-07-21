import OpenAI from 'openai';
import { SYSTEM_PROMPT } from './system-prompt.js';

const client = new OpenAI({
  apiKey: (process.env.OPENROUTER_API_KEY || '').replace(/^['"]|['"]$/g, ''),
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.SITE_URL || 'https://beta.techtious.com',
    'X-Title': 'Techtious Labs',
  },
});

const MODEL = process.env.MODEL || 'anthropic/claude-sonnet-4-5';
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS || '1024');
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://beta.techtious.com').split(',');

export async function handleChat(request, reply) {
  const { messages } = request.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return reply.status(400).send({ error: 'messages array is required' });
  }

  // Sanitise — only allow role/content fields
  const sanitised = messages.slice(-20).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content).slice(0, 4000),
  }));

  // reply.raw bypasses Fastify's CORS plugin, so set the header manually
  const origin = request.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    reply.raw.setHeader('Access-Control-Allow-Origin', origin);
    reply.raw.setHeader('Vary', 'Origin');
  }
  reply.raw.setHeader('Content-Type', 'text/event-stream');
  reply.raw.setHeader('Cache-Control', 'no-cache');
  reply.raw.setHeader('Connection', 'keep-alive');
  reply.raw.setHeader('X-Accel-Buffering', 'no');
  reply.raw.flushHeaders();

  try {
    const stream = await client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...sanitised,
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        reply.raw.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    reply.raw.write('data: [DONE]\n\n');
  } catch (err) {
    console.error('Chat error:', err.message);
    reply.raw.write(`data: ${JSON.stringify({ error: 'Something went wrong. Please try again.' })}\n\n`);
  } finally {
    reply.raw.end();
  }
}
