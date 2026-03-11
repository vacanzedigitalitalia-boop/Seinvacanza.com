import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

type MatchItem = {
  property: { nome: string; slug: string; descrizione?: string };
  score: number;
  reasons: string[];
  sales: { percheProporla: string; telefono: string; whatsapp: string; email: string };
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

function App() {
  const [items, setItems] = useState<MatchItem[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [pricing, setPricing] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const selectedItem = useMemo(() => items.find((i) => i.property.slug === selected), [items, selected]);

  async function search(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);

    const body = {
      tipoCliente: String(fd.get('tipoCliente') || ''),
      budget: Number(fd.get('budget') || 0),
      destinazione: String(fd.get('destinazione') || '') || undefined,
      distanzaMareMax: Number(fd.get('distanzaMareMax') || 0) || undefined,
      servizi: String(fd.get('servizi') || '').split(',').map((s) => s.trim()).filter(Boolean),
      trattamento: String(fd.get('trattamento') || '') || undefined,
      esigenze: String(fd.get('esigenze') || '') || undefined
    };

    const response = await fetch(`${API_BASE}/api/matching/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = await response.json();
    if (!response.ok) {
      setError(json.error || 'Errore nella ricerca strutture');
      return;
    }

    setItems(json.items || []);
    setSelected('');
    setPricing(null);
  }

  async function checkPrice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const fd = new FormData(e.currentTarget);
    const etaBambini = String(fd.get('etaBambini') || '')
      .split(',')
      .map((x) => Number(x.trim()))
      .filter((n) => Number.isFinite(n));

    const body = {
      slug: selected,
      checkin: String(fd.get('checkin') || ''),
      checkout: String(fd.get('checkout') || ''),
      adulti: Number(fd.get('adulti') || 2),
      bambini: Number(fd.get('bambini') || 0),
      etaBambini,
      camera: String(fd.get('camera') || '') || undefined
    };

    const response = await fetch(`${API_BASE}/api/pricing/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = await response.json();
    if (!response.ok) {
      setError(json.error || 'Errore nel controllo prezzo/disponibilità');
      return;
    }

    setPricing(json);
  }

  return (
    <main style={{ fontFamily: 'Inter, sans-serif', maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      <h1>Dashboard Booking Assistita</h1>
      <p>Compila il profilo cliente e ottieni strutture consigliate con motivazioni + script vendita.</p>

      <form onSubmit={search} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
        <select name="tipoCliente" required>
          <option value="">Target</option>
          <option value="famiglia">Famiglia</option>
          <option value="coppia">Coppia</option>
          <option value="senior">Senior</option>
          <option value="gruppo">Gruppo</option>
          <option value="risparmio">Risparmio</option>
        </select>
        <input name="budget" type="number" placeholder="Budget €" required />
        <input name="destinazione" placeholder="Destinazione/regione" />
        <input name="distanzaMareMax" type="number" placeholder="Distanza mare max (m)" />
        <input name="servizi" placeholder="Servizi (es: animazione,spa)" />
        <input name="trattamento" placeholder="Trattamento" />
        <input name="esigenze" placeholder="Esigenze specifiche" style={{ gridColumn: 'span 2' }} />
        <button type="submit">Suggerisci strutture</button>
      </form>

      {error && <p style={{ color: '#b42318', fontWeight: 600 }}>{error}</p>}

      <section>
        {items.map((it) => (
          <article key={it.property.slug} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10, marginTop: 10 }}>
            <h3>
              {it.property.nome} — Score {it.score}
            </h3>
            <p>{it.property.descrizione}</p>
            <ul>{it.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
            <p><b>Perché proporla:</b> {it.sales.percheProporla}</p>
            <p><b>Telefono:</b> {it.sales.telefono}</p>
            <p><b>WhatsApp:</b> {it.sales.whatsapp}</p>
            <button onClick={() => setSelected(it.property.slug)}>Seleziona per preventivo live</button>
          </article>
        ))}
      </section>

      {selected && (
        <section style={{ marginTop: 16 }}>
          <h2>Controllo disponibilità/prezzo live: {selectedItem?.property.nome}</h2>
          <form onSubmit={checkPrice} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
            <input name="checkin" type="date" required />
            <input name="checkout" type="date" required />
            <input name="adulti" type="number" min={1} defaultValue={2} />
            <input name="bambini" type="number" min={0} defaultValue={0} />
            <input name="etaBambini" placeholder="Età bambini (es: 4,9)" />
            <input name="camera" placeholder="Camera (opzionale)" />
            <button type="submit">Verifica live</button>
          </form>
        </section>
      )}

      {pricing && (
        <pre style={{ background: '#f8f8f8', padding: 10, marginTop: 12, whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(pricing, null, 2)}
        </pre>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
