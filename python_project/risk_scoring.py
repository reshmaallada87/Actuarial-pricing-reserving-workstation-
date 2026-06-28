# app.py
import streamlit as st
import pandas as pd
import numpy as np
import os
import sys

# Append current directory to path to ensure modular imports work correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from risk_scoring import calculate_risk_score
from pricing import calculate_premium
from reserving import calculate_reserve
from report_generator import generate_pdf_report
from utils import load_dataset, format_currency, get_analytics_summary

# Set Page Config
st.set_page_config(
    page_title="Motor Insurance Pricing & Claims Reserving Agent",
    page_icon="🚗",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Application Theme / Styling
st.markdown("""
<style>
    .main-title {
        font-size: 2.5rem;
        color: #1E3A8A;
        font-weight: 700;
        margin-bottom: 0.5rem;
    }
    .subtitle {
        font-size: 1.1rem;
        color: #475569;
        margin-bottom: 2rem;
    }
    .section-card {
        background-color: #F8FAFC;
        padding: 1.5rem;
        border-radius: 0.75rem;
        border: 1px solid #E2E8F0;
        margin-bottom: 1.5rem;
    }
    .risk-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-weight: 600;
        font-size: 0.9rem;
        display: inline-block;
    }
    .risk-low { background-color: #DCFCE7; color: #16A34A; }
    .risk-medium { background-color: #FEF3C7; color: #D97706; }
    .risk-high { background-color: #FEE2E2; color: #DC2626; }
</style>
""", unsafe_style_allowed=True)

# Main Title Header
st.markdown("<div class='main-title'>🚗 Motor Insurance Pricing & Reserving Workspace</div>", unsafe_style_allowed=True)
st.markdown("<div class='subtitle'>Actuarial Underwriting & Claims Reserving Decision Support Workspace powered by AI</div>", unsafe_style_allowed=True)

# Load Dataset
df_historical = load_dataset()
analytics = get_analytics_summary(df_historical)

# Tabs
tab_workspace, tab_analytics, tab_code = st.tabs([
    "🎯 Underwriter Workspace", 
    "📊 Portfolio Analytics Dashboard", 
    "💻 Code Explorer & Instructions"
])

# --- TAB 1: WORKSPACE ---
with tab_workspace:
    st.markdown("### Underwriting Risk Profiler & Claims Assessor")
    
    # 2-Column layout for input and output
    col_input, col_results = st.columns([1, 1.3])
    
    with col_input:
        st.markdown("#### Input Risk Parameters")
        with st.form("underwriting_form"):
            # Driver details
            st.subheader("Driver Profile")
            driver_age = st.number_input("Driver Age", min_value=18, max_value=100, value=28, help="Age of the primary driver")
            
            # Vehicle details
            st.subheader("Vehicle Details")
            vehicle_age = st.number_input("Vehicle Age (Years)", min_value=0, max_value=40, value=3, help="Age of the vehicle")
            vehicle_type = st.selectbox(
                "Vehicle Segment/Type", 
                ["Sedan", "Hatchback", "SUV", "Luxury"], 
                index=0,
                help="Luxury vehicles incur custom underwriting load factors"
            )
            annual_mileage = st.number_input("Annual Mileage (KM)", min_value=0, max_value=200000, value=12000, step=1000)
            
            # Claims & Repair Cost
            st.subheader("Claims Exposure")
            previous_claims = st.number_input("Number of Previous Claims", min_value=0, max_value=20, value=0)
            claim_type = st.selectbox(
                "Current Claim Severity", 
                ["Minor", "Moderate", "Major"], 
                index=0,
                help="Categorization for claims reserving outstanding thresholds"
            )
            estimated_repair_cost = st.number_input("Estimated Repair Cost (₹)", min_value=0.0, value=25000.0, step=5000.0)
            
            # Form submit button
            submit_btn = st.form_submit_button("Run Pricing & Claims Reserve Assessment")

    # Perform calculations
    risk_results = calculate_risk_score(driver_age, vehicle_age, previous_claims, annual_mileage)
    premium_results = calculate_premium(driver_age, vehicle_age, previous_claims, vehicle_type)
    reserve_results = calculate_reserve(claim_type, estimated_repair_cost)
    
    # Generate Narrative Explanation
    explanation_text = ""
    # We attempt to generate a custom natural language explanation based on active parameters
    premium_reasons = []
    if driver_age < 25:
        premium_reasons.append("the driver is under 25 years old (high frequency cohort)")
    if vehicle_age > 5:
        premium_reasons.append("the vehicle is older than 5 years (depreciated asset vulnerability)")
    if previous_claims > 0:
        premium_reasons.append(f"the driver has previous claims history ({previous_claims} prior claims)")
    if vehicle_type.lower() == "luxury":
        premium_reasons.append("the vehicle is classified in the Luxury segment (elevated parts and labor costs)")
        
    premium_cause = " and ".join(premium_reasons) if premium_reasons else "standard baseline risk factors"
    
    reserve_details = ""
    if estimated_repair_cost < reserve_results['minimum_reserve_threshold']:
        reserve_details = f"The reserve was set to the regulatory baseline minimum of ₹{reserve_results['minimum_reserve_threshold']:,} for a {claim_type} claim, since the estimated repair cost (₹{estimated_repair_cost:,}) was below the historical tail-risk threshold."
    else:
        reserve_details = f"The reserve was marked up to ₹{reserve_results['reserve_amount']:,} based on the detailed repair estimate which exceeded the baseline threshold of ₹{reserve_results['minimum_reserve_threshold']:,}."
        
    explanation_text = (
        f"The risk assessment engine has classified this customer profile as '{risk_results['category']}' with an aggregated actuarial risk score of {risk_results['total_score']} / 90. "
        f"The recommended final premium is set to ₹{premium_results['final_premium']:,} (representing a standard base premium of ₹{premium_results['base_premium']:,} adjusted for risk factors). "
        f"The premium is adjusted because {premium_cause}. "
        f"{reserve_details} This reserve ensures adequate outstanding claim coverage to support solvent settlement procedures."
    )
    
    # Try using modern Gemini API if configured in environments
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key and api_key != "MY_GEMINI_API_KEY":
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            prompt = f"""
            You are a senior motor insurance underwriter and claims actuary.
            Explain the underwriting risk decision, pricing structure, and claims reserving recommendation for this file:
            
            - Driver Age: {driver_age} years
            - Vehicle Age: {vehicle_age} years
            - Vehicle Type: {vehicle_type}
            - Previous Claims: {previous_claims}
            - Annual Mileage: {annual_mileage:,} KM
            
            - Calculated Risk Score: {risk_results['total_score']} (Category: {risk_results['category']})
            - Standard Base Premium: ₹{premium_results['base_premium']}
            - Custom Risk Premium Adjustments: {premium_results['adjustments']}
            - Suggested Final Premium: ₹{premium_results['final_premium']}
            
            - Claim Severity: {claim_type}
            - Reported Estimated Repair Cost: ₹{estimated_repair_cost}
            - Suggested Claims Reserve: ₹{reserve_results['reserve_amount']}
            - Reserving Rule Rationale: {reserve_results['rationale']}
            
            Provide a professional, concise, senior underwriting report summarizing:
            1. Why the risk score and class were assigned as such.
            2. Highlighting exactly which risk adjustments increased or saved premium costs.
            3. Confirming the reserving rationale, highlighting tail-risk coverage.
            Keep your tone highly professional, objective, and analytical. Speak in first-person plural as the underwriting committee. Keep it to 150-200 words.
            """
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            if response.text:
                explanation_text = response.text.strip()
        except Exception as e:
            pass # Keep standard rules-based explanation

    with col_results:
        st.markdown("#### Actuarial Analysis Report")
        
        # Risk Badge
        risk_class = risk_results['category']
        badge_style = "risk-low" if "Low" in risk_class else ("risk-medium" if "Medium" in risk_class else "risk-high")
        st.markdown(f"**Risk Evaluation Classification:** <span class='risk-badge {badge_style}'>{risk_class}</span> (Score: **{risk_results['total_score']} / 90**)", unsafe_style_allowed=True)
        
        # Metrics Row
        st.write("")
        m_col1, m_col2, m_col3 = st.columns(3)
        m_col1.metric("Aggregated Risk Score", f"{risk_results['total_score']} pts")
        m_col2.metric("Recommended Premium", format_currency(premium_results['final_premium']))
        m_col3.metric("Outstanding Claims Reserve", format_currency(reserve_results['reserve_amount']))
        
        # Details Cards
        st.write("")
        
        # Pricing Card
        with st.expander("💳 Detailed Underwriting Premium Pricing Adjustments", expanded=True):
            st.write(f"**Base Premium:** {format_currency(premium_results['base_premium'])}")
            if premium_results['adjustments']:
                adj_df = pd.DataFrame(premium_results['adjustments'])
                adj_df['amount'] = adj_df['amount'].apply(format_currency)
                st.table(adj_df)
            else:
                st.info("No pricing adjustments applied. Customer qualifies for baseline rates.")
            st.write(f"**Total Premium Surcharges:** {format_currency(premium_results['total_adjustments'])}")
            st.markdown(f"**Final Underwritten Premium Price:** `{format_currency(premium_results['final_premium'])}`")
            
        # Reserving Card
        with st.expander("🛡️ Claims Reserve Estimation Analysis", expanded=True):
            st.write(f"**Claim Type Severity:** {claim_type}")
            st.write(f"**Estimated Repair Cost:** {format_currency(estimated_repair_cost)}")
            st.write(f"**Minimum Regulatory Reserve Baseline:** {format_currency(reserve_results['minimum_reserve_threshold'])}")
            st.markdown(f"**Suggested Claim Reserve (Provision):** `{format_currency(reserve_results['reserve_amount'])}`")
            st.markdown(f"*Rationale Details:* {reserve_results['rationale']}")
            
        # AI Explanation Card
        with st.expander("🤖 Senior AI Analyst Narrative & Underwriting Commentary", expanded=True):
            st.write(explanation_text)
            
        # Report Download Section
        st.write("")
        customer_info_dict = {
            "driver_age": driver_age,
            "vehicle_age": vehicle_age,
            "vehicle_type": vehicle_type,
            "previous_claims": previous_claims,
            "annual_mileage": annual_mileage,
            "estimated_repair_cost": estimated_repair_cost,
            "claim_type": claim_type
        }
        
        try:
            pdf_data = generate_pdf_report(customer_info_dict, risk_results, premium_results, reserve_results, explanation_text)
            st.download_button(
                label="📄 Download Underwriter Risk Assessment & Reserving PDF Report",
                data=pdf_data,
                file_name=f"motor_insurance_report_{driver_age}yo_{vehicle_type.lower()}.pdf",
                mime="application/pdf"
            )
        except Exception as e:
            st.error(f"Error compiling PDF: {str(e)}")

# --- TAB 2: PORTFOLIO ANALYTICS ---
with tab_analytics:
    st.markdown("### Portfolio Historical Underwriting Insights")
    st.markdown("Aggregated analytics from the historical motor insurance portfolio comprising current policies.")
    
    # High Level Metrics Row
    kpi_col1, kpi_col2, kpi_col3, kpi_col4 = st.columns(4)
    kpi_col1.metric("Total Covered Vehicles", f"{analytics['total_records']} Policies")
    kpi_col2.metric("Average Risk Score", f"{analytics['avg_risk_score']} / 90")
    kpi_col3.metric("Average Policy Premium", format_currency(analytics['avg_premium']))
    kpi_col4.metric("Total Reserve Exposure", format_currency(analytics['total_reserves']))
    
    st.write("")
    
    # Portfolio distribution visualizations
    col_chart1, col_chart2 = st.columns(2)
    
    with col_chart1:
        st.markdown("#### Risk Category Distribution")
        risk_dist = pd.DataFrame(list(analytics['risk_distribution'].items()), columns=["Category", "Count"])
        st.bar_chart(risk_dist.set_index("Category"))
        
    with col_chart2:
        st.markdown("#### Claim Type Severity Exposure")
        claim_dist = pd.DataFrame(list(analytics['claim_distribution'].items()), columns=["Severity", "Count"])
        st.bar_chart(claim_dist.set_index("Severity"))

    # Scatter analysis
    st.markdown("#### Portfolio Correlation Analysis")
    col_scat1, col_scat2 = st.columns(2)
    with col_scat1:
        st.markdown("**Vehicle Age vs Calculated Premium**")
        st.scatter_chart(df_historical, x="vehicle_age", y="calculated_premium", color="risk_category")
    with col_scat2:
        st.markdown("**Repair Cost vs Suggested Claims Reserve**")
        st.scatter_chart(df_historical, x="estimated_repair_cost", y="claim_reserve", color="claim_type")

# --- TAB 3: CODE EXPLORER ---
with tab_code:
    st.markdown("### Modular Codebase & Local Execution Instructions")
    
    st.markdown("""
    This project is fully modular, adhering to professional actuarial and software development guidelines.
    You can inspect the source code of each file below, copy it, or download this folder to run the Streamlit app locally!
    """)
    
    # Local installation guide
    st.markdown("#### 🚀 Local Execution Instructions")
    instructions_text = """
    **How to run this Motor Insurance Underwriting workspace locally on your machine:**
    
    1. **Set up a Python virtual environment:**
       ```bash
       python -m venv venv
       source venv/bin/activate  # On Windows: venv\\Scripts\\activate
       ```
       
    2. **Install requirements:**
       ```bash
       pip install -r requirements.txt
       ```
       
    3. **Ensure the following files are in the same folder:**
       - `app.py`
       - `pricing.py`
       - `reserving.py`
       - `risk_scoring.py`
       - `report_generator.py`
       - `utils.py`
       - `motor_insurance_dataset.csv`
       - `requirements.txt`
       
    4. **(Optional) Add your Google Gemini API Key:**
       Set your environment variable to leverage advanced senior underwriting narrative generation:
       ```bash
       export GEMINI_API_KEY="your-api-key-here"  # On Windows: set GEMINI_API_KEY="your-api-key-here"
       ```
       
    5. **Launch the Streamlit app:**
       ```bash
       streamlit run app.py
       ```
    """
    st.markdown(instructions_text)
    
    # Code Files Explorer
    st.markdown("#### 📂 Code Explorer")
    
    # File options
    files_list = {
        "app.py": "The central Streamlit application housing dashboard layouts and widgets.",
        "risk_scoring.py": "Actuarial risk indexing algorithm based on driver age, mileage, vehicle age, and claim history.",
        "pricing.py": "Premium pricing model with specific percentage risk-loading factors.",
        "reserving.py": "Claims reserving algorithms and regulatory minimum threshold controls.",
        "report_generator.py": "Typesetting PDF compiler utilizing ReportLab to generate dynamic formatted client reports.",
        "utils.py": "Statistical utilities, pandas loading routines, and currency formatters.",
        "requirements.txt": "Listing of Python pip dependencies for virtual environment bootstrapping.",
        "motor_insurance_dataset.csv": "Historical mock CSV file for dashboard charts and portfolio correlation insights."
    }
    
    selected_file = st.selectbox("Select file to view source code:", list(files_list.keys()))
    st.markdown(f"**Description:** {files_list[selected_file]}")
    
    # Read and show selected file
    try:
        # Load local folder contents
        file_path = os.path.join(os.path.dirname(__file__), selected_file)
        if os.path.exists(file_path):
            with open(file_path, "r") as f:
                content = f.read()
            st.code(content, language="python" if not selected_file.endswith(".csv") else "text")
        else:
            st.warning(f"File {selected_file} not found. Ensure it exists in the repository.")
    except Exception as e:
        st.error(f"Could not load file source code: {str(e)}")
