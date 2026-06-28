import { useState, useEffect, useRef } from "react";
import { 
  User, 
  Car, 
  Coins, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Code, 
  Download, 
  Copy, 
  Check, 
  Activity, 
  TrendingUp, 
  Sparkles,
  Info,
  MessageSquare,
  X,
  Upload,
  Trash2
} from "lucide-react";
import { motion } from "motion/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter,
  ZAxis,
  Cell
} from "recharts";
import { jsPDF } from "jspdf";

import { CustomerInput, RiskResult, PremiumResult, ReserveResult, HistoricalRecord } from "./types";
import { calculateRiskScoreTS, calculatePremiumTS, calculateReserveTS } from "./actuarialUtils";
import { HISTORICAL_DATA } from "./historicalData";

export default function App() {
  // Input parameters state
  const [driverAge, setDriverAge] = useState<number>(28);
  const [vehicleAge, setVehicleAge] = useState<number>(3);
  const [vehicleType, setVehicleType] = useState<"Sedan" | "Hatchback" | "SUV" | "Luxury">("Sedan");
  const [previousClaims, setPreviousClaims] = useState<number>(0);
  const [annualMileage, setAnnualMileage] = useState<number>(12000);
  const [estimatedRepairCost, setEstimatedRepairCost] = useState<number>(25000);
  const [claimType, setClaimType] = useState<"Minor" | "Moderate" | "Major">("Minor");

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<"pricing" | "reserving" | "analytics" | "code">("pricing");

  // Explanation states
  const [pricingExplanation, setPricingExplanation] = useState<string>("");
  const [pricingIsGenerating, setPricingIsGenerating] = useState<boolean>(false);
  const [pricingExplanationType, setPricingExplanationType] = useState<"ai" | "rules">("rules");

  const [reservingExplanation, setReservingExplanation] = useState<string>("");
  const [reservingIsGenerating, setReservingIsGenerating] = useState<boolean>(false);
  const [reservingExplanationType, setReservingExplanationType] = useState<"ai" | "rules">("rules");

  // Dynamic portfolio database initialized with HISTORICAL_DATA
  const [portfolioRecords, setPortfolioRecords] = useState<HistoricalRecord[]>(HISTORICAL_DATA);
  const [selectedHistoricalIndex, setSelectedHistoricalIndex] = useState<number>(0);

  // Document upload / feedback states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Custom API key configurations
  const [customApiKey, setCustomApiKey] = useState<string>(() => localStorage.getItem("gemini_api_key") || "");
  const [showApiSettings, setShowApiSettings] = useState<boolean>(false);

  // Interactive Floating Chat States
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [activeAgent, setActiveAgent] = useState<"pricing" | "reserving">("pricing");

  // Sync activeAgent automatically when activeTab changes
  useEffect(() => {
    if (activeTab === "pricing") {
      setActiveAgent("pricing");
    } else if (activeTab === "reserving") {
      setActiveAgent("reserving");
    }
  }, [activeTab]);

  const [pricingMessages, setPricingMessages] = useState<{ role: "user" | "model"; content: string }[]>([
    { 
      role: "model", 
      content: "Greetings. I am your Pricing Underwriting Agent. I specialize in multi-dimensional risk ratings, loaded premiums, and loading surcharges. Ask me any pricing questions!" 
    }
  ]);
  const [reservingMessages, setReservingMessages] = useState<{ role: "user" | "model"; content: string }[]>([
    { 
      role: "model", 
      content: "Greetings. I am your Reserving Actuary Agent. I specialize in claims reserving allocations, loss reserves, and outstanding solvency guidelines. Ask me any reserving questions!" 
    }
  ]);

  const chatMessages = activeAgent === "pricing" ? pricingMessages : reservingMessages;

  const setChatMessages = (updaterOrValue: any) => {
    if (activeAgent === "pricing") {
      setPricingMessages(updaterOrValue);
    } else {
      setReservingMessages(updaterOrValue);
    }
  };

  const [chatInput, setChatInput] = useState<string>("");
  const [isSendingChatMessage, setIsSendingChatMessage] = useState<boolean>(false);
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatOpen, activeAgent]);

  // Copy code feedback state
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // Selected code explorer file
  const [selectedFile, setSelectedFile] = useState<string>("app.py");

  // Perform client-side risk & pricing calculations
  const riskResult: RiskResult = calculateRiskScoreTS(driverAge, vehicleAge, previousClaims, annualMileage);
  const premiumResult: PremiumResult = calculatePremiumTS(driverAge, vehicleAge, previousClaims, vehicleType);
  const reserveResult: ReserveResult = calculateReserveTS(claimType, estimatedRepairCost);

  // Generate standard explanation rules-based for pricing
  const generatePricingRulesExplanation = () => {
    let exp = `We have completed our underwriting risk evaluation for the motor insurance applicant. The applicant's profile is categorized as **${riskResult.category}** with a final actuarial risk score of **${riskResult.totalScore}/90** points. `;
    
    const surchargeReasons: string[] = [];
    if (driverAge < 25) surchargeReasons.push("young driver age surcharge of +20% (statistically higher accident frequency under 25)");
    if (vehicleAge > 5) surchargeReasons.push("vehicle age depreciation risk loading of +10% (higher mechanical breakdown potential)");
    if (previousClaims > 0) surchargeReasons.push(`loss frequency loading factor of +${previousClaims >= 3 ? "25%" : "15%"} based on ${previousClaims} historical claim events`);
    if (vehicleType === "Luxury") surchargeReasons.push("luxury vehicle loading of +20% (elevated repair and parts sourcing costs)");

    if (surchargeReasons.length > 0) {
      exp += `The final loaded premium is calculated at **₹${premiumResult.finalPremium.toLocaleString("en-IN")}** (against a baseline of ₹${premiumResult.basePremium.toLocaleString("en-IN")}), incorporating the following adjustments: ${surchargeReasons.join("; ")}; resulting in ₹${premiumResult.totalAdjustments.toLocaleString("en-IN")} total risk loaders. `;
    } else {
      exp += `The final premium remains at the standard baseline rate of **₹${premiumResult.basePremium.toLocaleString("en-IN")}** as the applicant qualifies as a preferred-risk operator with zero loaded surcharges. `;
    }
    exp += `This premium structure has been validated by the Underwriting Committee to ensure aligned portfolio hazard rating controls.`;
    return exp;
  };

  // Generate standard explanation rules-based for reserving
  const generateReservingRulesExplanation = () => {
    let exp = `Regarding claims reserving and solvency provision: a loss file of **${claimType}** severity has been evaluated alongside an estimated physical repair cost of **₹${estimatedRepairCost.toLocaleString("en-IN")}**. `;
    exp += `To safeguard solvency and cover tail-risk, the recommended outstanding claims reserve has been established at **₹${reserveResult.reserveAmount.toLocaleString("en-IN")}**. ${reserveResult.rationale} `;
    exp += `This reserve allocation secures adequate reserving margins to cover unexpected cost escalations and protects our solvency margins.`;
    return exp;
  };

  // Sync / load explanation on parameter changes
  useEffect(() => {
    setPricingExplanation(generatePricingRulesExplanation());
    setPricingExplanationType("rules");
  }, [driverAge, vehicleAge, vehicleType, previousClaims, annualMileage]);

  useEffect(() => {
    setReservingExplanation(generateReservingRulesExplanation());
    setReservingExplanationType("rules");
  }, [claimType, estimatedRepairCost]);

  // Handle calling Express backend to generate advanced Gemini explanation
  const handleRequestAIExplanation = async (type: "pricing" | "reserving") => {
    if (type === "pricing") {
      setPricingIsGenerating(true);
    } else {
      setReservingIsGenerating(true);
    }
    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverAge,
          vehicleAge,
          vehicleType,
          previousClaims,
          annualMileage,
          estimatedRepairCost,
          claimType,
          riskScore: riskResult.totalScore,
          riskCategory: riskResult.category,
          basePremium: premiumResult.basePremium,
          premiumAdjustments: premiumResult.adjustments,
          finalPremium: premiumResult.finalPremium,
          suggestedReserve: reserveResult.reserveAmount,
          reserveRationale: reserveResult.rationale,
          customApiKey,
          type
        })
      });
      const data = await response.json();
      if (data.explanation) {
        if (type === "pricing") {
          setPricingExplanation(data.explanation);
          setPricingExplanationType(data.isFallback ? "rules" : "ai");
        } else {
          setReservingExplanation(data.explanation);
          setReservingExplanationType(data.isFallback ? "rules" : "ai");
        }
      }
    } catch (err) {
      console.error(`Failed to fetch server-side Gemini ${type} analysis. Falling back to rules-based:`, err);
      if (type === "pricing") {
        setPricingExplanation(generatePricingRulesExplanation());
        setPricingExplanationType("rules");
      } else {
        setReservingExplanation(generateReservingRulesExplanation());
        setReservingExplanationType("rules");
      }
    } finally {
      if (type === "pricing") {
        setPricingIsGenerating(false);
      } else {
        setReservingIsGenerating(false);
      }
    }
  };

  const handleUpdateApiKey = (key: string) => {
    setCustomApiKey(key);
    localStorage.setItem("gemini_api_key", key);
  };

  // Handle sending interactive chat messages to the server-side AI Underwriting Agent
  const handleSendChatMessage = async (e?: any) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isSendingChatMessage) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    
    const newMessages = [...chatMessages, { role: "user" as const, content: userMsg }];
    setChatMessages(newMessages);
    setIsSendingChatMessage(true);

    try {
      // Create portfolio statistics context from portfolioRecords
      const count = portfolioRecords.length;
      const totalScore = portfolioRecords.reduce((sum, item) => sum + item.risk_score, 0);
      const avgRiskScore = Math.round((totalScore / count) * 10) / 10;
      const totalPremium = portfolioRecords.reduce((sum, item) => sum + item.calculated_premium, 0);
      const avgPremium = Math.round(totalPremium / count);
      const totalReserves = portfolioRecords.reduce((sum, item) => sum + item.claim_reserve, 0);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          currentPolicy: {
            driverAge,
            vehicleAge,
            vehicleType,
            previousClaims,
            annualMileage,
            estimatedRepairCost,
            claimType,
            riskScore: riskResult.totalScore,
            riskCategory: riskResult.category,
            basePremium: premiumResult.basePremium,
            finalPremium: premiumResult.finalPremium,
            suggestedReserve: reserveResult.reserveAmount,
          },
          portfolioSummary: {
            count,
            avgRiskScore,
            avgPremium,
            totalReserves
          },
          customApiKey: customApiKey,
          agentType: activeAgent
        })
      });

      const data = await response.json();
      if (response.ok && data.reply) {
        setChatMessages(prev => [...prev, { role: "model" as const, content: data.reply }]);
      } else {
        const errorMsg = data.error || "Failed to communicate with the AI Underwriting Agent.";
        setChatMessages(prev => [...prev, { role: "model" as const, content: `⚠️ Error: ${errorMsg}` }]);
      }
    } catch (err) {
      console.error("Failed to chat with AI agent:", err);
      setChatMessages(prev => [...prev, { role: "model" as const, content: "⚠️ Network Error: Unable to reach the server. Please check your connection." }]);
    } finally {
      setIsSendingChatMessage(false);
    }
  };

  // Client-side PDF downloader using jsPDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Draw Deep Navy Header banner
    doc.setFillColor(30, 58, 138); // #1E3A8A
    doc.rect(0, 0, 210, 18, "F"); 
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("UNDERWRITING RISK & CLAIM RESERVE ASSESSMENT REPORT", 15, 11);
    
    // Document Title
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(18);
    doc.text("Motor Insurance Professional File Brief", 15, 30);
    
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont("helvetica", "normal");
    doc.text("Generated by: AI Insurance Underwriter & Reserving Agent Workstation", 15, 36);
    doc.text(`Assessment Timestamp: ${new Date().toLocaleString()}`, 15, 41);
    
    // Horizontal divider
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(15, 45, 195, 45);
    
    // Section 1: Customer Profile
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text("1. CUSTOMER & VEHICLE PARAMETERS", 15, 52);
    
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Driver Age:", 15, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`${driverAge} Years`, 40, 60);
    
    doc.setFont("helvetica", "bold");
    doc.text("Vehicle Age:", 15, 66);
    doc.setFont("helvetica", "normal");
    doc.text(`${vehicleAge} Years`, 40, 66);
    
    doc.setFont("helvetica", "bold");
    doc.text("Vehicle Segment:", 95, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`${vehicleType}`, 125, 60);
    
    doc.setFont("helvetica", "bold");
    doc.text("Annual Exposure:", 95, 66);
    doc.setFont("helvetica", "normal");
    doc.text(`${annualMileage.toLocaleString()} KM/Year`, 125, 66);

    doc.setFont("helvetica", "bold");
    doc.text("Prior Claims Count:", 15, 72);
    doc.setFont("helvetica", "normal");
    doc.text(`${previousClaims} claims`, 45, 72);
    
    // Section 2: Actuarial Risk Scoring
    doc.line(15, 78, 195, 78);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text("2. ACTUARIAL RISK EVALUATION INDEX", 15, 85);
    
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Risk Score Assigned:", 15, 93);
    doc.setFont("helvetica", "bold");
    doc.text(`${riskResult.totalScore} / 90 Points`, 50, 93);
    
    doc.setFont("helvetica", "normal");
    doc.text("Assigned Classification:", 15, 99);
    doc.setFont("helvetica", "bold");
    doc.text(`${riskResult.category}`, 50, 99);
    
    doc.setFont("helvetica", "bold");
    doc.text("Score Breakdown Weighting Table:", 100, 93);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`- Young Driver Factor Loading:  ${riskResult.breakdown.driver_age} pts`, 102, 99);
    doc.text(`- Vehicle Aging Depreciation:   ${riskResult.breakdown.vehicle_age} pts`, 102, 104);
    doc.text(`- Historical Claims Factor:     ${riskResult.breakdown.previous_claims} pts`, 102, 109);
    doc.text(`- High Exposure Mileage Factor:  ${riskResult.breakdown.annual_mileage} pts`, 102, 114);

    // Section 3: Pricing Recommendation
    doc.line(15, 120, 195, 120);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text("3. UNDERWRITING PREMIUM LOADING STRUCTURE", 15, 127);
    
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Base Premium Rate (Standard Risk):", 15, 135);
    doc.setFont("helvetica", "normal");
    doc.text(`INR ${premiumResult.basePremium.toLocaleString("en-IN", {minimumFractionDigits: 2})}`, 80, 135);
    
    let y = 141;
    premiumResult.adjustments.forEach(adj => {
      doc.text(`- ${adj.factor} (${adj.percentage}):`, 15, y);
      doc.setFont("helvetica", "bold");
      doc.text(`+ INR ${adj.amount.toLocaleString("en-IN", {minimumFractionDigits: 2})}`, 110, y);
      doc.setFont("helvetica", "normal");
      y += 6;
    });
    
    doc.setDrawColor(203, 213, 225);
    doc.line(15, y - 2, 195, y - 2);
    doc.setFont("helvetica", "bold");
    doc.text("RECOMMENDED FINAL WRITTEN PREMIUM (FWP):", 15, y + 3);
    doc.setTextColor(30, 58, 138);
    doc.text(`INR ${premiumResult.finalPremium.toLocaleString("en-IN", {minimumFractionDigits: 2})}`, 110, y + 3);
    
    // Section 4: Claims Reserves
    doc.setTextColor(15, 23, 42);
    doc.setDrawColor(226, 232, 240);
    const claimSectionY = y + 9;
    doc.line(15, claimSectionY, 195, claimSectionY);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text("4. ACTUARIAL OUTSTANDING CLAIMS RESERVES", 15, claimSectionY + 7);
    
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Claim Severity Class:", 15, claimSectionY + 15);
    doc.setFont("helvetica", "normal");
    doc.text(`${claimType} Severity`, 65, claimSectionY + 15);
    
    doc.setFont("helvetica", "bold");
    doc.text("Reported Repair Cost Estimate:", 15, claimSectionY + 21);
    doc.setFont("helvetica", "normal");
    doc.text(`INR ${estimatedRepairCost.toLocaleString("en-IN", {minimumFractionDigits: 2})}`, 65, claimSectionY + 21);
    
    doc.setFont("helvetica", "bold");
    doc.text("Severity Threshold Baseline Minimum:", 15, claimSectionY + 27);
    doc.setFont("helvetica", "normal");
    doc.text(`INR ${reserveResult.minimumReserveThreshold.toLocaleString("en-IN", {minimumFractionDigits: 2})}`, 65, claimSectionY + 27);
    
    doc.setFont("helvetica", "bold");
    doc.text("OUTSTANDING CLAIMS RESERVE PROVISION:", 15, claimSectionY + 34);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text(`INR ${reserveResult.reserveAmount.toLocaleString("en-IN", {minimumFractionDigits: 2})}`, 77, claimSectionY + 34);
    
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const rationaleLines = doc.splitTextToSize(`Methodology Note: ${reserveResult.rationale}`, 175);
    doc.text(rationaleLines, 15, claimSectionY + 40);

    // Section 5: Underwriter Narrative
    doc.setDrawColor(226, 232, 240);
    const narrY = claimSectionY + 54;
    doc.line(15, narrY, 195, narrY);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text("5. PORTFOLIO MANAGER ANALYSIS BRIEFING", 15, narrY + 7);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    
    const narrativeText = activeAgent === "pricing"
      ? (pricingExplanation || generatePricingRulesExplanation())
      : (reservingExplanation || generateReservingRulesExplanation());
    const splitNarrative = doc.splitTextToSize(narrativeText, 175);
    doc.text(splitNarrative, 15, narrY + 13);
    
    // Add Signature Footer
    const footerY = 275;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("This report is an automated actuarial assessment compiled with secure full-stack analytics guidelines.", 15, footerY);
    doc.text("Authorized by: Actuarial Underwriting & Reserves Board.", 15, footerY + 4);
    
    doc.save(`actuarial_report_${driverAge}yo_${vehicleType.toLowerCase()}.pdf`);
  };

  // Generate and download a PDF report for a historical record from the portfolio
  const handleDownloadHistoricalPDF = (record: HistoricalRecord, index: number) => {
    const doc = new jsPDF();
    
    // Draw Deep Navy Header banner
    doc.setFillColor(30, 58, 138); // #1E3A8A
    doc.rect(0, 0, 210, 18, "F"); 
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`ARCHIVED PORTFOLIO DOCUMENT - RECORD #ACT-00${index + 1}`, 15, 11);
    
    // Document Title
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(18);
    doc.text(`Actuarial Portfolio Case Brief: ACT-00${index + 1}`, 15, 30);
    
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont("helvetica", "normal");
    doc.text("Retrieved from: AI Insurance Underwriter & Reserving Agent Workstation Archive", 15, 36);
    doc.text(`Extraction Timestamp: ${new Date().toLocaleString()}`, 15, 41);
    
    // Horizontal divider
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(15, 45, 195, 45);
    
    // Section 1: Customer Profile
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text("1. CUSTOMER & VEHICLE PARAMETERS", 15, 52);
    
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Driver Age:", 15, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`${record.driver_age} Years`, 40, 60);
    
    doc.setFont("helvetica", "bold");
    doc.text("Vehicle Age:", 15, 66);
    doc.setFont("helvetica", "normal");
    doc.text(`${record.vehicle_age} Years`, 40, 66);
    
    doc.setFont("helvetica", "bold");
    doc.text("Vehicle Segment:", 95, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`${record.vehicle_type}`, 125, 60);
    
    doc.setFont("helvetica", "bold");
    doc.text("Annual Exposure:", 95, 66);
    doc.setFont("helvetica", "normal");
    doc.text(`${record.annual_mileage.toLocaleString()} KM/Year`, 125, 66);

    doc.setFont("helvetica", "bold");
    doc.text("Prior Claims Count:", 15, 72);
    doc.setFont("helvetica", "normal");
    doc.text(`${record.previous_claims} claims`, 45, 72);
    
    // Section 2: Actuarial Risk Scoring
    doc.line(15, 78, 195, 78);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text("2. ACTUARIAL RISK EVALUATION INDEX", 15, 85);
    
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Risk Score Assigned:", 15, 93);
    doc.setFont("helvetica", "bold");
    doc.text(`${record.risk_score} / 90 Points`, 50, 93);
    
    doc.setFont("helvetica", "normal");
    doc.text("Assigned Classification:", 15, 99);
    doc.setFont("helvetica", "bold");
    doc.text(`${record.risk_category}`, 50, 99);
    
    // Section 3: Pricing Recommendation
    doc.line(15, 120, 195, 120);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text("3. UNDERWRITING PREMIUM STRUCTURING", 15, 127);
    
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Baseline Premium Rate:", 15, 135);
    doc.setFont("helvetica", "normal");
    doc.text(`INR 5,000.00`, 80, 135);
    
    doc.text("Calculated Final Premium:", 15, 141);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text(`INR ${record.calculated_premium.toLocaleString("en-IN", {minimumFractionDigits: 2})}`, 80, 141);
    
    // Section 4: Claims Reserves
    doc.setTextColor(15, 23, 42);
    doc.setDrawColor(226, 232, 240);
    const claimSectionY = 155;
    doc.line(15, claimSectionY, 195, claimSectionY);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text("4. ACTUARIAL OUTSTANDING CLAIMS RESERVES", 15, claimSectionY + 7);
    
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Claim Severity Class:", 15, claimSectionY + 15);
    doc.setFont("helvetica", "normal");
    doc.text(`${record.claim_type} Severity`, 65, claimSectionY + 15);
    
    doc.setFont("helvetica", "bold");
    doc.text("Reported Repair Cost Estimate:", 15, claimSectionY + 21);
    doc.setFont("helvetica", "normal");
    doc.text(`INR ${record.estimated_repair_cost.toLocaleString("en-IN", {minimumFractionDigits: 2})}`, 65, claimSectionY + 21);
    
    doc.setFont("helvetica", "bold");
    doc.text("OUTSTANDING CLAIMS RESERVE PROVISION:", 15, claimSectionY + 27);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text(`INR ${record.claim_reserve.toLocaleString("en-IN", {minimumFractionDigits: 2})}`, 77, claimSectionY + 27);
    
    // Section 5: Underwriter Narrative
    doc.setDrawColor(226, 232, 240);
    const narrY = claimSectionY + 45;
    doc.line(15, narrY, 195, narrY);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text("5. ACTUARIAL AUDIT BRIEFING SUMMARY", 15, narrY + 7);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    
    const narrativeText = `This document records case file #ACT-00${index + 1} from our active actuarial portfolio. This profile is flagged as a ${record.risk_category} policy based on demographic hazard rating. Our pricing model calculated a final loaded premium of INR ${record.calculated_premium.toLocaleString("en-IN")} corresponding to the statistical exposure scoring of ${record.risk_score} points. For the associated ${record.claim_type} severity loss claim, an outstanding claim reserve of INR ${record.claim_reserve.toLocaleString("en-IN")} has been allocated in full compliance with state regulatory baseline solvency frameworks, safeguarding portfolio health and liquidity parameters.`;
    const splitNarrative = doc.splitTextToSize(narrativeText, 175);
    doc.text(splitNarrative, 15, narrY + 13);
    
    // Add Signature Footer
    const footerY = 275;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("This document is a certified archive extract from the Actuarial Underwriting & Reserves Board.", 15, footerY);
    doc.text("CONFIDENTIALITY NOTICE: Authorized internal actuarial access only.", 15, footerY + 4);
    
    doc.save(`actuarial_archive_ACT-00${index + 1}.pdf`);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Parse uploaded text/JSON file and integrate it into our dynamic state
  const handleFileUpload = (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        let parsedRecord: Partial<HistoricalRecord> = {};
        
        if (file.name.endsWith(".json")) {
          const raw = JSON.parse(text);
          // Standardize fields from camelCase / snake_case
          parsedRecord = {
            driver_age: raw.driver_age ?? raw.driverAge,
            vehicle_age: raw.vehicle_age ?? raw.vehicleAge,
            vehicle_type: raw.vehicle_type ?? raw.vehicleType,
            previous_claims: raw.previous_claims ?? raw.previousClaims,
            annual_mileage: raw.annual_mileage ?? raw.annualMileage,
            estimated_repair_cost: raw.estimated_repair_cost ?? raw.estimatedRepairCost,
            claim_type: raw.claim_type ?? raw.claimType,
          };
        } else {
          // Parse plain text with regex
          const ageMatch = text.match(/driver[-_\s]age[:\s]*(\d+)/i) || text.match(/age[:\s]*(\d+)/i);
          if (ageMatch) parsedRecord.driver_age = parseInt(ageMatch[1]);
          
          const vehicleAgeMatch = text.match(/vehicle[-_\s]age[:\s]*(\d+)/i) || text.match(/vehicleAge[:\s]*(\d+)/i);
          if (vehicleAgeMatch) parsedRecord.vehicle_age = parseInt(vehicleAgeMatch[1]);
          
          const claimsMatch = text.match(/claims[:\s]*(\d+)/i) || text.match(/previous[-_\s]claims[:\s]*(\d+)/i);
          if (claimsMatch) parsedRecord.previous_claims = parseInt(claimsMatch[1]);
          
          const mileageMatch = text.match(/mileage[:\s]*(\d+)/i) || text.match(/annual[-_\s]mileage[:\s]*(\d+)/i);
          if (mileageMatch) parsedRecord.annual_mileage = parseInt(mileageMatch[1]);

          const costMatch = text.match(/repair[-_\s]cost[:\s]*(\d+)/i) || text.match(/cost[:\s]*(\d+)/i) || text.match(/estimated[-_\s]repair[-_\s]cost[:\s]*(\d+)/i);
          if (costMatch) parsedRecord.estimated_repair_cost = parseInt(costMatch[1]);

          const typeMatch = text.match(/vehicle[-_\s]type[:\s]*(sedan|hatchback|suv|luxury)/i) || text.match(/type[:\s]*(sedan|hatchback|suv|luxury)/i) || text.match(/segment[:\s]*(sedan|hatchback|suv|luxury)/i);
          if (typeMatch) {
            const rawType = typeMatch[1].toLowerCase();
            parsedRecord.vehicle_type = rawType === "suv" ? "SUV" : rawType.charAt(0).toUpperCase() + rawType.slice(1);
          }

          const severityMatch = text.match(/claim[-_\s]type[:\s]*(minor|moderate|major)/i) || text.match(/severity[:\s]*(minor|moderate|major)/i) || text.match(/claim[-_\s]severity[:\s]*(minor|moderate|major)/i);
          if (severityMatch) {
            const rawSev = severityMatch[1].toLowerCase();
            parsedRecord.claim_type = rawSev.charAt(0).toUpperCase() + rawSev.slice(1);
          }
        }

        // Apply defaults if fields are missing/corrupted
        const driver_age = Number(parsedRecord.driver_age) || 30;
        const vehicle_age = Number(parsedRecord.vehicle_age) || 3;
        const vehicle_type = (parsedRecord.vehicle_type || "Sedan") as any;
        const previous_claims = Number(parsedRecord.previous_claims) || 0;
        const annual_mileage = Number(parsedRecord.annual_mileage) || 12000;
        const estimated_repair_cost = Number(parsedRecord.estimated_repair_cost) || 20000;
        const claim_type = (parsedRecord.claim_type || "Moderate") as any;

        // Calculate risk, premium, reserves
        const risk = calculateRiskScoreTS(driver_age, vehicle_age, previous_claims, annual_mileage);
        const premium = calculatePremiumTS(driver_age, vehicle_age, previous_claims, vehicle_type);
        const reserve = calculateReserveTS(claim_type, estimated_repair_cost);

        const newRecord: HistoricalRecord = {
          driver_age,
          vehicle_age,
          vehicle_type,
          previous_claims,
          annual_mileage,
          estimated_repair_cost,
          claim_type,
          risk_score: risk.totalScore,
          risk_category: risk.category,
          calculated_premium: premium.finalPremium,
          claim_reserve: reserve.reserveAmount
        };

        setPortfolioRecords(prev => [newRecord, ...prev]);
        setSelectedHistoricalIndex(0);
        setUploadSuccess(`Case brief '${file.name}' parsed successfully! Added as Case File ACT-00${portfolioRecords.length + 1}.`);
      } catch (err) {
        setUploadError("Could not parse file. Please upload a valid JSON or text case report.");
      }
    };
    reader.onerror = () => {
      setUploadError("Error reading file.");
    };
    reader.readAsText(file);
  };

  // Simulate file uploading for easy workspace interaction without disk access
  const loadSimulatedFile = (type: "json" | "txt") => {
    setUploadError(null);
    setUploadSuccess(null);
    
    let mockFile: { name: string; content: string };
    if (type === "json") {
      mockFile = {
        name: "high_risk_luxury_case.json",
        content: JSON.stringify({
          driver_age: 21,
          vehicle_age: 2,
          vehicle_type: "Luxury",
          previous_claims: 3,
          annual_mileage: 22000,
          estimated_repair_cost: 65000,
          claim_type: "Major"
        }, null, 2)
      };
    } else {
      mockFile = {
        name: "suv_safety_audit.txt",
        content: `
========================================
ACTUARIAL CASE BRIEF: SECURE VEHICLE AUDIT
========================================
Driver Age: 54
Vehicle Age: 4
Vehicle Type: SUV
Annual Mileage: 9500 KM
Previous Claims: 0
Estimated Repair Cost: 18000 INR
Claim Severity: Minor
========================================
        `.trim()
      };
    }
    
    const blob = new Blob([mockFile.content], { type: "text/plain" });
    const file = new File([blob], mockFile.name, { type: type === "json" ? "application/json" : "text/plain" });
    handleFileUpload(file);
  };

  // Python files for the Code Hub
  const PYTHON_FILES_CONTENT: Record<string, { desc: string; code: string }> = {
    "risk_scoring.py": {
      desc: "Actuarial risk scoring algorithm based on age, mileage, depreciation years, and historical loss cycles.",
      code: `# risk_scoring.py

def calculate_risk_score(driver_age: int, vehicle_age: int, previous_claims: int, annual_mileage: int) -> dict:
    """
    Calculates the risk score and risk category for motor insurance.
    
    Rules:
    - Driver Age: Below 25 = 30 pts, 25 to 60 = 10 pts, Above 60 = 20 pts
    - Vehicle Age: Less than 5 years = 5 pts, More than 5 years = 15 pts
    - Previous Claims: 0 = 0 pts, 1-2 = 15 pts, 3+ = 30 pts
    - Mileage: Above 20,000 km = 15 pts, otherwise = 5 pts
    """
    points = {}
    
    # Driver Age Scoring
    if driver_age < 25:
        driver_pts = 30
    elif 25 <= driver_age <= 60:
        driver_pts = 10
    else:
        driver_pts = 20
    points['driver_age'] = driver_pts
    
    # Vehicle Age Scoring
    if vehicle_age < 5:
        vehicle_pts = 5
    else:
        vehicle_pts = 15
    points['vehicle_age'] = vehicle_pts
    
    # Previous Claims Scoring
    if previous_claims == 0:
        claims_pts = 0
    elif 1 <= previous_claims <= 2:
        claims_pts = 15
    else:
        claims_pts = 30
    points['previous_claims'] = claims_pts
    
    # Mileage Scoring
    if annual_mileage > 20000:
        mileage_pts = 15
    else:
        mileage_pts = 5
    points['annual_mileage'] = mileage_pts
    
    total_score = sum(points.values())
    
    # Risk Category
    if total_score <= 30:
        category = "Low Risk"
        color = "green"
    elif total_score <= 60:
        category = "Medium Risk"
        color = "orange"
    else:
        category = "High Risk"
        color = "red"
        
    return {
        "total_score": total_score,
        "category": category,
        "color": color,
        "breakdown": points
    }`
    },
    "pricing.py": {
      desc: "Premium rate structure model that loads risk factors by fixed percentages on top of base actuarial rates.",
      code: `# pricing.py

def calculate_premium(driver_age: int, vehicle_age: int, previous_claims: int, vehicle_type: str) -> dict:
    """
    Calculates motor insurance premium based on risk factors.
    
    Base Premium: ₹5,000
    Adjustments:
    - Driver age below 25: +20%
    - Vehicle age above 5 years: +10%
    - 1-2 previous claims: +15%
    - 3+ previous claims: +25%
    - Luxury vehicle type: +20%
    """
    base_premium = 5000.0
    adjustments = []
    
    # 1. Driver Age Adjustment
    if driver_age < 25:
        adj_pct = 0.20
        adj_amt = base_premium * adj_pct
        adjustments.append({
            "factor": "Driver age below 25",
            "percentage": "+20%",
            "amount": adj_amt
        })
    
    # 2. Vehicle Age Adjustment
    if vehicle_age > 5:
        adj_pct = 0.10
        adj_amt = base_premium * adj_pct
        adjustments.append({
            "factor": "Vehicle age above 5 years",
            "percentage": "+10%",
            "amount": adj_amt
        })
        
    # 3. Claim History Adjustment
    if 1 <= previous_claims <= 2:
        adj_pct = 0.15
        adj_amt = base_premium * adj_pct
        adjustments.append({
            "factor": "1-2 previous claims",
            "percentage": "+15%",
            "amount": adj_amt
        })
    elif previous_claims >= 3:
        adj_pct = 0.25
        adj_amt = base_premium * adj_pct
        adjustments.append({
            "factor": "3+ previous claims",
            "percentage": "+25%",
            "amount": adj_amt
        })
        
    # 4. Luxury Vehicle Adjustment
    if vehicle_type.lower() == "luxury":
        adj_pct = 0.20
        adj_amt = base_premium * adj_pct
        adjustments.append({
            "factor": "Luxury vehicle premium loading",
            "percentage": "+20%",
            "amount": adj_amt
        })
        
    total_adjustments = sum(adj['amount'] for adj in adjustments)
    final_premium = base_premium + total_adjustments
    
    return {
        "base_premium": base_premium,
        "adjustments": adjustments,
        "total_adjustments": total_adjustments,
        "final_premium": final_premium
    }`
    },
    "reserving.py": {
      desc: "Outstanding claims reserve algorithms checking repair estimates against regulatory baseline thresholds.",
      code: `# reserving.py

def calculate_reserve(claim_type: str, estimated_repair_cost: float) -> dict:
    """
    Estimates outstanding claim reserves based on claim type and repair cost.
    
    Rules:
    - Minor: max(repair_cost, ₹15,000)
    - Moderate: max(repair_cost, ₹40,000)
    - Major: max(repair_cost, ₹75,000)
    """
    claim_type_lower = claim_type.lower()
    
    if "minor" in claim_type_lower:
        min_reserve = 15000.0
        severity_label = "Minor Claim"
    elif "moderate" in claim_type_lower:
        min_reserve = 40000.0
        severity_label = "Moderate Claim"
    elif "major" in claim_type_lower:
        min_reserve = 75000.0
        severity_label = "Major Claim"
    else:
        min_reserve = 15000.0
        severity_label = "General Claim"
        
    reserve_amount = max(estimated_repair_cost, min_reserve)
    
    if estimated_repair_cost >= min_reserve:
        rationale = (
            f"The outstanding claim reserve is set to ₹{reserve_amount:,.2f} because the estimated "
            f"repair cost (₹{estimated_repair_cost:,.2f}) exceeds the minimum regulatory baseline "
            f"reserve of ₹{min_reserve:,.2f} specified for a {severity_label}."
        )
    else:
        rationale = (
            f"The outstanding claim reserve is set to the regulatory minimum baseline of ₹{min_reserve:,.2f} "
            f"for a {severity_label}, as the reported estimated repair cost of ₹{estimated_repair_cost:,.2f} "
            f"falls below this threshold to protect against tail risk and potential scope increase."
        )
        
    return {
        "claim_type": claim_type,
        "estimated_repair_cost": estimated_repair_cost,
        "minimum_reserve_threshold": min_reserve,
        "reserve_amount": reserve_amount,
        "rationale": rationale
    }`
    },
    "report_generator.py": {
      desc: "Automated ReportLab typesetting engine designed to compile assessments into a clean, formatted professional PDF report.",
      code: `# report_generator.py
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import io

def generate_pdf_report(customer_info: dict, risk_info: dict, premium_info: dict, reserve_info: dict, explanation: str) -> bytes:
    """
    Generates a professional motor insurance assessment PDF report.
    Returns the PDF as a byte stream.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle', parent=styles['Heading1'], fontSize=22, leading=26, textColor=colors.HexColor('#1E3A8A'), spaceAfter=15
    )
    section_heading = ParagraphStyle(
        'SecHeading', parent=styles['Heading2'], fontSize=14, leading=18, textColor=colors.HexColor('#0F172A'), spaceBefore=12, spaceAfter=6
    )
    body_style = ParagraphStyle(
        'DocBody', parent=styles['Normal'], fontSize=10, leading=14, textColor=colors.HexColor('#334155'), spaceAfter=8
    )
    bold_body_style = ParagraphStyle('DocBoldBody', parent=body_style, fontName='Helvetica-Bold')
    meta_style = ParagraphStyle('DocMeta', parent=styles['Normal'], fontSize=8, leading=11, textColor=colors.HexColor('#64748B'))

    story = []
    story.append(Paragraph("MOTOR INSURANCE RISK ASSESSMENT & RESERVING REPORT", title_style))
    story.append(Paragraph("Generated by: AI Underwriting Agent Workstation", meta_style))
    story.append(Spacer(1, 15))
    
    # 1. Customer Info
    story.append(Paragraph("1. Customer & Vehicle Information", section_heading))
    info_data = [
        [Paragraph("Driver Age", bold_body_style), Paragraph(f"{customer_info['driver_age']} Years", body_style),
         Paragraph("Vehicle Type", bold_body_style), Paragraph(f"{customer_info['vehicle_type']}", body_style)],
        [Paragraph("Vehicle Age", bold_body_style), Paragraph(f"{customer_info['vehicle_age']} Years", body_style),
         Paragraph("Annual Mileage", bold_body_style), Paragraph(f"{customer_info['annual_mileage']:,} KM", body_style)]
    ]
    t_info = Table(info_data, colWidths=[120, 140, 120, 140])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_info)
    
    # Build dynamic steps... (Refer to actual report_generator.py in folder for full rendering rules)
    doc.build(story)
    return buffer.getvalue()`
    },
    "utils.py": {
      desc: "Data loading and currency formatting routines, including actuarial statistical descriptive metrics for the dashboard.",
      code: `# utils.py
import pandas as pd
import os

def load_dataset() -> pd.DataFrame:
    csv_path = "motor_insurance_dataset.csv"
    try:
        return pd.read_csv(csv_path)
    except Exception:
        # Create dummy dataframe fallback...
        pass`
    },
    "app.py": {
      desc: "Streamlit UI application routing inputs, computing metrics, integrating Gemini, and compiling ReportLab deliverables.",
      code: `# app.py
import streamlit as st
import pandas as pd
import os
from risk_scoring import calculate_risk_score
from pricing import calculate_premium
from reserving import calculate_reserve
from report_generator import generate_pdf_report

st.set_page_config(page_title="Motor Insurance Pricing & Reserving Agent", layout="wide")
st.title("🚗 Motor Insurance Pricing & Reserving Agent")

# Collect User Inputs...`
    },
    "requirements.txt": {
      desc: "Python virtual environment package listings.",
      code: `streamlit>=1.35.0
pandas>=2.0.0
numpy>=1.24.0
reportlab>=4.1.0
google-genai>=0.1.0`
    },
    "motor_insurance_dataset.csv": {
      desc: "Historical underwriting data containing 15 client profiles for descriptive analytics.",
      code: `driver_age,vehicle_age,vehicle_type,previous_claims,annual_mileage,estimated_repair_cost,claim_type,risk_score,risk_category,calculated_premium,claim_reserve
22,3,Sedan,0,12000,12000,Minor,40,Medium Risk,6000,15000
45,2,SUV,1,15000,32000,Moderate,20,Low Risk,5750,40000
65,8,Luxury,3,18000,85000,Major,70,High Risk,8250,85000
31,6,Hatchback,0,8000,8000,Minor,20,Low Risk,5500,15000
19,1,Sedan,2,22000,45000,Moderate,80,High Risk,8000,45000`
    }
  };

  const handleCopyCode = (filename: string, codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleDownloadFile = (filename: string, codeText: string) => {
    const blob = new Blob([codeText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Aggregated calculations for the dashboard charts
  const riskDistribution = [
    { name: "Low Risk", value: portfolioRecords.filter(d => d.risk_category === "Low Risk").length },
    { name: "Medium Risk", value: portfolioRecords.filter(d => d.risk_category === "Medium Risk").length },
    { name: "High Risk", value: portfolioRecords.filter(d => d.risk_category === "High Risk").length },
  ];

  const claimTypeDistribution = [
    { name: "Minor", value: portfolioRecords.filter(d => d.claim_type === "Minor").length },
    { name: "Moderate", value: portfolioRecords.filter(d => d.claim_type === "Moderate").length },
    { name: "Major", value: portfolioRecords.filter(d => d.claim_type === "Major").length },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col antialiased">
      {/* Header Banner */}
      <header className="bg-white border-b border-slate-200 py-5 px-6 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-sm shadow-blue-200" />
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900">
                Actuarial Pricing & Reserving Workstation
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Actuarial Risk Modeling • Secure Full-Stack Workspace • Powered by Gemini
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 w-full md:w-auto">
          <button 
            onClick={() => setActiveTab("pricing")}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "pricing" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/40" 
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            <Coins size={15} />
            Premium Pricing
          </button>
          <button 
            onClick={() => setActiveTab("reserving")}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "reserving" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/40" 
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            <FileText size={15} />
            Claims Reserving
          </button>
          <button 
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "analytics" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/40" 
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            <Activity size={15} />
            Portfolio Analytics
          </button>
          <button 
            onClick={() => setActiveTab("code")}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "code" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/40" 
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            <Code size={15} />
            Python Code Hub
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Premium Pricing Workspace */}
        {activeTab === "pricing" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Sidebar: Intake Controls */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Premium Pricing Intake</h2>
              </div>
              
              <div className="space-y-5">
                {/* Driver Age Manual Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label htmlFor="driver-age-input" className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Driver Age (Years)</label>
                    <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded">{driverAge} Years</span>
                  </div>
                  <input 
                    id="driver-age-input"
                    type="number" 
                    min="18" 
                    max="90" 
                    value={driverAge || ""} 
                    onChange={(e) => setDriverAge(parseInt(e.target.value) || 0)}
                    onBlur={() => {
                      if (driverAge < 18) setDriverAge(18);
                      if (driverAge > 90) setDriverAge(90);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>Young (&lt;25) = 30 pts</span>
                    <span>Mature (&gt;60) = 20 pts</span>
                  </div>
                </div>

                {/* Vehicle Age Manual Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label htmlFor="vehicle-age-input" className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Vehicle Age (Years)</label>
                    <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded">{vehicleAge} Years</span>
                  </div>
                  <input 
                    id="vehicle-age-input"
                    type="number" 
                    min="0" 
                    max="20" 
                    value={vehicleAge || ""} 
                    onChange={(e) => setVehicleAge(parseInt(e.target.value) || 0)}
                    onBlur={() => {
                      if (vehicleAge < 0) setVehicleAge(0);
                      if (vehicleAge > 20) setVehicleAge(20);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>New (&lt;5 yrs) = 5 pts</span>
                    <span>Depreciated (&ge;5) = 15 pts</span>
                  </div>
                </div>

                {/* Vehicle Type Select */}
                <div className="space-y-1.5">
                  <label htmlFor="vehicle-type-select" className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Vehicle Segment</label>
                  <select 
                    id="vehicle-type-select"
                    value={vehicleType} 
                    onChange={(e) => setVehicleType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all"
                  >
                    <option value="Sedan">Sedan (Baseline Premium)</option>
                    <option value="Hatchback">Hatchback (Baseline Premium)</option>
                    <option value="SUV">SUV (Baseline Premium)</option>
                    <option value="Luxury">Luxury (+20% Premium Loader)</option>
                  </select>
                </div>

                {/* Prior Claims Count Manual Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label htmlFor="prior-claims-input" className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Previous Claims</label>
                    <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded">{previousClaims} Claims</span>
                  </div>
                  <input 
                    id="prior-claims-input"
                    type="number" 
                    min="0" 
                    max="10" 
                    value={previousClaims || ""} 
                    onChange={(e) => setPreviousClaims(parseInt(e.target.value) || 0)}
                    onBlur={() => {
                      if (previousClaims < 0) setPreviousClaims(0);
                      if (previousClaims > 10) setPreviousClaims(10);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>0 claims = 0 pts</span>
                    <span>1-2 claims = 15 pts (+15%)</span>
                  </div>
                </div>

                {/* Annual Mileage Manual Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label htmlFor="annual-mileage-input" className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Annual Mileage</label>
                    <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded">{annualMileage.toLocaleString()} KM</span>
                  </div>
                  <input 
                    id="annual-mileage-input"
                    type="number" 
                    min="2000" 
                    max="50000" 
                    step="1000"
                    value={annualMileage || ""} 
                    onChange={(e) => setAnnualMileage(parseInt(e.target.value) || 0)}
                    onBlur={() => {
                      if (annualMileage < 2000) setAnnualMileage(2000);
                      if (annualMileage > 50000) setAnnualMileage(50000);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>Standard (&le;20k) = 5 pts</span>
                    <span>High (&gt;20k) = 15 pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assessment Outputs Column */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Metric Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Risk Score Metric Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Risk Score</p>
                  <div className="flex items-baseline space-x-2">
                    <span className={`text-3xl font-bold ${
                      riskResult.color === "green" ? "text-emerald-600" : (riskResult.color === "orange" ? "text-amber-500" : "text-rose-600")
                    }`}>
                      {riskResult.totalScore}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${
                      riskResult.color === "green" ? "text-emerald-700 bg-emerald-50" : (riskResult.color === "orange" ? "text-amber-700 bg-amber-50" : "text-rose-700 bg-rose-50")
                    }`}>
                      {riskResult.category.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-4 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        riskResult.color === "green" ? "bg-emerald-500" : (riskResult.color === "orange" ? "bg-amber-500" : "bg-rose-500")
                      }`}
                      style={{ width: `${(riskResult.totalScore / 90) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Final Premium Metric Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Recommended Premium</p>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-slate-900 font-mono">₹{premiumResult.finalPremium.toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-slate-500 ml-1 font-sans">/ annum</span>
                  </div>
                  <div className={`mt-3 text-[10px] font-bold uppercase tracking-wide ${
                    premiumResult.totalAdjustments > 0 ? "text-amber-600" : "text-emerald-600"
                  }`}>
                    {premiumResult.totalAdjustments > 0 
                      ? `+${Math.round((premiumResult.totalAdjustments / premiumResult.basePremium) * 100)}% Adjusted from Base` 
                      : "Standard Preferred Rate"
                    }
                  </div>
                </div>
              </div>

              {/* Grid: Pricing Breakdown & AI Reasoning */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-0">
                
                {/* Premium Adjustment Log */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 flex flex-col shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Coins size={16} className="text-blue-600" />
                    Premium Adjustment Log
                  </h3>
                  <div className="flex-1 overflow-auto space-y-3">
                    <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                      <span className="text-slate-500">Base Policy Premium</span>
                      <span className="font-semibold text-slate-900">₹{premiumResult.basePremium.toLocaleString("en-IN")}</span>
                    </div>
                    {premiumResult.adjustments.length === 0 ? (
                      <div className="bg-emerald-50/50 text-emerald-700 text-xs p-3 rounded-lg border border-emerald-100 flex items-start gap-1.5 mt-2">
                        <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                        Applicant qualifies for the baseline premium of standard risk profiles with zero loaded surcharges.
                      </div>
                    ) : (
                      premiumResult.adjustments.map((adj, i) => (
                        <div key={i} className="flex justify-between text-sm py-2 border-b border-slate-50">
                          <span className="text-slate-500">{adj.factor} ({adj.percentage})</span>
                          <span className="font-semibold text-rose-500">+₹{adj.amount.toLocaleString("en-IN")}</span>
                        </div>
                      ))
                    )}
                    <div className="flex justify-between text-base pt-3 font-bold border-t border-slate-100">
                      <span className="text-slate-900">Final Premium</span>
                      <span className="text-blue-600 font-mono">₹{premiumResult.finalPremium.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Agent Reasoning Panel */}
                <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col justify-between shadow-sm min-h-[440px] md:min-h-[480px]">
                  <div className="relative z-10 flex flex-col h-full w-full justify-between">
                    <div>
                      {/* Header Controls */}
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                        <div className="flex items-center space-x-2">
                          <Sparkles size={16} className="text-blue-400 animate-pulse" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Pricing Narrative</h3>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setShowApiSettings(!showApiSettings)}
                            className={`p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-all relative ${showApiSettings ? 'bg-white/10 text-white' : ''}`}
                            title="Configure API Key"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            {!customApiKey && (
                              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* API Key Settings Panel */}
                      {showApiSettings && (
                        <div className="mb-4 p-3 bg-slate-800/95 border border-blue-500/20 rounded-xl text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-blue-400">Gemini API Key Settings</span>
                            <button onClick={() => setShowApiSettings(false)} className="text-[10px] text-slate-400 hover:text-white">✕</button>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-normal">
                            Paste your Gemini API Key below. This key is processed securely server-side and is never exposed in client bundles. If empty, the system default key is utilized.
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="password"
                              placeholder="AI Studio API Key (AIzaSy...)"
                              value={customApiKey}
                              onChange={(e) => handleUpdateApiKey(e.target.value)}
                              className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 flex-1 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500"
                            />
                            {customApiKey && (
                              <button
                                onClick={() => handleUpdateApiKey("")}
                                className="text-[10px] bg-slate-700 hover:bg-rose-900 text-slate-200 hover:text-white px-2.5 py-1 rounded transition-all"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Pricing Risk Analysis</span>
                        <div className="flex items-center gap-1.5">
                          {pricingExplanationType === "rules" ? (
                            <span className="text-[8px] bg-white/5 text-slate-400 font-mono px-2 py-0.5 rounded-full">Rules-Based</span>
                          ) : (
                            <span className="text-[8px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles size={8} /> AI Active
                            </span>
                          )}
                          <button
                            onClick={() => handleRequestAIExplanation("pricing")}
                            disabled={pricingIsGenerating}
                            className="text-[9px] bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold px-2 py-0.5 rounded transition-all"
                          >
                            {pricingIsGenerating ? "Drafting..." : "🔄 Re-draft with AI"}
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 leading-relaxed space-y-2 mb-4 overflow-y-auto max-h-[180px] pr-1">
                        {pricingExplanation.split("\n\n").map((para, idx) => (
                          <p key={idx}>{para}</p>
                        ))}
                      </div>

                      <div className="p-3 bg-slate-800/80 rounded-xl border border-white/5 text-[11px] text-slate-300 leading-relaxed">
                        <span className="font-bold text-blue-400">Risk Tier:</span> {riskResult.category} profile with base factor ₹{premiumResult.basePremium.toLocaleString("en-IN")}.
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                      <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-100 text-slate-900 font-bold px-3 py-1.5 rounded-lg transition-all shadow-md"
                      >
                        <Download size={13} />
                        Download Actuarial PDF
                      </button>
                    </div>
                  </div>

                  {/* Decorative blur backdrop */}
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* Claims Reserving Workspace */}
        {activeTab === "reserving" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Sidebar: Intake Controls */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Claims Reserving Intake</h2>
              </div>
              
              <div className="space-y-5">
                {/* Claim Type Severity Select */}
                <div className="space-y-1.5">
                  <label htmlFor="claim-type-select-res" className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Claim Severity Category</label>
                  <select 
                    id="claim-type-select-res"
                    value={claimType} 
                    onChange={(e) => setClaimType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all"
                  >
                    <option value="Minor">Minor (Min. Baseline Reserve: ₹15,000)</option>
                    <option value="Moderate">Moderate (Min. Baseline Reserve: ₹40,000)</option>
                    <option value="Major">Major (Min. Baseline Reserve: ₹75,000)</option>
                  </select>
                </div>

                {/* Estimated Repair Cost Input */}
                <div className="space-y-1.5">
                  <label htmlFor="repair-cost-input-res" className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Estimated Repair Cost (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 text-sm font-medium">₹</span>
                    <input 
                      id="repair-cost-input-res"
                      type="number" 
                      min="0" 
                      value={estimatedRepairCost} 
                      onChange={(e) => setEstimatedRepairCost(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-8 pr-3 text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>

                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1">
                    <AlertTriangle size={13} /> Actuarial Reserving Principle
                  </h4>
                  <p className="text-[11px] text-amber-700 leading-normal">
                    Outstanding loss reserves must represent the maximum of the reported repair estimate and the regulatory baseline threshold for the severity category to mitigate development risk and protect solvent operations.
                  </p>
                </div>
              </div>
            </div>

            {/* Assessment Outputs Column */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Metric Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Baseline Reserve Threshold */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Severity Baseline Reserve</p>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-slate-700 font-mono">
                      ₹{(claimType === "Minor" ? 15000 : claimType === "Moderate" ? 40000 : 75000).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                    Minimum standard for {claimType}
                  </div>
                </div>

                {/* Final Claims Reserve Est Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Allocated Claims Reserve</p>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-amber-700 font-mono">₹{reserveResult.reserveAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="mt-3 text-[10px] text-amber-600 font-bold uppercase tracking-wide">
                    {estimatedRepairCost > (claimType === "Minor" ? 15000 : claimType === "Moderate" ? 40000 : 75000) 
                      ? "Repair Cost Overrides Minimum" 
                      : "Regulatory Minimum Applied"
                    }
                  </div>
                </div>
              </div>

              {/* Grid: Reserving Breakdown & AI Reasoning */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-0">
                
                {/* Reserving Adequacy Log */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 flex flex-col shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-amber-600" />
                    Reserve Allocation Log
                  </h3>
                  <div className="flex-1 overflow-auto space-y-3">
                    <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                      <span className="text-slate-500">Claim Severity Category</span>
                      <span className="font-semibold text-slate-900">{claimType}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                      <span className="text-slate-500">Minimum Baseline Reserve</span>
                      <span className="font-semibold text-slate-900">
                        ₹{(claimType === "Minor" ? 15000 : claimType === "Moderate" ? 40000 : 75000).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                      <span className="text-slate-500">Estimated Repair Cost</span>
                      <span className="font-semibold text-slate-900">₹{estimatedRepairCost.toLocaleString("en-IN")}</span>
                    </div>
                    
                    <div className="flex justify-between text-base pt-3 font-bold border-t border-slate-100">
                      <span className="text-slate-900">Final Claim Reserve</span>
                      <span className="text-amber-700 font-mono">₹{reserveResult.reserveAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Agent Reserving Reasoning Panel */}
                <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col justify-between shadow-sm min-h-[440px] md:min-h-[480px]">
                  <div className="relative z-10 flex flex-col h-full w-full justify-between">
                    <div>
                      {/* Header Controls */}
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                        <div className="flex items-center space-x-2">
                          <Sparkles size={16} className="text-amber-400 animate-pulse" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Reserving Narrative</h3>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setShowApiSettings(!showApiSettings)}
                            className={`p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-all relative ${showApiSettings ? 'bg-white/10 text-white' : ''}`}
                            title="Configure API Key"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            {!customApiKey && (
                              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Reserving Adequacy Analysis</span>
                        <div className="flex items-center gap-1.5">
                          {reservingExplanationType === "rules" ? (
                            <span className="text-[8px] bg-white/5 text-slate-400 font-mono px-2 py-0.5 rounded-full">Rules-Based</span>
                          ) : (
                            <span className="text-[8px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles size={8} /> AI Active
                            </span>
                          )}
                          <button
                            onClick={() => handleRequestAIExplanation("reserving")}
                            disabled={reservingIsGenerating}
                            className="text-[9px] bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold px-2 py-0.5 rounded transition-all"
                          >
                            {reservingIsGenerating ? "Drafting..." : "🔄 Re-draft with AI"}
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 leading-relaxed space-y-2 mb-4 overflow-y-auto max-h-[180px] pr-1">
                        {reservingExplanation.split("\n\n").map((para, idx) => (
                          <p key={idx}>{para}</p>
                        ))}
                      </div>

                      <div className="p-3 bg-slate-800/80 rounded-xl border border-white/5 text-[11px] text-slate-300 leading-relaxed">
                        <span className="font-bold text-amber-400">Methodology Note:</span> {reserveResult.rationale}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                      <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-100 text-slate-900 font-bold px-3 py-1.5 rounded-lg transition-all shadow-md"
                      >
                        <Download size={13} />
                        Download Reserving PDF
                      </button>
                    </div>
                  </div>

                  {/* Decorative blur backdrop */}
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* Portfolio Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Aggregated Underwriting Portfolio Insights
                </h2>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Analyzing key risk indices and premium pricing spreads across the {portfolioRecords.length} policies stored in our actuarial system.
              </p>

              {/* KPI Summaries */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Portfolio Cover Count</span>
                  <span className="text-lg font-bold font-mono text-slate-900 block mt-1">{portfolioRecords.length} Vehicles</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average Risk Rating</span>
                  <span className="text-lg font-bold font-mono text-slate-900 block mt-1">
                    {(portfolioRecords.reduce((acc, curr) => acc + curr.risk_score, 0) / portfolioRecords.length).toFixed(1)} /90
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average Loaded Premium</span>
                  <span className="text-lg font-bold font-mono text-blue-600 block mt-1">
                    ₹{Math.round(portfolioRecords.reduce((acc, curr) => acc + curr.calculated_premium, 0) / portfolioRecords.length).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Claims Reserves Allocated</span>
                  <span className="text-lg font-bold font-mono text-amber-700 block mt-1">
                    ₹{portfolioRecords.reduce((acc, curr) => acc + curr.claim_reserve, 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Actuarial Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Chart 1: Risk score distribution */}
                <div className="border border-slate-100 p-5 rounded-2xl bg-white shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wider">Risk Classification Breakdown</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={riskDistribution}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                        <YAxis fontSize={11} stroke="#64748b" allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]}>
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#f43f5e" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Claim severity count */}
                <div className="border border-slate-100 p-5 rounded-2xl bg-white shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wider">Claim Severity Exposure Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={claimTypeDistribution}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                        <YAxis fontSize={11} stroke="#64748b" allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Scatter vehicle age vs final premium */}
                <div className="border border-slate-100 p-5 rounded-2xl bg-white shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wider">Correlation: Vehicle Age vs Calculated Premium</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="vehicle_age" name="Vehicle Age" unit=" yrs" fontSize={11} stroke="#64748b" />
                        <YAxis type="number" dataKey="calculated_premium" name="Premium" unit=" INR" fontSize={11} stroke="#64748b" />
                        <ZAxis type="category" dataKey="vehicle_type" name="Segment" />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                        <Scatter name="Portfolio Policies" data={portfolioRecords} fill="#2563eb" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 4: Repair cost vs claim reserve */}
                <div className="border border-slate-100 p-5 rounded-2xl bg-white shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wider">Claims Adequacy: Repair Cost vs Reserves Allocated</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="estimated_repair_cost" name="Repair Cost" unit=" INR" fontSize={11} stroke="#64748b" />
                        <YAxis type="number" dataKey="claim_reserve" name="Claim Reserve" unit=" INR" fontSize={11} stroke="#64748b" />
                        <ZAxis type="category" dataKey="claim_type" name="Severity" />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                        <Scatter name="Claims Portfolio" data={portfolioRecords} fill="#d97706" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Actuarial Document Upload & Explorer Card */}
              <div className="mt-8 border-t border-slate-100 pt-8" id="actuarial-document-repository">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="text-blue-600" size={18} />
                  <h3 className="text-base font-bold text-slate-900">
                    Policy & Claims Document Repository
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mb-6">
                  Upload a custom policy, claim JSON, or text report to analyze, preview, and generate its professional certified PDF report.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Selector, Uploader, and List Column */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Drag-and-Drop Upload Area */}
                    <div 
                      className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-200 ${
                        isDragging 
                          ? "border-blue-500 bg-blue-50/40 text-blue-600 scale-[1.01]" 
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const files = e.dataTransfer.files;
                        if (files && files.length > 0) {
                          handleFileUpload(files[0]);
                        }
                      }}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            handleFileUpload(files[0]);
                          }
                        }}
                        accept=".json,.txt,.csv"
                        className="hidden" 
                      />

                      <div className="flex flex-col items-center justify-center space-y-2.5">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600 border border-slate-100">
                          <Upload size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">
                            Drag & drop case brief file here
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Supports JSON or Plain Text files
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all"
                        >
                          Select File From Disk
                        </button>
                      </div>
                    </div>

                    {/* Simulation Presets for Fast Testing */}
                    <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-100/30">
                      <span className="text-[9px] font-bold uppercase text-blue-500 block mb-2 tracking-wider">
                        Quick Simulation Presets
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => loadSimulatedFile("json")}
                          className="text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          Simulate JSON
                        </button>
                        <button
                          onClick={() => loadSimulatedFile("txt")}
                          className="text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Simulate Text
                        </button>
                      </div>
                    </div>

                    {/* Status Alerts */}
                    {(uploadError || uploadSuccess) && (
                      <div className={`p-3 rounded-xl text-[11px] leading-relaxed font-medium border ${
                        uploadError 
                          ? "bg-rose-50 text-rose-600 border-rose-100" 
                          : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      }`}>
                        {uploadError || uploadSuccess}
                      </div>
                    )}

                    {/* Cases List Directory */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          Active Case Files Directory
                        </label>
                        <span className="text-[10px] font-mono text-slate-400">
                          {portfolioRecords.length} loaded
                        </span>
                      </div>
                      
                      <div className="max-h-56 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                        {portfolioRecords.map((record, index) => {
                          const isSelected = selectedHistoricalIndex === index;
                          const caseNum = portfolioRecords.length - index;
                          return (
                            <div
                              key={index}
                              onClick={() => {
                                setSelectedHistoricalIndex(index);
                                setUploadError(null);
                                setUploadSuccess(null);
                              }}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-blue-50/50 border-blue-200 ring-1 ring-blue-200"
                                  : "bg-white hover:bg-slate-50 border-slate-100"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    record.risk_category === "High Risk" 
                                      ? "bg-rose-500" 
                                      : record.risk_category === "Medium Risk" 
                                        ? "bg-amber-500" 
                                        : "bg-emerald-500"
                                  }`} />
                                  <span className="font-bold text-xs text-slate-800 truncate">
                                    {`ACT-00${caseNum}`}
                                  </span>
                                  <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {record.vehicle_type}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                                  <span>{`Age: ${record.driver_age}`}</span>
                                  <span>•</span>
                                  <span>{`Claims: ${record.previous_claims}`}</span>
                                </div>
                              </div>
                              
                              <div className="text-right ml-2 flex items-center gap-2">
                                <div>
                                  <span className="text-xs font-bold font-mono text-slate-700 block">
                                    ₹{record.calculated_premium.toLocaleString("en-IN")}
                                  </span>
                                  <span className="text-[9px] text-slate-400 block font-mono">
                                    Res: ₹{record.claim_reserve.toLocaleString("en-IN")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Document Live Preview Column */}
                  {(() => {
                    const activeRecord = portfolioRecords[selectedHistoricalIndex] || portfolioRecords[0] || {
                      driver_age: 30,
                      vehicle_age: 3,
                      vehicle_type: "Sedan",
                      previous_claims: 0,
                      annual_mileage: 12000,
                      estimated_repair_cost: 20000,
                      claim_type: "Minor",
                      risk_score: 15,
                      risk_category: "Low Risk",
                      calculated_premium: 5000,
                      claim_reserve: 15000,
                    };
                    return (
                      <div className="lg:col-span-7 bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-lg border border-slate-800 min-h-[440px]">
                        <div className="relative z-10 flex flex-col h-full w-full justify-between space-y-4">
                          <div>
                            <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-4">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-400">Archived Document Preview</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">{`ID: ACT-00${portfolioRecords.length - selectedHistoricalIndex}`}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className="space-y-1 bg-white/5 p-2.5 rounded-lg border border-white/5">
                                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Driver Profile</span>
                                <div className="font-medium text-slate-100">{`Age: ${activeRecord.driver_age} Yrs`}</div>
                                <div className="text-[10px] text-slate-400">{`Prior Claims: ${activeRecord.previous_claims}`}</div>
                              </div>

                              <div className="space-y-1 bg-white/5 p-2.5 rounded-lg border border-white/5">
                                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Vehicle Specification</span>
                                <div className="font-medium text-slate-100">{`Segment: ${activeRecord.vehicle_type}`}</div>
                                <div className="text-[10px] text-slate-400">{`Vehicle Age: ${activeRecord.vehicle_age} Yrs`}</div>
                              </div>

                              <div className="space-y-1 bg-white/5 p-2.5 rounded-lg border border-white/5">
                                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Underwritten Risk Rating</span>
                                <div className="font-medium text-emerald-400 font-mono">{`${activeRecord.risk_score} / 90 Pts`}</div>
                                <div className="text-[10px] text-slate-300 font-bold">{activeRecord.risk_category}</div>
                              </div>

                              <div className="space-y-1 bg-white/5 p-2.5 rounded-lg border border-white/5">
                                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Calculated Loaded Premium</span>
                                <div className="font-medium text-blue-400 font-mono">{`₹${activeRecord.calculated_premium.toLocaleString("en-IN")}`}</div>
                                <div className="text-[10px] text-slate-400">Baseline Rate Included</div>
                              </div>
                            </div>

                            <div className="mt-4 p-3 bg-slate-800 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs mb-1">
                                <span className="text-slate-300 uppercase font-bold text-[9px] tracking-wide">Claims Reserve Allocation</span>
                                <span className="text-[10px] text-amber-400 font-mono font-semibold">{`${activeRecord.claim_type} Severity`}</span>
                              </div>
                              <div className="flex justify-between items-baseline text-xs">
                                <span className="text-slate-400">Estimated Repair Cost:</span>
                                <span className="text-slate-200 font-mono">{`₹${activeRecord.estimated_repair_cost.toLocaleString("en-IN")}`}</span>
                              </div>
                              <div className="flex justify-between items-baseline text-xs mt-1 pt-1 border-t border-slate-700/50">
                                <span className="text-slate-300 font-bold">Outstanding Claim Reserve:</span>
                                <span className="text-amber-500 font-mono font-bold">{`₹${activeRecord.claim_reserve.toLocaleString("en-IN")}`}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 flex flex-col md:flex-row justify-between items-center gap-3 border-t border-white/5">
                            <div className="text-[10px] text-slate-400 italic text-center md:text-left">
                              This summary represents a compliant actuarial state retrieved from dynamic secure workstation vaults.
                            </div>
                            <button
                              onClick={() => handleDownloadHistoricalPDF(activeRecord, selectedHistoricalIndex)}
                              className="w-full md:w-auto flex items-center justify-center gap-2 text-xs bg-white text-slate-900 hover:bg-slate-100 font-bold py-2 px-4 rounded-xl transition-all shadow-md shrink-0"
                            >
                              <Download size={13} />
                              Download PDF
                            </button>
                          </div>
                        </div>
                        {/* Decorative blur backdrop */}
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Python Code Hub Tab */}
        {activeTab === "code" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar File Selector */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5 text-sm">
                <Code size={16} className="text-blue-600" />
                Python Applet Workspace
              </h3>
              <p className="text-[11px] text-slate-400 mb-4">
                Verify the architectural purity and modularity of the files built for local execution.
              </p>
              
              <div className="space-y-2">
                {Object.keys(PYTHON_FILES_CONTENT).map((filename) => (
                  <button
                    key={filename}
                    onClick={() => setSelectedFile(filename)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono border transition-all flex flex-col gap-1 ${
                      selectedFile === filename 
                        ? "bg-blue-50/75 border-blue-200 text-blue-700 font-semibold shadow-sm" 
                        : "border-slate-50 hover:bg-slate-50/60 text-slate-600"
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      📄 {filename}
                    </span>
                    <span className="text-[9px] text-slate-400 font-sans line-clamp-1">
                      {PYTHON_FILES_CONTENT[filename].desc}
                    </span>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                <div className="text-xs bg-blue-50/50 border border-blue-100/50 text-blue-900 p-4 rounded-xl flex items-start gap-2 leading-relaxed">
                  <Info size={14} className="shrink-0 text-blue-600 mt-0.5" />
                  <div>
                    <span className="font-bold">ZIP Export Ready:</span>
                    <p className="text-[10px] text-blue-700/90 mt-0.5">
                      All these files exist in your container workspace under <code className="bg-blue-100/60 px-1 rounded">/python_project/</code>. Exporting or downloading this project provides a 100% executable Streamlit application.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Source Code Viewer */}
            <div className="lg:col-span-8 bg-slate-950 rounded-2xl overflow-hidden shadow-sm flex flex-col border border-slate-800">
              <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <span className="text-xs font-mono text-slate-400 ml-2">{selectedFile}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCode(selectedFile, PYTHON_FILES_CONTENT[selectedFile].code)}
                    className="flex items-center gap-1.5 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {copiedFile === selectedFile ? (
                      <>
                        <Check size={12} className="text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        Copy Code
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDownloadFile(selectedFile, PYTHON_FILES_CONTENT[selectedFile].code)}
                    className="flex items-center gap-1.5 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Download size={12} />
                    Download
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-auto max-h-[500px]">
                <pre className="text-xs font-mono text-slate-300 leading-relaxed text-left">
                  <code>{PYTHON_FILES_CONTENT[selectedFile].code}</code>
                </pre>
              </div>
              <div className="bg-slate-900 border-t border-slate-800 p-4">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  <strong>🚀 How to Run Locally:</strong> 1. Install pip packages: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300">pip install -r requirements.txt</code>. 2. Start applet: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300">streamlit run app.py</code>.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Separate Interactive Floating AI Underwriting Agent Chatbot */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isChatOpen ? (
          /* Expanded Chat Panel */
          <div className="w-[380px] max-w-[calc(100vw-2rem)] h-[540px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative text-white animate-in fade-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="bg-slate-950 px-4 py-3.5 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="absolute -inset-0.5 rounded-full bg-emerald-500/30 animate-ping" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                    <Sparkles size={12} className="text-blue-400" />
                    {activeAgent === "pricing" ? "Pricing Specialist" : "Reserving Actuary"}
                  </h3>
                  <p className="text-[8px] text-slate-400 font-mono uppercase tracking-wider">
                    {activeAgent === "pricing" ? "Risk & Premium Modeler" : "Claims Liability Analyst"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                {/* Internal settings toggler for API key */}
                <button
                  onClick={() => setShowApiSettings(!showApiSettings)}
                  className={`p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all relative ${showApiSettings ? 'bg-slate-800 text-white' : ''}`}
                  title="Configure API Key"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  {!customApiKey && (
                    <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                  title="Close Chat"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Agent Selector Tab Bar */}
            <div className="flex border-b border-slate-800 bg-slate-950 p-1 gap-1">
              <button
                onClick={() => setActiveAgent("pricing")}
                className={`flex-1 py-1.5 px-2 text-center text-[10.5px] font-bold rounded-lg transition-all ${
                  activeAgent === "pricing"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                Pricing Agent
              </button>
              <button
                onClick={() => setActiveAgent("reserving")}
                className={`flex-1 py-1.5 px-2 text-center text-[10.5px] font-bold rounded-lg transition-all ${
                  activeAgent === "reserving"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                Reserving Agent
              </button>
            </div>

            {/* Expandable API Settings Drawer */}
            {showApiSettings && (
              <div className="p-3 bg-slate-950/95 border-b border-slate-800 text-xs space-y-2 animate-in slide-in-from-top-4 duration-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-400">Gemini API Key Settings</span>
                  <button onClick={() => setShowApiSettings(false)} className="text-[10px] text-slate-400 hover:text-white">✕</button>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Provide your own Gemini key to enable real-time interactive actuarial underwriting conversations.
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="AI Studio API Key (AIzaSy...)"
                    value={customApiKey}
                    onChange={(e) => handleUpdateApiKey(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 flex-1 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                  {customApiKey && (
                    <button
                      onClick={() => handleUpdateApiKey("")}
                      className="text-[10px] bg-slate-800 hover:bg-rose-900 text-slate-200 hover:text-white px-2 rounded transition-all"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {customApiKey ? (
                  <div className="text-[9px] text-emerald-400 flex items-center gap-1">
                    <Check size={10} /> Custom key loaded successfully
                  </div>
                ) : (
                  <div className="text-[9px] text-amber-400 flex items-center gap-1">
                    <Info size={10} /> Using server default / placeholder rules
                  </div>
                )}
              </div>
            )}

            {/* Messages Viewport */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 text-xs">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <span className="text-[9px] text-slate-500 font-mono mb-1 uppercase tracking-wider">
                    {msg.role === "user" 
                      ? "Lead Actuary" 
                      : (activeAgent === "pricing" ? "Pricing Specialist" : "Reserving Actuary")}
                  </span>
                  <div className={`px-3.5 py-2.5 rounded-2xl max-w-[88%] leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-slate-950 text-slate-200 rounded-tl-none border border-slate-800"
                  }`}>
                    {/* Bold Markdown Support */}
                    {msg.content.split("\n").map((line, lIdx) => (
                      <p key={lIdx} className="mb-1.5 last:mb-0">
                        {line.includes("**") ? (
                          line.split("**").map((chunk, cIdx) => 
                            cIdx % 2 === 1 ? <strong key={cIdx} className="text-white font-bold">{chunk}</strong> : chunk
                          )
                        ) : line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
              
              {isSendingChatMessage && (
                <div className="flex items-center space-x-2 text-slate-400 italic text-[11px] animate-pulse">
                  <Sparkles size={12} className="text-blue-400 animate-spin" />
                  <span>
                    {activeAgent === "pricing" 
                      ? "Pricing Specialist is analyzing premium loads..." 
                      : "Reserving Actuary is modeling outstanding liabilities..."}
                  </span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Footer Area */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col gap-2">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder={
                    customApiKey 
                      ? (activeAgent === "pricing" 
                          ? "Ask about base premiums, risk rating, mileage surcharges..." 
                          : "Ask about outstanding reserves, liability limits, claim types...")
                      : "🔒 Enter API key above to unlock interactive AI chat"
                  }
                  disabled={!customApiKey || isSendingChatMessage}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 flex-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!customApiKey || !chatInput.trim() || isSendingChatMessage}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold px-3.5 py-2 rounded-xl transition-all text-xs"
                >
                  Send
                </button>
              </form>

              {!customApiKey && (
                <div className="text-[9px] text-amber-400 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 flex items-start gap-1.5">
                  <Info size={11} className="shrink-0 mt-0.5" />
                  <span>
                    To unlock interactive conversational modeling with this certified motor portfolio copilot, click the gear icon above and enter your Gemini API Key.
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Collapsed Chat Bubble */
          <button
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-blue-500/10 active:scale-95 transition-all duration-300 cursor-pointer group border border-blue-500/30 relative"
            title="Open Actuarial Copilot Chat"
          >
            {/* Pulsing visual halo */}
            <div className="absolute -inset-1 rounded-full bg-blue-500/20 blur opacity-40 group-hover:opacity-75 animate-pulse" />
            <MessageSquare size={22} className="text-white relative z-10 group-hover:scale-110 transition-transform duration-200" />
            
            {/* Status Indicator */}
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-slate-900 flex items-center justify-center text-[8px] text-white"></span>
            </span>

            {/* API Key missing notification bar */}
            {!customApiKey && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 border border-slate-900"></span>
              </span>
            )}
          </button>
        )}
      </div>

      {/* Corporate humble footer */}
      <footer className="mt-auto border-t border-slate-200/60 bg-white py-4 text-center text-slate-400 text-[10px] font-mono">
        Actuarial Division • Certified Risk Decision Support System v2.5.0
      </footer>
    </div>
  );
}
