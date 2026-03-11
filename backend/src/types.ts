export type CustomerType = 'famiglia' | 'coppia' | 'senior' | 'gruppo' | 'risparmio';

export type CustomerProfile = {
  tipoCliente: CustomerType;
  budget: number;
  destinazione?: string;
  distanzaMareMax?: number;
  servizi: string[];
  trattamento?: string;
  esigenze?: string;
};

export type Property = {
  id: number;
  nome: string;
  slug: string;
  url: string;
  regione?: string;
  localita?: string;
  categoria?: string;
  descrizione?: string;
  distanzaMare?: number;
  trattamento?: string;
  servizi: string[];
  target: string[];
  keywords: string[];
};

export type PricingInput = {
  slug: string;
  checkin: string;
  checkout: string;
  adulti: number;
  bambini: number;
  etaBambini?: number[];
  camera?: string;
};
