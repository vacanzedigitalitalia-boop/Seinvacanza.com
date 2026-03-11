import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import api from './routes/api.js';

const app = express();
app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN }));
app.use(express.json());
app.use('/api', api);
app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(env.PORT, () => {
  console.log(`API ready on :${env.PORT}`);
});
