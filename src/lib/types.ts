export interface Tenant {
  tenant_id: string;
  tenant_name: string;
  contact_email?: string;
  created_at: string;
}

export interface Factors {
  gridIntensityKgPerKWh: number;
  pue: number;
  networkWhPerGb: {
    low: number;
    mid: number;
    high: number;
  };
  storageKWhPerTbMonth?: number | null;
  computeKWhPerVcpuHour?: number | null;
  functionsKWhPerGbSecond?: number | null;
}

export interface Inputs {
  tenant_id: string;
  period: string;
  bandwidth_gb: number;
  storage_tb_months?: number;
  build_minutes?: number;
  build_vcpu_hours?: number;
  functions_gb_seconds?: number;
  users_count?: number;
  systems_count?: number;
  ccft_scope12_market_kg?: number;
  ccft_scope12_location_kg?: number;
  notes?: string;
}

export interface Scope12Results {
  marketKg: number;
  locationKg: number;
  perUserMarketKg: number;
  perSystemMarketKg: number;
  perUserLocationKg: number;
  perSystemLocationKg: number;
}

export interface TotalChainBand {
  kg: number;
  perGbG: number;
  perUserKg: number;
  perSystemKg: number;
}

export interface TotalChainResults {
  low: TotalChainBand;
  mid: TotalChainBand;
  high: TotalChainBand;
}

export interface CalculationResults {
  scope12: Scope12Results;
  totalChain: TotalChainResults;
}

export interface EmissionRun {
  tenant_id: string;
  period: string;
  inputs: Inputs;
  factors: Factors;
  results: CalculationResults;
  created_at: string;
}