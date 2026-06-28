# Actuarial Pricing & Reserving Workstation

## Overview

The **Actuarial Pricing & Reserving Workstation** is an AI-powered full-stack insurance application designed to streamline actuarial pricing, claims reserving, and portfolio risk analysis. The platform also includes an intelligent chatbot to provide insurance-related guidance and explanations.

## Features

* Premium Pricing Module
* Claims Reserving Module
* Portfolio Risk Dashboard
* AI-powered Insurance Chatbot
* Pricing and Reserving Narratives
* User-friendly Interface

## Technology Stack

* **Frontend:** React, TypeScript
* **Backend:** Node.js, Python
* **AI Integration:** Google Gemini API

## Application Workflow

1. User selects a module.
2. User enters the required information.
3. System validates the inputs.
4. AI processes the request.
5. Insurance logic is applied.
6. Results and explanations are displayed.

## Future Enhancements

* Generalized Linear Models (GLMs) for premium prediction.
* IBNR estimation using Chain Ladder and Bornhuetter–Ferguson methods.
* Loss Development Triangles.
* AI-based vehicle damage assessment using image analysis.


## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
