import Fastify from 'fastify';
import cors from '@fastify/cors';
import { handleChat } from './router.js';
import { appendFileSync } from 'fs';

const PORT = parseInt(process.env.PORT || '3001');
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://beta.techtious.com').split(',');

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'), false);
  },
  methods: ['POST', 'OPTIONS'],
});

// Health check
app.get('/health', async () => ({ status: 'ok', model: process.env.MODEL || 'anthropic/claude-sonnet-4-5' }));

// Contact / lead capture
app.post('/api/contact', {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name:  { type: 'string', minLength: 1, maxLength: 200 },
        email: { type: 'string', minLength: 3, maxLength: 200 },
      },
    },
  },
}, async (request, reply) => {
  const { name, email } = request.body;
  const lead = { name, email, ts: new Date().toISOString() };
  console.log(`[LEAD] ${name} <${email}>`);
  try {
    appendFileSync('/app/leads.jsonl', JSON.stringify(lead) + '\n');
  } catch (err) {
    console.error('Failed to save lead:', err.message);
  }
  return reply.send({ ok: true });
});

// Chat endpoint
app.post('/api/chat', {
  schema: {
    body: {
      type: 'object',
      required: ['messages'],
      properties: {
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role:    { type: 'string' },
              content: { type: 'string' },
            },
          },
        },
      },
    },
  },
}, handleChat);

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Techtious chat server running on port ${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
