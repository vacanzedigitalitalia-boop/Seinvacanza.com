import { NextFunction, Request, Response, Router } from 'express';
import { ZodError, z } from 'zod';
import { runCrawler } from '../ingestion/crawler.js';
import { scoreProperty } from '../matching/scoring.js';
import { searchLivePricing, cachePricing } from '../pricing-search/livePricing.js';
import { generateSalesCopy } from '../sales-copy/generator.js';
import { getProperties, getPropertyBySlug } from '../services/propertyService.js';

const router = Router();

router.post('/ingestion/run', async (_req, res, next) => {
  try {
    const count = await runCrawler();
    res.json({ ok: true, count });
  } catch (error) {
    next(error);
  }
});

router.post('/matching/search', (req, res, next) => {
  try {
    const schema = z.object({
      tipoCliente: z.enum(['famiglia', 'coppia', 'senior', 'gruppo', 'risparmio']),
      budget: z.coerce.number().nonnegative(),
      destinazione: z.string().optional(),
      distanzaMareMax: z.coerce.number().optional(),
      servizi: z.array(z.string()).default([]),
      trattamento: z.string().optional(),
      esigenze: z.string().optional()
    });

    const profile = schema.parse(req.body);
    const ranked = getProperties()
      .map((p) => {
        const { score, reasons } = scoreProperty(profile, p);
        return { property: p, score, reasons, sales: generateSalesCopy(profile, p) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json({ items: ranked });
  } catch (error) {
    next(error);
  }
});

router.post('/pricing/check', async (req, res, next) => {
  try {
    const schema = z.object({
      slug: z.string(),
      checkin: z.string(),
      checkout: z.string(),
      adulti: z.coerce.number().int().min(1),
      bambini: z.coerce.number().int().min(0),
      etaBambini: z.array(z.coerce.number().int().min(0).max(17)).optional(),
      camera: z.string().optional()
    });

    const payload = schema.parse(req.body);
    const prop = getPropertyBySlug(payload.slug);
    if (!prop) {
      return res.status(404).json({ error: 'Struttura non trovata' });
    }

    const result = await searchLivePricing({ url: prop.url, ...payload });
    cachePricing(prop.slug, payload, result);

    const alternatives = getProperties()
      .filter((p) => p.slug !== prop.slug)
      .slice(0, 3)
      .map((p) => ({ slug: p.slug, nome: p.nome }));

    res.json({ property: prop, result, alternatives });
  } catch (error) {
    next(error);
  }
});

router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: 'Payload non valido', details: error.flatten() });
  }

  console.error('api_error', error);
  return res.status(500).json({ error: 'Errore interno. Riprova.' });
});

export default router;
