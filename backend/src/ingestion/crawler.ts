import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
import { db } from '../db/client.js';
import { env } from '../config/env.js';

const listPages = ['/hotel', '/villaggi', '/resort', '/residence'];

function classifyTargets(text: string): string[] {
  const t = text.toLowerCase();
  const r = new Set<string>();
  if (/bimbi|famigli|baby|mini club/.test(t)) r.add('famiglia');
  if (/spa|romantic|copp/.test(t)) r.add('coppia');
  if (/relax|tranquill|accessibil|senior/.test(t)) r.add('senior');
  if (/animazione|grupp/.test(t)) r.add('gruppo');
  if (/offerta|sconto|promo/.test(t)) r.add('risparmio');
  return [...r];
}

function extractRegion(url: string): string | undefined {
  const match = url.match(/\/vacanze-([^/]+)\//i);
  return match?.[1]?.replace(/-/g, ' ');
}

export async function runCrawler(limit = env.INGESTION_LIMIT) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const details = new Set<string>();

  for (const lp of listPages) {
    await page.goto(`${env.BASE_URL}${lp}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(1500);
    const links = await page.$$eval('a[href]', els => els.map(e => (e as HTMLAnchorElement).href));
    links.filter(l => /\/vacanze-[^/]+\//.test(l)).forEach(l => details.add(l));
  }

  const urls = [...details].slice(0, limit);
  for (const url of urls) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.waitForTimeout(1000);
      const html = await page.content();
      const $ = cheerio.load(html);

      const nome = $('h1').first().text().trim() || $('title').text().split('|')[0].trim();
      const descrizione = $('meta[name="description"]').attr('content') || $('p').first().text().trim();
      const slug = url.split('/').filter(Boolean).pop() || url;
      const localita = $('.breadcrumbs li').last().text().trim() || undefined;
      const regione = extractRegion(url);
      const testo = $('body').text();
      const categoria = testo.match(/(\d\s*stelle|\d\*\s*hotel)/i)?.[0];
      const trattamento = /(all inclusive|pensione completa|mezza pensione|b&b|solo pernottamento)/i.exec(testo)?.[0];
      const distanzaMareMatch = /(\d{2,4})\s?m\s+dal mare/i.exec(testo);
      const distanzaMare = distanzaMareMatch ? Number(distanzaMareMatch[1]) : undefined;

      const target = classifyTargets(`${nome} ${descrizione} ${testo}`);
      const servizi = ['piscina', 'spa', 'animazione', 'all inclusive', 'accessibile', 'spiaggia privata', 'servizi bimbi']
        .filter(s => testo.toLowerCase().includes(s));
      const keywords = [...new Set([...(descrizione || '').toLowerCase().split(/[^a-zàèéìòù]+/).filter(w => w.length > 4), ...servizi])].slice(0, 30);

      db.prepare(`INSERT INTO properties
      (nome,slug,url,regione,localita,categoria,descrizione,distanza_mare,trattamento,servizi_json,target_json,keywords_json,obiezioni_json,tono_vendita,updated_at)
      VALUES (@nome,@slug,@url,@regione,@localita,@categoria,@descrizione,@distanzaMare,@trattamento,@servizi,@target,@keywords,@obiezioni,@tono,@updated)
      ON CONFLICT(slug) DO UPDATE SET
      nome=excluded.nome,url=excluded.url,regione=excluded.regione,localita=excluded.localita,categoria=excluded.categoria,
      descrizione=excluded.descrizione,distanza_mare=excluded.distanza_mare,trattamento=excluded.trattamento,
      servizi_json=excluded.servizi_json,target_json=excluded.target_json,keywords_json=excluded.keywords_json,updated_at=excluded.updated_at`).run({
        nome, slug, url, regione, localita, categoria, descrizione, distanzaMare, trattamento,
        servizi: JSON.stringify(servizi),
        target: JSON.stringify(target),
        keywords: JSON.stringify(keywords),
        obiezioni: JSON.stringify(['Distanza dal mare da verificare in base alla camera', 'Disponibilità variabile in alta stagione']),
        tono: 'consulenziale e rassicurante',
        updated: dayjs().toISOString()
      });
    } catch (e) {
      console.error('ingestion_error', url, e);
    }
  }

  await browser.close();
  return urls.length;
}
