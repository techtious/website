import Fastify from 'fastify';
import cors from '@fastify/cors';
import { handleChat } from './router.js';

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
