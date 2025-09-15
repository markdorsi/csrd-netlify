import type { Inputs, Factors, CalculationResults, Scope12Results, TotalChainResults, TotalChainBand } from './types';

export function toVcpuHoursFromMinutes(minutes?: number, vcpus: number = 2): number {
  if (!minutes) return 0;
  return (minutes / 60) * vcpus;
}

function calculateNetworkEmissions(
  bandwidthGb: number,
  whPerGb: number,
  pue: number,
  gridIntensity: number
): number {
  const kWh = (bandwidthGb * whPerGb) / 1000;
  return kWh * pue * gridIntensity;
}

function calculatePerUnitMetrics(
  totalKg: number,
  usersCount: number,
  systemsCount: number,
  bandwidthGb: number
): { perUserKg: number; perSystemKg: number; perGbG: number } {
  const users = Math.max(usersCount || 1, 1);
  const systems = Math.max(systemsCount || 1, 1);
  const bandwidth = Math.max(bandwidthGb || 1, 1);

  return {
    perUserKg: totalKg / users,
    perSystemKg: totalKg / systems,
    perGbG: (totalKg * 1000) / bandwidth // Convert kg to grams for per-GB metric
  };
}

export function calculate(inputs: Inputs, factors: Factors): CalculationResults {
  const bandwidth = inputs.bandwidth_gb || 0;
  const users = inputs.users_count || 1;
  const systems = inputs.systems_count || 1;

  // Calculate network emissions for low/mid/high scenarios
  const networkLow = calculateNetworkEmissions(
    bandwidth,
    factors.networkWhPerGb.low,
    factors.pue,
    factors.gridIntensityKgPerKWh
  );
  const networkMid = calculateNetworkEmissions(
    bandwidth,
    factors.networkWhPerGb.mid,
    factors.pue,
    factors.gridIntensityKgPerKWh
  );
  const networkHigh = calculateNetworkEmissions(
    bandwidth,
    factors.networkWhPerGb.high,
    factors.pue,
    factors.gridIntensityKgPerKWh
  );

  // Optional additional emissions (storage, compute, functions)
  const vcpuHours = inputs.build_vcpu_hours ?? toVcpuHoursFromMinutes(inputs.build_minutes);
  const storageKWh = (inputs.storage_tb_months || 0) * (factors.storageKWhPerTbMonth || 0);
  const computeKWh = (vcpuHours || 0) * (factors.computeKWhPerVcpuHour || 0);
  const functionsKWh = (inputs.functions_gb_seconds || 0) * (factors.functionsKWhPerGbSecond || 0);

  const additionalKg = (storageKWh + computeKWh + functionsKWh) * factors.pue * factors.gridIntensityKgPerKWh;

  // Total chain emissions (proxy for Scope 1+2+3)
  const totalLow = networkLow + (factors.storageKWhPerTbMonth ? additionalKg : 0);
  const totalMid = networkMid + (factors.storageKWhPerTbMonth ? additionalKg : 0);
  const totalHigh = networkHigh + (factors.storageKWhPerTbMonth ? additionalKg : 0);

  // Calculate per-unit metrics for total chain
  const lowMetrics = calculatePerUnitMetrics(totalLow, users, systems, bandwidth);
  const midMetrics = calculatePerUnitMetrics(totalMid, users, systems, bandwidth);
  const highMetrics = calculatePerUnitMetrics(totalHigh, users, systems, bandwidth);

  const totalChain: TotalChainResults = {
    low: { kg: totalLow, ...lowMetrics },
    mid: { kg: totalMid, ...midMetrics },
    high: { kg: totalHigh, ...highMetrics }
  };

  // Scope 1+2 from CCFT data
  const scope12Market = inputs.ccft_scope12_market_kg || 0;
  const scope12Location = inputs.ccft_scope12_location_kg || 0;

  const scope12: Scope12Results = {
    marketKg: scope12Market,
    locationKg: scope12Location,
    perUserMarketKg: scope12Market / users,
    perSystemMarketKg: scope12Market / systems,
    perUserLocationKg: scope12Location / users,
    perSystemLocationKg: scope12Location / systems,
  };

  return {
    scope12,
    totalChain
  };
}

export function validateInputs(inputs: Partial<Inputs>): string[] {
  const errors: string[] = [];

  if (!inputs.tenant_id?.trim()) {
    errors.push('Tenant ID is required');
  }

  if (!inputs.period?.trim()) {
    errors.push('Period is required');
  }

  if (!inputs.bandwidth_gb && !inputs.ccft_scope12_market_kg && !inputs.ccft_scope12_location_kg) {
    errors.push('Either bandwidth or CCFT Scope 1+2 values are required');
  }

  if (inputs.bandwidth_gb !== undefined && inputs.bandwidth_gb < 0) {
    errors.push('Bandwidth must be non-negative');
  }

  if (inputs.storage_tb_months !== undefined && inputs.storage_tb_months < 0) {
    errors.push('Storage must be non-negative');
  }

  if (inputs.build_minutes !== undefined && inputs.build_minutes < 0) {
    errors.push('Build minutes must be non-negative');
  }

  if (inputs.functions_gb_seconds !== undefined && inputs.functions_gb_seconds < 0) {
    errors.push('Functions GB-seconds must be non-negative');
  }

  if (inputs.users_count !== undefined && inputs.users_count <= 0) {
    errors.push('Users count must be positive');
  }

  if (inputs.systems_count !== undefined && inputs.systems_count <= 0) {
    errors.push('Systems count must be positive');
  }

  // Warn about extreme values
  if (inputs.bandwidth_gb && inputs.bandwidth_gb > 10_000_000) { // >10PB
    errors.push('Warning: Bandwidth seems extremely high (>10PB)');
  }

  return errors;
}