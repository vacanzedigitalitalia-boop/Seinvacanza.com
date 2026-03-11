import { db } from '../db/client.js';
import { Property } from '../types.js';

export function getProperties(): Property[] {
  const rows = db.prepare('SELECT * FROM properties ORDER BY updated_at DESC').all() as any[];
  return rows.map(r => ({
    id: r.id,
    nome: r.nome,
    slug: r.slug,
    url: r.url,
    regione: r.regione ?? undefined,
    localita: r.localita ?? undefined,
    descrizione: r.descrizione ?? undefined,
    distanzaMare: r.distanza_mare ?? undefined,
    trattamento: r.trattamento ?? undefined,
    servizi: JSON.parse(r.servizi_json || '[]'),
    target: JSON.parse(r.target_json || '[]'),
    keywords: JSON.parse(r.keywords_json || '[]')
  }));
}

export function getPropertyBySlug(slug: string): Property | undefined {
  return getProperties().find(p => p.slug === slug);
}
