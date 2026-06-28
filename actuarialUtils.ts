// actuarialUtils.ts
import { RiskResult, PremiumResult, ReserveResult } from "./types";

export function calculateRiskScoreTS(
  driverAge: number,
  vehicleAge: number,
  previousClaims: number,
  annualMileage: number
): RiskResult {
  let driver_pts = 10;
  if (driverAge < 25) {
    driver_pts = 30;
  } else if (driverAge > 60) {
    driver_pts = 20;
  }

  const vehicle_pts = vehicleAge < 5 ? 5 : 15;

  let claims_pts = 0;
  if (previousClaims >= 1 && previousClaims <= 2) {
    claims_pts = 15;
  } else if (previousClaims >= 3) {
    claims_pts = 30;
  }

  const mileage_pts = annualMileage > 20000 ? 15 : 5;

  const totalScore = driver_pts + vehicle_pts + claims_pts + mileage_pts;

  let category: "Low Risk" | "Medium Risk" | "High Risk" = "Low Risk";
  let color: "green" | "orange" | "red" = "green";

  if (totalScore <= 30) {
    category = "Low Risk";
    color = "green";
  } else if (totalScore <= 60) {
    category = "Medium Risk";
    color = "orange";
  } else {
    category = "High Risk";
    color = "red";
  }

  return {
    totalScore,
    category,
    color,
    breakdown: {
      driver_age: driver_pts,
      vehicle_age: vehicle_pts,
      previous_claims: claims_pts,
      annual_mileage: mileage_pts,
    },
  };
}

export function calculatePremiumTS(
  driverAge: number,
  vehicleAge: number,
  previousClaims: number,
  vehicleType: "Sedan" | "Hatchback" | "SUV" | "Luxury"
): PremiumResult {
  const basePremium = 5000;
  const adjustments = [];

  if (driverAge < 25) {
    const amt = basePremium * 0.20;
    adjustments.push({
      factor: "Driver age below 25",
      percentage: "+20%",
      amount: amt,
    });
  }

  if (vehicleAge > 5) {
    const amt = basePremium * 0.10;
    adjustments.push({
      factor: "Vehicle age above 5 years",
      percentage: "+10%",
      amount: amt,
    });
  }

  if (previousClaims >= 1 && previousClaims <= 2) {
    const amt = basePremium * 0.15;
    adjustments.push({
      factor: "1-2 previous claims",
      percentage: "+15%",
      amount: amt,
    });
  } else if (previousClaims >= 3) {
    const amt = basePremium * 0.25;
    adjustments.push({
      factor: "3+ previous claims",
      percentage: "+25%",
      amount: amt,
    });
  }

  if (vehicleType.toLowerCase() === "luxury") {
    const amt = basePremium * 0.20;
    adjustments.push({
      factor: "Luxury vehicle segment premium loading",
      percentage: "+20%",
      amount: amt,
    });
  }

  const totalAdjustments = adjustments.reduce((acc, curr) => acc + curr.amount, 0);
  const finalPremium = basePremium + totalAdjustments;

  return {
    basePremium,
    adjustments,
    totalAdjustments,
    finalPremium,
  };
}

export function calculateReserveTS(
  claimType: "Minor" | "Moderate" | "Major",
  estimatedRepairCost: number
): ReserveResult {
  let minReserve = 15000;
  let severityLabel = "Minor Claim";

  if (claimType === "Moderate") {
    minReserve = 40000;
    severityLabel = "Moderate Claim";
  } else if (claimType === "Major") {
    minReserve = 75000;
    severityLabel = "Major Claim";
  }

  const reserveAmount = Math.max(estimatedRepairCost, minReserve);

  let rationale = "";
  if (estimatedRepairCost >= minReserve) {
    rationale = `The outstanding claim reserve is set to ₹${reserveAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} because the estimated repair cost (₹${estimatedRepairCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}) exceeds the minimum regulatory baseline reserve of ₹${minReserve.toLocaleString("en-IN", { minimumFractionDigits: 2 })} specified for a ${severityLabel}.`;
  } else {
    rationale = `The outstanding claim reserve is set to the regulatory minimum baseline of ₹${minReserve.toLocaleString("en-IN", { minimumFractionDigits: 2 })} for a ${severityLabel}, as the reported estimated repair cost of ₹${estimatedRepairCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })} falls below this threshold to protect against tail risk and potential scope increase.`;
  }

  return {
    claimType,
    estimatedRepairCost,
    minimumReserveThreshold: minReserve,
    reserveAmount,
    rationale,
  };
}
