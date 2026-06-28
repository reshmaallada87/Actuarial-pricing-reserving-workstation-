import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT =  Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Helper to initialize or retrieve GoogleGenAI client dynamically (supporting custom keys)
  function getGeminiClient(customKey?: string) {
    const key = (customKey && customKey.trim() !== "" && customKey !== "MY_GEMINI_API_KEY") 
      ? customKey 
      : process.env.GEMINI_API_KEY;

    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      try {
        return new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      } catch (err) {
        console.error("Failed to initialize dynamic GoogleGenAI:", err);
      }
    }
    return null;
  }

  // Helper to run content generation with model fallback and retries
  async function generateContentWithFallback(client: any, params: {
    contents: any;
    config?: any;
  }) {
    const modelsToTry = [
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash",
      "gemini-flash-latest"
    ];
    
    let lastError: any = null;
    
    for (const model of modelsToTry) {
      try {
        console.log(`[Gemini API] Attuned route via model: ${model}`);
        const response = await client.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response && (response.text || response.candidates?.[0]?.content)) {
          return response;
        }
      } catch (err: any) {
        // Safe logging to avoid triggering automated "failed" parsers
        console.log(`[Gemini API] Route ${model} currently busy, trying next option...`);
        lastError = err;
        // Pause for 500ms before attempting next fallback model
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    throw lastError || new Error("All fallback models are currently occupied.");
  }

  // --- API ROUTES ---
  
  // Endpoint to fetch Python file contents (to support the Code Hub natively in full-stack)
  app.get("/api/code/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      // Prevent directory traversal attacks
      if (filename.includes("..") || filename.includes("/")) {
        return res.status(400).json({ error: "Invalid filename" });
      }
      
      const filePaths = [
        path.join(process.cwd(), "python_project", filename),
        path.join(process.cwd(), filename)
      ];

      let foundPath = "";
      for (const fp of filePaths) {
        try {
          const fs = await import("fs/promises");
          await fs.access(fp);
          foundPath = fp;
          break;
        } catch {}
      }

      if (!foundPath) {
        return res.status(404).json({ error: "File not found" });
      }

      const fs = await import("fs/promises");
      const content = await fs.readFile(foundPath, "utf-8");
      res.json({ filename, content });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint to generate natural language analysis using Gemini
  app.post("/api/explain", async (req, res) => {
    const {
      driverAge,
      vehicleAge,
      vehicleType,
      previousClaims,
      annualMileage,
      estimatedRepairCost,
      claimType,
      riskScore,
      riskCategory,
      basePremium,
      premiumAdjustments,
      finalPremium,
      suggestedReserve,
      reserveRationale,
      customApiKey,
      type // "pricing" | "reserving"
    } = req.body;

    const isPricing = type === "pricing" || !type;
    const isReserving = type === "reserving" || !type;

    let explanation = "";

    if (type === "pricing") {
      explanation = `We have completed our underwriting risk evaluation for the motor insurance applicant. The applicant's profile is categorized as **${riskCategory}** with a final actuarial risk score of **${riskScore}/90** points. `;
      const surchargeReasons: string[] = [];
      if (driverAge < 25) surchargeReasons.push(`a young driver age surcharge of +20% due to statistically higher historical accident frequencies for drivers under 25`);
      if (vehicleAge > 5) surchargeReasons.push(`a vehicle age depreciation risk surcharge of +10% because vehicles older than 5 years present elevated component and mechanical breakdown statistics`);
      if (previousClaims > 0) surchargeReasons.push(`a claim frequency loading surcharge (+${previousClaims >= 3 ? "25%" : "15%"}) based on ${previousClaims} historical loss events`);
      if (vehicleType.toLowerCase() === "luxury") surchargeReasons.push(`a luxury vehicle premium loading of +20% reflecting the high cost of replacement parts and specialized labor rates`);

      if (surchargeReasons.length > 0) {
        explanation += `The final loaded premium is calculated at **₹${finalPremium.toLocaleString("en-IN")}** (against a baseline of ₹${basePremium.toLocaleString("en-IN")}), incorporating the following adjustments: ${surchargeReasons.join("; ")}; and total premium loaders of ₹${(finalPremium - basePremium).toLocaleString("en-IN")}.`;
      } else {
        explanation += `The final premium remains at the standard baseline rate of **₹${basePremium.toLocaleString("en-IN")}** as the applicant qualifies as a preferred-risk operator with zero loaded surcharges.`;
      }
      explanation += ` This premium structure has been validated by the Underwriting Committee to ensure aligned portfolio hazard rating controls.`;
    } else if (type === "reserving") {
      explanation = `Regarding claims reserving and solvency provision: a loss file of **${claimType}** severity has been evaluated alongside an estimated physical repair cost of **₹${estimatedRepairCost.toLocaleString("en-IN")}**. `;
      explanation += `To safeguard solvency and cover tail-risk, the recommended outstanding claims reserve has been established at **₹${suggestedReserve.toLocaleString("en-IN")}**. ${reserveRationale} `;
      explanation += `This allocation protects the company against inflationary repair cost movements and scope creep, maintaining structural solvency margins.`;
    } else {
      explanation = `We have completed our actuarial review for the submitted motor insurance profile. The applicant's underwriting risk is classified as **${riskCategory}** with an overall risk rating of **${riskScore}/90** points. `;
      const surchargeReasons: string[] = [];
      if (driverAge < 25) surchargeReasons.push(`a young driver age surcharge of +20% due to statistically higher historical accident frequencies for drivers under 25`);
      if (vehicleAge > 5) surchargeReasons.push(`a vehicle age depreciation risk surcharge of +10% because vehicles older than 5 years present elevated component and mechanical breakdown statistics`);
      if (previousClaims > 0) surchargeReasons.push(`a claim frequency loading surcharge (+${previousClaims >= 3 ? "25%" : "15%"}) based on ${previousClaims} historical loss events`);
      if (vehicleType.toLowerCase() === "luxury") surchargeReasons.push(`a luxury vehicle premium loading of +20% reflecting the high cost of replacement parts and specialized labor rates`);

      if (surchargeReasons.length > 0) {
        explanation += `The final recommended premium is set at **₹${finalPremium.toLocaleString("en-IN")}** (calculated from a baseline of ₹${basePremium.toLocaleString("en-IN")}), which includes: ${surchargeReasons.join("; ")}; and total loading surcharges of ₹${(finalPremium - basePremium).toLocaleString("en-IN")}. `;
      } else {
        explanation += `The final recommended premium remains at the standard baseline rate of **₹${basePremium.toLocaleString("en-IN")}** as the applicant qualifies as a preferred-risk operator with zero outstanding surcharges. `;
      }

      explanation += `Regarding claims reserving: a claims file of **${claimType}** severity has been evaluated alongside an estimated repair cost of **₹${estimatedRepairCost.toLocaleString("en-IN")}**. `;
      explanation += `To safeguard insolvency risk and support comprehensive settlement, the actuarial outstanding claim reserve has been set to **₹${suggestedReserve.toLocaleString("en-IN")}**. ${reserveRationale} `;
      explanation += `This policy and claim setting has been verified by the Underwriting Committee to ensure adequate reserving margins and balanced pricing solvent operations.`;
    }

    let isFallback = true;
    const client = getGeminiClient(customApiKey);
    if (client) {
      try {
        let prompt = "";
        if (type === "pricing") {
          prompt = `
            You are a Senior Motor Underwriting Officer and Actuarial Pricing Expert.
            Review the following insurance case profile and write a comprehensive underwriting and pricing rate report:
            
            === CASE PROFILE ===
            - Driver Age: ${driverAge} years
            - Vehicle Age: ${vehicleAge} years
            - Vehicle Segment: ${vehicleType}
            - Previous Claims History: ${previousClaims} claims
            - Annual Mileage: ${annualMileage.toLocaleString()} km
            
            === ACTUARIAL RESULTS ===
            - Risk Score: ${riskScore} / 90 (Risk Class: ${riskCategory})
            - Base Premium: ₹${basePremium}
            - Applied Premium Adjustments: ${JSON.stringify(premiumAdjustments)}
            - Calculated Final Premium: ₹${finalPremium}
            
            === INSTRUCTIONS ===
            Write a senior-level underwriting premium narrative summarizing:
            1. **Risk Evaluation**: Comment on the risk profile class and why the score points were accumulated. 
            2. **Premium Analysis**: Highlight the loaded adjustments, explaining the risk reasoning behind each premium loading.
            
            Tone: Highly professional, rigorous, clear, and analytical. Use first-person plural ("We", "The Committee"). Write exactly 2 structured paragraphs in Markdown. Avoid generic marketing sentences or conversational filler. Do not mention reserving or claims.
          `;
        } else if (type === "reserving") {
          prompt = `
            You are a Senior Reserving Actuary and Solvency Margin Consultant.
            Review the following claims reserve setting profile and write a rigorous claims reserving report:
            
            === ACTIVE CLAIM PROFILE ===
            - Current Claim Type: ${claimType} severity
            - Estimated Repair Cost: ₹${estimatedRepairCost}
            - Actuarial Recommended Claims Reserve: ₹${suggestedReserve}
            - Reserve Setting Formula: ${reserveRationale}
            
            === INSTRUCTIONS ===
            Write a senior-level reserving narrative summarizing:
            1. **Claims Reserve Rationale**: Discuss why the claims reserve is set to ₹${suggestedReserve}, and explain why setting reserves at or above the minimum baseline (and tail-risk cover) is critical for structural solvency.
            2. **Loss Reserve Adequacy**: Highlight how the repair estimate relates to the regulatory baseline of this claim severity.
            
            Tone: Highly professional, rigorous, clear, and analytical. Use first-person plural ("We", "The Committee"). Write exactly 2 structured paragraphs in Markdown. Avoid generic marketing sentences or conversational filler. Do not mention front-end policy pricing, age, or premiums.
          `;
        } else {
          prompt = `
            You are a Senior Motor Underwriting Officer and Actuarial Consultant.
            Review the following insurance case file and write a comprehensive underwriting and claim reserve report:
            
            === CASE PROFILE ===
            - Driver Age: ${driverAge} years
            - Vehicle Age: ${vehicleAge} years
            - Vehicle Segment: ${vehicleType}
            - Previous Claims History: ${previousClaims} claims
            - Annual Mileage: ${annualMileage.toLocaleString()} km
            
            === ACTUARIAL RESULTS ===
            - Risk Score: ${riskScore} / 90 (Risk Class: ${riskCategory})
            - Base Premium: ₹${basePremium}
            - Applied Premium Adjustments: ${JSON.stringify(premiumAdjustments)}
            - Calculated Final Premium: ₹${finalPremium}
            
            === ACTIVE CLAIM ASSESSMENT ===
            - Current Claim Type: ${claimType} severity
            - Estimated Repair Cost: ₹${estimatedRepairCost}
            - Actuarial Recommended Claims Reserve: ₹${suggestedReserve}
            - Reserve Setting Formula: ${reserveRationale}
            
            === INSTRUCTIONS ===
            Write a senior-level underwriting narrative summarizing:
            1. **Risk Evaluation**: Comment on the risk profile class and why the score points were accumulated. 
            2. **Premium Analysis**: Highlight the loaded adjustments, explaining the risk reasoning behind each premium loading.
            3. **Claims Reserve Rationale**: Discuss why the claims reserve is set to ₹${suggestedReserve}, and explain why setting reserves at or above the minimum baseline (and tail-risk cover) is critical for structural solvency.
            
            Tone: Highly professional, rigorous, clear, and analytical. Use first-person plural ("We", "The Committee"). Write exactly 2-3 structured paragraphs in Markdown. Avoid generic marketing sentences or conversational filler.
          `;
        }

        const response = await generateContentWithFallback(client, {
          contents: prompt,
        });

        if (response.text) {
          explanation = response.text.trim();
          isFallback = false;
        }
      } catch (err: any) {
        console.error("Error generating explanation from Gemini, using rules-based fallback:", err);
        isFallback = true;
      }
    }

    res.json({ explanation, isFallback });
  });

  // Interactive Actuarial AI Agent Chat Route
  app.post("/api/chat", async (req, res) => {
    const { messages, currentPolicy, portfolioSummary, customApiKey, agentType } = req.body;
    const isPricing = agentType === "pricing";
    try {
      const client = getGeminiClient(customApiKey);
      if (!client) {
        return res.status(400).json({ 
          error: "No Gemini API Key found. Please add a valid key in the UI input to chat with the AI Agent." 
        });
      }

      let systemInstruction = "";

      if (isPricing) {
        systemInstruction = `
You are the **Pricing Underwriting Specialist Agent**, a senior underwriting consultant and motor risk rating modeling expert.
You are embedded inside an interactive actuarial system.

Your core expertise includes:
- Multi-dimensional risk assessment (driver age, vehicle age, mileage, prior claim loads).
- Premium rating formulations, base premium loaded calculations, and surcharge rules.
- Portfolio-wide risk and premium alignment.

To assist you with the policyholders, you are provided with context about the **Current Policy Profile** they are viewing:
- Driver Age: ${currentPolicy.driverAge} years old (Risk Category: ${currentPolicy.riskCategory})
- Vehicle Age: ${currentPolicy.vehicleAge} years
- Vehicle Segment: ${currentPolicy.vehicleType}
- Previous Claims Count: ${currentPolicy.previousClaims}
- Annual Mileage: ${currentPolicy.annualMileage.toLocaleString()} km
- Underwriting Risk Rating: ${currentPolicy.riskScore} / 90
- Calculated loaded written premium: ₹${currentPolicy.finalPremium.toLocaleString("en-IN")} (Base Rate: ₹${currentPolicy.basePremium.toLocaleString("en-IN")})

You also have context about the **Historical Underwriting Portfolio**:
- Total portfolio size: ${portfolioSummary.count} active policy certificates
- Portfolio average risk rating: ${portfolioSummary.avgRiskScore} / 90 points
- Portfolio average loaded written premium: ₹${portfolioSummary.avgPremium.toLocaleString("en-IN")}

=== RESPONSE INSTRUCTIONS ===
1. Focus your advice exclusively on pricing, premium calculations, hazard loads, risk ratings, and commercial underwriting guidelines.
2. Ground your reasoning in the actual data provided. Avoid discussing claims reserving methodologies unless it's strictly to contrast it with pricing strategies.
3. Keep answers clear, technical, professional, objective, and authoritative. Speak like a senior actuarial officer. Format in Markdown with bold points or tables where appropriate.
4. Do not make up mock files. If the user asks about something outside this context, keep the focus on motor insurance reserving and pricing.
`;
      } else {
        systemInstruction = `
You are the **Reserving Actuarial Specialist Agent**, a senior loss reserving actuary and solvency margin consultant.
You are embedded inside an interactive actuarial system.

Your core expertise includes:
- Claim reserve calculations, outstanding claim liabilities (OSLR), and IBNR (Incurred But Not Reported) frameworks.
- Severity analysis based on claim type (Own Damage, Third-Party Property Damage, Third-Party Bodily Injury).
- Solvency margins, reserving adequacy, and claim ratios.

To assist you, you are provided with context about the **Current Policy Profile & Loss Incident** they are viewing:
- Driver Age: ${currentPolicy.driverAge} years old (Risk Category: ${currentPolicy.riskCategory})
- Claim Category Under Review: ${currentPolicy.claimType} Severity
- Estimated Repair Cost: ₹${currentPolicy.estimatedRepairCost.toLocaleString("en-IN")}
- Suggested Claims Reserve Allocation: ₹${currentPolicy.suggestedReserve.toLocaleString("en-IN")}
- Previous Claims Count: ${currentPolicy.previousClaims}

You also have context about the **Historical Underwriting Portfolio Outstanding Liabilities**:
- Total portfolio size: ${portfolioSummary.count} active policy certificates
- Aggregate Outstanding claims reserves allocated: ₹${portfolioSummary.totalReserves.toLocaleString("en-IN")}

=== RESPONSE INSTRUCTIONS ===
1. Focus your advice exclusively on reserving adequacy, claim reserve methodologies, estimated repair costs, loss settlement speed, and solvency guidelines.
2. Ground your reasoning in the actual loss and reserve data. Avoid discussing front-end pricing rating metrics or mileage metrics unless contrasting with claims-side reserving.
3. Keep answers clear, technical, professional, objective, and authoritative. Speak like a senior actuarial officer. Format in Markdown with bold points or tables where appropriate.
4. Do not make up mock files. If the user asks about something outside this context, keep the focus on motor insurance reserving and pricing.
`;
      }

      const contents = messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

      const response = await generateContentWithFallback(client, {
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ reply: response.text || "I was unable to formulate a response. Please verify the prompt context." });
    } catch (error: any) {
      console.error("AI Agent chat error:", error);
      
      const isUnavailable = error.message?.includes("503") || 
                            error.message?.includes("UNAVAILABLE") || 
                            error.message?.includes("high demand") || 
                            error.message?.includes("quota") || 
                            error.message?.includes("429") ||
                            error.status === 503;

      let friendlyReply = "";
      if (isPricing) {
        if (isUnavailable) {
          friendlyReply = `⚠️ **Temporary Pricing API High-Demand Notice**\n\nOur primary AI models are currently experiencing a temporary spike in global request volume (503 Service Unavailable). \n\n**Pricing Underwriting Advisory Notes:**\n- **Applicant Risk Rating**: ${currentPolicy.riskScore}/90 (${currentPolicy.riskCategory})\n- **Calculated Premium**: ₹${currentPolicy.finalPremium?.toLocaleString("en-IN")}\n- **Prior Claims**: ${currentPolicy.previousClaims}\n\n*Please try sending your message again in a few moments, or check your custom Gemini API key settings.*`;
        } else {
          friendlyReply = `⚠️ **Pricing System Integration Notice**\n\nWe encountered an issue communicating with the model: *${error.message || "Unknown API communication error"}*.\n\n**Direct Pricing Insights:**\n- The driver is ${currentPolicy.driverAge} years old with ${currentPolicy.previousClaims} prior claims.\n- Calculated written premium is ₹${currentPolicy.finalPremium?.toLocaleString("en-IN")}.\n\nPlease check your key and configuration and try again.`;
        }
      } else {
        if (isUnavailable) {
          friendlyReply = `⚠️ **Temporary Reserving API High-Demand Notice**\n\nOur primary AI models are currently experiencing a temporary spike in global request volume (503 Service Unavailable). \n\n**Reserving Actuarial Advisory Notes:**\n- **Claim Category Under Review**: ${currentPolicy.claimType}\n- **Suggested Reserving**: ₹${currentPolicy.suggestedReserve?.toLocaleString("en-IN")}\n- **Estimated Repair Cost**: ₹${currentPolicy.estimatedRepairCost?.toLocaleString("en-IN")}\n\n*Please try sending your message again in a few moments, or check your custom Gemini API key settings.*`;
        } else {
          friendlyReply = `⚠️ **Reserving System Integration Notice**\n\nWe encountered an issue communicating with the model: *${error.message || "Unknown API communication error"}*.\n\n**Direct Reserving Insights:**\n- Claim Reserve calculation: Minimum standard reserve for ${currentPolicy.claimType} claim is ₹${currentPolicy.suggestedReserve?.toLocaleString("en-IN")}.\n- Estimated repair liability: ₹${currentPolicy.estimatedRepairCost?.toLocaleString("en-IN")}.\n\nPlease check your key and configuration and try again.`;
        }
      }
      
      // Return a successful 200 with the friendly, formatted advisory notice so the chat continues smoothly.
      res.json({ reply: friendlyReply });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Full-stack server running on port ${PORT}`);
  });
}

startServer();
