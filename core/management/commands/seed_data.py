from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import ATMLocation, CyberComplaint, PredictionHotspot, MuleAccount

class Command(BaseCommand):
    help = "Seed database with realistic Hubballi-Dharwad twin-city records for CyberPredict demo"

    def handle(self, *args, **kwargs):
        self.stdout.write("Purging old records...")
        PredictionHotspot.objects.all().delete()
        MuleAccount.objects.all().delete()
        CyberComplaint.objects.all().delete()
        ATMLocation.objects.all().delete()

        self.stdout.write("Seeding Hubballi-Dharwad ATM Network...")
        # 1. Create Hubballi-Dharwad ATMs
        atm_hbl_cbt = ATMLocation.objects.create(
            atm_id="ATM-HBL-01",
            bank_name="State Bank of India",
            area="CBT / Koppikar Road, Hubballi",
            latitude=15.3487,
            longitude=75.1384,
            dist_to_mule_branch_km=0.65,
            past_fraud_cases=11
        )
        atm_hbl_vidya = ATMLocation.objects.create(
            atm_id="ATM-HBL-02",
            bank_name="HDFC Bank",
            area="Vidyanagar, Hubballi",
            latitude=15.3688,
            longitude=75.1235,
            dist_to_mule_branch_km=0.95,
            past_fraud_cases=9
        )
        atm_hbl_gokul = ATMLocation.objects.create(
            atm_id="ATM-HBL-03",
            bank_name="Canara Bank",
            area="Gokul Road Industrial Estate, Hubballi",
            latitude=15.3621,
            longitude=75.1052,
            dist_to_mule_branch_km=3.4,
            past_fraud_cases=4
        )
        atm_dwd_jubilee = ATMLocation.objects.create(
            atm_id="ATM-DWD-01",
            bank_name="Karnataka Bank",
            area="Jubilee Circle / Court Road, Dharwad",
            latitude=15.4589,
            longitude=75.0078,
            dist_to_mule_branch_km=1.2,
            past_fraud_cases=8
        )
        atm_dwd_saptapur = ATMLocation.objects.create(
            atm_id="ATM-DWD-02",
            bank_name="Punjab National Bank",
            area="Saptapur Circle, Dharwad",
            latitude=15.4642,
            longitude=74.9965,
            dist_to_mule_branch_km=2.1,
            past_fraud_cases=5
        )

        self.stdout.write("Seeding NCRP Complaints...")
        # 2. Create Complaints
        c1 = CyberComplaint.objects.create(
            complaint_id="NCRP-2026-91021",
            crime_type="Part-Time Job / Task Scam",
            amount_lost=145000,
            reporting_lag_mins=12,
            mule_hops=4,
            incident_timestamp=timezone.now()
        )
        c2 = CyberComplaint.objects.create(
            complaint_id="NCRP-2026-91022",
            crime_type="UPI Impersonation Fraud",
            amount_lost=48000,
            reporting_lag_mins=35,
            mule_hops=2,
            incident_timestamp=timezone.now()
        )
        c3 = CyberComplaint.objects.create(
            complaint_id="NCRP-2026-91023",
            crime_type="Card Cloning / ATM Skimming",
            amount_lost=25000,
            reporting_lag_mins=85,
            mule_hops=1,
            incident_timestamp=timezone.now()
        )

        self.stdout.write("Generating Prediction Hotspots...")
        # 3. Create Prediction Hotspots (Feeds LEA Grid & Leaflet Map)
        PredictionHotspot.objects.create(
            atm=atm_hbl_vidya,
            complaint=c1,
            risk_score=96,
            predicted_time_window="18:00 - 21:00",
            status="High",
            recommended_action="Critical Intercept: High probability cash-out at Vidyanagar. Deploy Vidyanagar PS mobile beat patrol.",
            factor_previous_cases=92,
            factor_pattern_match=95,
            factor_time_risk=94,
            factor_proximity=88
        )
        PredictionHotspot.objects.create(
            atm=atm_dwd_jubilee,
            complaint=c2,
            risk_score=82,
            predicted_time_window="17:30 - 20:30",
            status="High",
            recommended_action="High Alert: Immediate watch on Karnataka Bank ATM (Jubilee Circle). Alert Dharwad Town Police station.",
            factor_previous_cases=85,
            factor_pattern_match=80,
            factor_time_risk=78,
            factor_proximity=82
        )
        PredictionHotspot.objects.create(
            atm=atm_hbl_cbt,
            complaint=c1,
            risk_score=74,
            predicted_time_window="19:00 - 22:00",
            status="Medium",
            recommended_action="Secondary Corridor Target: Monitor Koppikar Road commercial stretch CCTV network.",
            factor_previous_cases=88,
            factor_pattern_match=70,
            factor_time_risk=65,
            factor_proximity=74
        )
        PredictionHotspot.objects.create(
            atm=atm_hbl_gokul,
            complaint=c3,
            risk_score=52,
            predicted_time_window="20:00 - 23:00",
            status="Medium",
            recommended_action="Routine Vigil: Moderate activity profile. Notify Gokul Road beat patrol vehicle.",
            factor_previous_cases=45,
            factor_pattern_match=50,
            factor_time_risk=42,
            factor_proximity=60
        )

        self.stdout.write("Seeding Mule Accounts for Bank FRM...")
        # 4. Create Mule Accounts (Feeds Bank FRM Console)
        MuleAccount.objects.create(
            account_number="ACC-HBL-91021",
            account_holder="Basavaraj Patil (Mule L3)",
            bank_name="HDFC Bank",
            branch="Vidyanagar, Hubballi",
            layer=3,
            at_risk_amount=145000.00,
            target_atm=atm_hbl_vidya,
            risk_score=96,
            is_lien_placed=False
        )
        MuleAccount.objects.create(
            account_number="ACC-DWD-88142",
            account_holder="Manjunath Kulkarni (Mule L2)",
            bank_name="Karnataka Bank",
            branch="Market Road, Dharwad",
            layer=2,
            at_risk_amount=48000.00,
            target_atm=atm_dwd_jubilee,
            risk_score=82,
            is_lien_placed=False
        )
        MuleAccount.objects.create(
            account_number="ACC-HBL-33019",
            account_holder="Irfan Nadaf (Mule L1)",
            bank_name="SBI",
            branch="CBT Koppikar, Hubballi",
            layer=1,
            at_risk_amount=25000.00,
            target_atm=atm_hbl_cbt,
            risk_score=74,
            is_lien_placed=False
        )

        self.stdout.write(self.style.SUCCESS("Successfully seeded Hubballi-Dharwad dataset!"))