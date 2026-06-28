// types.ts

export interface CustomerInput {
  driverAge: number;
  vehicleAge: number;
  vehicleType: "Sedan" | "Hatchback" | "SUV" | "Luxury";
  previousClaims: number;
  annualMileage: number;
  estimatedRepairCost: number;
  claimType: "Minor" | "Moderate" | "Major";
}

export interface RiskBreakdown {
  driver_age: number;
  vehicle_age: number;
  previous_claims: number;
  annual_mileage: number;
}

export interface RiskResult {
  totalScore: number;
  category: "Low Risk" | "Medium Risk" | "High Risk";
  color: "green" | "orange" | "red";
  breakdown: RiskBreakdown;
}

export interface Adjustment {
  factor: string;
  percentage: string;
  amount: number;
}

export interface PremiumResult {
  basePremium: number;
  adjustments: Adjustment[];
  totalAdjustments: number;
  finalPremium: number;
}

export interface ReserveResult {
  claimType: "Minor" | "Moderate" | "Major";
  estimatedRepairCost: number;
  minimumReserveThreshold: number;
  reserveAmount: number;
  rationale: string;
}

export interface HistoricalRecord {
  driver_age: number;
  vehicle_age: number;
  vehicle_type: string;
  previous_claims: number;
  annual_mileage: number;
  estimated_repair_cost: number;
  claim_type: string;
  risk_score: number;
  risk_category: string;
  calculated_premium: number;
  claim_reserve: number;
}
