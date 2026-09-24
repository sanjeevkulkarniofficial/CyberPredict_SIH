import os
import pandas as pd
import numpy as np

def generate_synthetic_data(file_path=None, n_records=1500):
    if file_path is None:
        file_path = os.path.join(os.path.dirname(__file__), "training_data.csv")

    np.random.seed(42)

    crime_types = ["UPI Fraud", "Card Fraud", "Phishing", "Investment Scam", "Job Scam"]
    crime_weights = [0.40, 0.15, 0.15, 0.18, 0.12]

    records = []

    for _ in range(n_records):
        crime_type = np.random.choice(crime_types, p=crime_weights)

        # Crime-specific lag & amount dynamics
        if crime_type == "UPI Fraud":
            reporting_lag = int(np.random.exponential(scale=22) + 4)
            amount = float(np.random.choice([8000, 15000, 25000, 48000, 85000, 120000]))
            mule_hops = int(np.random.choice([1, 2, 3], p=[0.25, 0.55, 0.20]))
        elif crime_type == "Card Fraud":
            reporting_lag = int(np.random.exponential(scale=18) + 3)
            amount = float(np.random.choice([10000, 20000, 40000, 50000, 100000]))
            mule_hops = int(np.random.choice([1, 2], p=[0.70, 0.30]))
        elif crime_type == "Job Scam":
            reporting_lag = int(np.random.exponential(scale=45) + 12)
            amount = float(np.random.choice([50000, 120000, 250000, 500000, 850000]))
            mule_hops = int(np.random.choice([2, 3, 4], p=[0.30, 0.50, 0.20]))
        elif crime_type == "Investment Scam":
            reporting_lag = int(np.random.exponential(scale=60) + 20)
            amount = float(np.random.choice([150000, 300000, 600000, 1200000, 2000000]))
            mule_hops = int(np.random.choice([2, 3, 4, 5], p=[0.20, 0.40, 0.30, 0.10]))
        else: # Phishing
            reporting_lag = int(np.random.exponential(scale=30) + 8)
            amount = float(np.random.choice([20000, 45000, 75000, 150000]))
            mule_hops = int(np.random.choice([1, 2, 3], p=[0.40, 0.45, 0.15]))

        # Geospatial distance from mule account branch/ATM cluster in km
        dist_km = round(float(np.random.exponential(scale=1.2) + 0.15), 2)
        past_cases = int(np.random.poisson(lam=9))

        # Ground truth cashout risk calculation combining geospatial, velocity, and history
        geo_risk = (1.0 / (dist_km + 0.2)) * 0.30
        velocity_risk = (1.0 / (reporting_lag + 2)) * 12.0
        historical_risk = (past_cases / 30.0) * 0.40
        amount_factor = 0.25 if amount >= 50000 else 0.05
        hops_penalty = 0.10 * mule_hops

        combined_score = geo_risk + velocity_risk + historical_risk + amount_factor + hops_penalty
        target_cashout = 1 if combined_score >= 1.25 else 0

        records.append({
            "reporting_lag": reporting_lag,
            "amount": amount,
            "mule_hops": mule_hops,
            "dist_km": dist_km,
            "past_cases": past_cases,
            "crime_type": crime_type,
            "target_cashout": target_cashout
        })

    df = pd.DataFrame(records)
    df.to_csv(file_path, index=False)
    print(f"Generated {len(df)} synthetic records saved to {file_path}")
    return df

if __name__ == "__main__":
    generate_synthetic_data()