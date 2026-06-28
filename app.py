# utils.py
import pandas as pd
import os

def load_dataset() -> pd.DataFrame:
    """
    Loads the sample motor insurance dataset.
    If the CSV file does not exist, it creates a default one.
    """
    csv_path = "motor_insurance_dataset.csv"
    if not os.path.exists(csv_path):
        # Fallback to local path if in subfolder
        csv_path = os.path.join(os.path.dirname(__file__), "motor_insurance_dataset.csv")
        
    try:
        return pd.read_csv(csv_path)
    except Exception:
        # Create dummy DataFrame if loading fails
        data = {
            "driver_age": [22, 45, 65, 31, 19, 52, 28, 38, 58, 24],
            "vehicle_age": [3, 2, 8, 6, 1, 10, 4, 7, 5, 6],
            "vehicle_type": ["Sedan", "SUV", "Luxury", "Hatchback", "Sedan", "SUV", "Luxury", "Sedan", "Hatchback", "SUV"],
            "previous_claims": [0, 1, 3, 0, 2, 0, 1, 0, 1, 2],
            "annual_mileage": [12000, 15000, 18000, 8000, 22000, 14000, 24000, 11000, 19500, 25000],
            "estimated_repair_cost": [12000, 32000, 85000, 8000, 45000, 5000, 120000, 0, 18000, 62000],
            "claim_type": ["Minor", "Moderate", "Major", "Minor", "Moderate", "Minor", "Major", "None", "Minor", "Moderate"],
            "risk_score": [40, 20, 70, 20, 80, 25, 35, 20, 20, 65],
            "risk_category": ["Medium Risk", "Low Risk", "High Risk", "Low Risk", "High Risk", "Low Risk", "Medium Risk", "Low Risk", "Low Risk", "High Risk"],
            "calculated_premium": [6000, 5750, 8250, 5500, 8000, 5500, 6750, 5500, 5750, 8500],
            "claim_reserve": [15000, 40000, 85000, 15000, 45000, 15000, 120000, 0, 18000, 62000]
        }
        return pd.DataFrame(data)

def format_currency(val: float) -> str:
    """
    Formats a numeric value as Indian Rupees (INR) with standard formatting.
    """
    if pd.isna(val) or val is None:
        return "₹0"
    return f"₹{val:,.2f}"

def get_analytics_summary(df: pd.DataFrame) -> dict:
    """
    Calculates statistical insights for the Streamlit dashboard.
    """
    total_records = len(df)
    avg_driver_age = df["driver_age"].mean()
    avg_vehicle_age = df["vehicle_age"].mean()
    avg_premium = df["calculated_premium"].mean()
    total_reserves = df["claim_reserve"].sum()
    avg_risk_score = df["risk_score"].mean()
    
    # Risk category counts
    risk_counts = df["risk_category"].value_counts().to_dict()
    
    # Claim type counts
    claim_counts = df["claim_type"].value_counts().to_dict()
    
    return {
        "total_records": total_records,
        "avg_driver_age": round(avg_driver_age, 1),
        "avg_vehicle_age": round(avg_vehicle_age, 1),
        "avg_premium": avg_premium,
        "total_reserves": total_reserves,
        "avg_risk_score": round(avg_risk_score, 1),
        "risk_distribution": risk_counts,
        "claim_distribution": claim_counts
    }
