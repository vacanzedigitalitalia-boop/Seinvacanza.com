import { CustomerProfile, Property } from '../types.js';

export function generateSalesCopy(profile: CustomerProfile, property: Property) {
  const nome = property.nome;
  const focus = profile.tipoCliente === 'famiglia' ? 'servizi family e praticità' : profile.tipoCliente === 'coppia' ? 'comfort e atmosfera' : 'rapporto qualità/prezzo';
  return {
    percheProporla: `${nome} è coerente con il profilo ${profile.tipoCliente} per ${focus}.`,
    pitch20s: `${nome} è una soluzione affidabile: struttura curata, servizi chiave e posizionamento comodo rispetto alle esigenze indicate.`,
    telefono: `Se vuole una vacanza senza sorprese, ${nome} le dà un buon equilibrio tra comfort, servizi e convenienza.`,
    whatsapp: `Le consiglio ${nome}: ottima per le sue esigenze, con servizi utili e formula adatta al suo viaggio. Se vuole, le preparo subito il preventivo aggiornato.`,
    email: `Buongiorno, in base a quanto richiesto le suggerisco ${nome}. È una proposta molto centrata per il suo profilo; resto a disposizione per inviarle disponibilità e prezzo aggiornati.`,
    obiezioni: [
      { obiezione: 'Ho paura che sia distante dal mare', risposta: 'Verifichiamo insieme distanza reale e navetta così decide con informazioni precise.' },
      { obiezione: 'Il prezzo è alto', risposta: 'Controllo subito alternative simili e promo attive per ottimizzare il budget.' }
    ]
  };
}
