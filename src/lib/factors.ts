import type { Factors } from './types';

export const DEFAULT_FACTORS: Factors = {
  gridIntensityKgPerKWh: 0.494, // Global average grid intensity
  pue: 1.135, // Power Usage Effectiveness for modern data centers
  networkWhPerGb: {
    low: 10,   // Conservative estimate (Wh per GB transferred)
    mid: 30,   // Mid-range estimate
    high: 72   // High-end estimate including full network infrastructure
  },
  storageKWhPerTbMonth: null,     // To be implemented later
  computeKWhPerVcpuHour: null,    // To be implemented later
  functionsKWhPerGbSecond: null   // To be implemented later
};

export function validateFactors(factors: Partial<Factors>): Factors {
  return {
    gridIntensityKgPerKWh: factors.gridIntensityKgPerKWh ?? DEFAULT_FACTORS.gridIntensityKgPerKWh,
    pue: factors.pue ?? DEFAULT_FACTORS.pue,
    networkWhPerGb: {
      low: factors.networkWhPerGb?.low ?? DEFAULT_FACTORS.networkWhPerGb.low,
      mid: factors.networkWhPerGb?.mid ?? DEFAULT_FACTORS.networkWhPerGb.mid,
      high: factors.networkWhPerGb?.high ?? DEFAULT_FACTORS.networkWhPerGb.high,
    },
    storageKWhPerTbMonth: factors.storageKWhPerTbMonth ?? DEFAULT_FACTORS.storageKWhPerTbMonth,
    computeKWhPerVcpuHour: factors.computeKWhPerVcpuHour ?? DEFAULT_FACTORS.computeKWhPerVcpuHour,
    functionsKWhPerGbSecond: factors.functionsKWhPerGbSecond ?? DEFAULT_FACTORS.functionsKWhPerGbSecond,
  };
}