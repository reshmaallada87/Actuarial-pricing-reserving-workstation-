# pricing.py

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
    }
