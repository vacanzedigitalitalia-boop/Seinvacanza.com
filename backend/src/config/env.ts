import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: process.env.ENV_FILE ?? '.env' });

const schema = z.object({
  PORT: z.coerce.number().default(8080),
  DB_PATH: z.string().default('./booking.db'),
  BASE_URL: z.string().url().default('https://www.seinvacanza.com'),
  INGESTION_LIMIT: z.coerce.number().int().min(1).max(500).default(80),
  CORS_ORIGIN: z.string().default('*')
});

export const env = schema.parse(process.env);
