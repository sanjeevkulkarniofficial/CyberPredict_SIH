import os
import sys
import django

# Setup Django settings
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cyberpredict_api.settings')
django.setup()

from core.models import OfficialUser, ATMLocation


def seed_data():
    default_users = [
        {
            "email": "admin@i4c.gov.in",
            "password": "Password@123",
            "full_name": "Dr. R. Sharma (Director)",
            "role": "I4C_ADMIN",
            "organization": "Indian Cyber Crime Coordination Centre (I4C)"
        },
        {
            "email": "lea.hubballi@police.gov.in",
            "password": "Password@123",
            "full_name": "Insp. Sanjeev Kumar",
            "role": "LEA_OFFICER",
            "organization": "Hubballi Cyber Crime Police Station (LEA)"
        },
        {
            "email": "nodal@hdfcbank.com",
            "password": "Password@123",
            "full_name": "Vikram Desai (Nodal Head)",
            "role": "BANK_NODAL",
            "organization": "Bank FRM Desk"
        }
    ]

    for item in default_users:
        user, created = OfficialUser.objects.get_or_create(
            email=item["email"],
            defaults={
                "password": item["password"],
                "full_name": item["full_name"],
                "role": item["role"],
                "organization": item["organization"]
            }
        )
        if created:
            print(f"Created OfficialUser: {user.email} ({user.role})")
        else:
            print(f"OfficialUser already exists: {user.email}")

    default_atms = [
        {"atm_id": "ATM-HBL-01", "bank_name": "State Bank of India", "area": "CBT / Koppikar Road, Hubballi", "latitude": 15.3487, "longitude": 75.1384, "dist_to_mule_branch_km": 0.4, "past_fraud_cases": 12},
        {"atm_id": "ATM-HBL-02", "bank_name": "HDFC Bank", "area": "Vidyanagar, Hubballi", "latitude": 15.3688, "longitude": 75.1235, "dist_to_mule_branch_km": 0.6, "past_fraud_cases": 18},
        {"atm_id": "ATM-HBL-03", "bank_name": "Canara Bank", "area": "Gokul Road Industrial Estate, Hubballi", "latitude": 15.3621, "longitude": 75.1052, "dist_to_mule_branch_km": 1.2, "past_fraud_cases": 9},
        {"atm_id": "ATM-DWD-01", "bank_name": "Karnataka Bank", "area": "Jubilee Circle / Court Road, Dharwad", "latitude": 15.4589, "longitude": 75.0078, "dist_to_mule_branch_km": 0.8, "past_fraud_cases": 7},
        {"atm_id": "ATM-DWD-02", "bank_name": "Punjab National Bank", "area": "Saptapur Circle, Dharwad", "latitude": 15.4642, "longitude": 74.9965, "dist_to_mule_branch_km": 0.7, "past_fraud_cases": 11},
    ]

    for item in default_atms:
        atm, created = ATMLocation.objects.get_or_create(
            atm_id=item["atm_id"],
            defaults=item
        )
        if created:
            print(f"Created ATM: {atm.atm_id} - {atm.bank_name}")

    print("Database seeding completed successfully.")


if __name__ == "__main__":
    seed_data()