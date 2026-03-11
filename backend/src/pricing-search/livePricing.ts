import { chromium } from 'playwright';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { db } from '../db/client.js';

dayjs.extend(customParseFormat);

type Input = {
  url: string;
  checkin: string;
  checkout: string;
  adulti: number;
  bambini: number;
  etaBambini?: number[];
  camera?: string;
};

function normalizeDate(value: string): string {
  const formats = ['YYYY-MM-DD', 'DD/MM/YYYY'];
  const parsed = dayjs(value, formats, true);
  if (!parsed.isValid()) {
    throw new Error(`Formato data non valido: ${value}. Usa YYYY-MM-DD o DD/MM/YYYY`);
  }
  return parsed.format('DD/MM/YYYY');
}

export async function searchLivePricing(input: Input) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(input.url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForSelector('#search-form', { timeout: 15000 });

    const checkin = normalizeDate(input.checkin);
    const checkout = normalizeDate(input.checkout);

    const data = await page.$eval('#search-form', (f, payload) => {
      const form = f as HTMLFormElement;
      const get = (name: string) => (form.querySelector(`[name="${name}"]`) as HTMLInputElement | null)?.value ?? '';
      const q = new URLSearchParams();
      q.set('ric_destinazione', get('ric_destinazione'));
      q.set('ric_id_destinazione', get('ric_id_destinazione'));
      q.set('tipo_destinazione', get('tipo_destinazione') || 'struttura');
      q.set('datefilter', `${payload.checkin} - ${payload.checkout}`);
      q.set('numCamVal', '1');
      q.set('totAduVal', String(payload.adulti));
      q.set('totBamVal', String(payload.bambini));
      q.set('numAduVal_Cam1', String(payload.adulti));
      q.set('numBamVal_Cam1', String(payload.bambini));
      if (payload.camera) q.set('camera', payload.camera);
      return { action: form.action, query: q.toString() };
    }, { ...input, checkin, checkout });

    await page.goto(`${data.action}?${data.query}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(1500);

    const parsed = await page.evaluate(() => {
      const txt = document.body.innerText;
      const re = /(€\s?[\d\.]+(?:,\d{2})?)/g;
      const hits = txt.match(re) || [];
      const first = hits[0] || null;
      const num = first ? Number(first.replace(/[^\d,]/g, '').replace('.', '').replace(',', '.')) : null;
      const unavailable = /non disponibile|nessuna disponibilità|sold out/i.test(txt);
      const promo = /promo|offerta|last minute|sconto/i.test(txt);
      return { rawPrice: first, priceValue: num, unavailable, promo, excerpt: txt.slice(0, 1800) };
    });

    return {
      disponibile: !parsed.unavailable && parsed.priceValue !== null,
      prezzo: parsed.priceValue,
      promoRilevata: parsed.promo,
      fonte: 'live_search',
      debug: parsed
    };
  } finally {
    await browser.close();
  }
}

export function cachePricing(slug: string, input: Input, result: { disponibile: boolean; prezzo: number | null; [k: string]: unknown }) {
  db.prepare(`INSERT INTO price_cache(property_slug,checkin,checkout,adulti,bambini,eta_bambini_json,camera,prezzo,disponibile,raw_json,fetched_at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
    slug,
    input.checkin,
    input.checkout,
    input.adulti,
    input.bambini,
    JSON.stringify(input.etaBambini || []),
    input.camera || null,
    result.prezzo,
    result.disponibile ? 1 : 0,
    JSON.stringify(result),
    dayjs().toISOString()
  );
}
