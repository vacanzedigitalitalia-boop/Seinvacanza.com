import { CustomerProfile, Property } from '../types.js';

export function scoreProperty(profile: CustomerProfile, p: Property) {
  let score = 0;
  const reasons: string[] = [];
  if (p.target.includes(profile.tipoCliente)) { score += 30; reasons.push('Target cliente coerente'); }
  const matchedServices = profile.servizi.filter(s => p.servizi.some(ps => ps.includes(s)));
  score += matchedServices.length * 8;
  if (matchedServices.length) reasons.push(`Servizi compatibili: ${matchedServices.join(', ')}`);
  if (profile.destinazione && `${p.regione || ''} ${p.localita || ''}`.toLowerCase().includes(profile.destinazione.toLowerCase())) {
    score += 15; reasons.push('Destinazione compatibile');
  }
  if (profile.trattamento && p.trattamento?.toLowerCase().includes(profile.trattamento.toLowerCase())) {
    score += 10; reasons.push('Trattamento coerente');
  }
  if (profile.distanzaMareMax && p.distanzaMare && p.distanzaMare <= profile.distanzaMareMax) {
    score += 10; reasons.push('Distanza mare entro preferenza');
  }
  if (profile.tipoCliente === 'risparmio') { score += 8; reasons.push('Adatta a cliente sensibile al prezzo'); }
  return { score, reasons };
}
