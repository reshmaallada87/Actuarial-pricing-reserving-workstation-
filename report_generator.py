# risk_scoring.py

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
    }
