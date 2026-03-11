import { runCrawler } from './crawler.js';

const n = await runCrawler();
console.log(`Ingestion completata: ${n} pagine analizzate`);
