# Seinvacanza Booking Assistant

Applicazione interna per team booking: ingestione strutture, ranking spiegabile, controllo live disponibilità/prezzo e suggerimenti commerciali.

## Cosa è stato corretto
- separazione netta moduli `ingestion`, `pricing-search`, `matching`, `sales-copy`, `ui`;
- validazione robusta input API con errori JSON leggibili;
- rimozione endpoint hardcoded lato UI (usa `VITE_API_BASE_URL`);
- date preventivo normalize (`YYYY-MM-DD` o `DD/MM/YYYY`);
- supporto età bambini e camera richiesta nel pricing payload/cache;
- estensione ingestione con campi: regione, categoria, trattamento, distanza mare (quando rilevabili).

## Analisi tecnica sito
### Fonti dati strutture
- listing: `/hotel`, `/villaggi`, `/resort`, `/residence`;
- dettaglio struttura: pattern URL `/vacanze-<regione>/<slug>`.

### Flusso prezzo/disponibilità intercettato
Sulle pagine struttura è presente `#search-form` con action `GET /risultati-ricerca` e parametri principali:
- `ric_id_destinazione`
- `tipo_destinazione`
- `datefilter`
- `numAduVal_Cam1`
- `numBamVal_Cam1`

Il modulo pricing rilancia **sempre** la ricerca live al momento della richiesta.

## Architettura
- `backend/src/ingestion`: crawling/scraping semi-statico;
- `backend/src/pricing-search`: ricerca live prezzi/disponibilità;
- `backend/src/matching`: scoring cliente-struttura con motivazioni;
- `backend/src/sales-copy`: testo telefono/WhatsApp/email + obiezioni;
- `backend/src/routes`: API;
- `ui/`: dashboard React per operatori booking.

## Database (SQLite)
### `properties`
Anagrafica struttura + segnali commerciali (`servizi_json`, `target_json`, `keywords_json`).

### `price_cache`
Snapshot tecnico delle ricerche live (cache secondaria, non fonte primaria):
- occupazione,
- età bambini,
- camera,
- prezzo/disponibilità,
- raw response estratta.

## Configurazione
Copia `.env.example` in `.env`.

Variabili principali:
- `PORT`
- `DB_PATH`
- `BASE_URL`
- `INGESTION_LIMIT`
- `CORS_ORIGIN`
- `VITE_API_BASE_URL`

## Avvio locale
```bash
npm install
cp .env.example .env
npm run ingest -w backend
npm run dev -w backend
npm run dev -w ui
```

Backend: `http://localhost:8080`
Frontend: `http://localhost:5173`

## API
- `POST /api/ingestion/run`
- `POST /api/matching/search`
- `POST /api/pricing/check`

## Esempio payload pricing
```json
{
  "slug": "green-park-village",
  "checkin": "2026-07-10",
  "checkout": "2026-07-17",
  "adulti": 2,
  "bambini": 2,
  "etaBambini": [4, 9],
  "camera": "family"
}
```

## Note operative
- se `npm install` fallisce per policy rete/registry, sbloccare accesso a `registry.npmjs.org` o configurare un mirror aziendale;
- senza ingestion iniziale, il matching può restituire pochi/zero risultati.
