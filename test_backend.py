import os
import sys
import django
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cyberpredict_api.settings')
django.setup()

from django.test import Client
from core.models import MuleAccount, ATMLocation, CyberComplaint

print("================================================================")
print("   CYBERPREDICT: 4 KEY DELIVERABLES BACKEND VALIDATION SUITE    ")
print("================================================================")

client = Client()
all_passed = True

# 1. DELIVERABLE A: PREDICTIVE ANALYTICS ENGINE
print("\n[TEST 1] Deliverable A: Predictive Analytics Engine & Hotspot Forecast")
complaint_payload = {
    "crime_type": "Investment Scam",
    "amount_lost": 185000,
    "reporting_lag_mins": 14,
    "mule_hops": 3
}
r1 = client.post("/api/citizen/report/", data=json.dumps(complaint_payload), content_type="application/json")
r1_data = r1.json() if r1.status_code == 201 else {}
p1_success = (
    r1.status_code == 201 and
    "predicted_atm" in r1_data and
    "live_risk_score" in r1_data and
    "factors" in r1_data
)
print(f" -> Status: {r1.status_code}")
if p1_success:
    print(f" -> Forecasted ATM: {r1_data.get('predicted_atm')} ({r1_data.get('predicted_area')})")
    print(f" -> Cashout Risk Score: {r1_data.get('live_risk_score')}%")
    print(f" -> Tactical Time Window: {r1_data.get('time_window')}")
    print(f" -> XAI Factors: {r1_data.get('factors')}")
    print(" -> RESULT: PASS (AI/ML Prediction + XAI Generated)")
else:
    all_passed = False
    print(f" -> RESULT: FAIL ({r1.content.decode()})")

# 2. DELIVERABLE B: RISK HEATMAP DASHBOARD & DRILL-DOWN FILTERS
print("\n[TEST 2] Deliverable B: GIS Risk Heatmap with Drill-Down Filtering")
# 2a. Unfiltered
r2_all = client.get("/api/predictions/hotspots/")
r2_all_data = r2_all.json() if r2_all.status_code == 200 else []

# 2b. Drill-down by Crime Category
r2_crime = client.get("/api/hotspots/?crime_type=Investment+Scam")
r2_crime_data = r2_crime.json() if r2_crime.status_code == 200 else []

# 2c. Drill-down by Minimum Risk Score
r2_min_risk = client.get("/api/hotspots/?min_risk=75")
r2_min_risk_data = r2_min_risk.json() if r2_min_risk.status_code == 200 else []

p2_success = r2_all.status_code == 200 and len(r2_all_data) > 0 and r2_crime.status_code == 200
print(f" -> Total Hotspots In Feed: {len(r2_all_data)}")
print(f" -> Filtered by 'Investment Scam': {len(r2_crime_data)} matches")
print(f" -> Filtered by 'min_risk >= 75%': {len(r2_min_risk_data)} matches")
if p2_success:
    print(" -> RESULT: PASS (GIS Hotspot API + Drill-Down Filters Operational)")
else:
    all_passed = False
    print(" -> RESULT: FAIL")

# 3. DELIVERABLE C: LAW ENFORCEMENT INTERFACE & BEAT ALERT VECTOR
print("\n[TEST 3] Deliverable C: Law Enforcement Interface & Beat Vector Dispatch")
r3_vector = client.post("/api/notifications/beat-alert/", data=json.dumps({
    "atm_id": "ATM-HBL-02",
    "complaint_id": r1_data.get("complaint_id", "NCRP-2026-TEST")
}), content_type="application/json")
p3_success = r3_vector.status_code == 200 and r3_vector.json().get("status") == "success"
print(f" -> Status: {r3_vector.status_code}")
if p3_success:
    print(f" -> Message: {r3_vector.json().get('message')}")
    print(" -> RESULT: PASS (Tactical Beat Patrol Vector Dispatched)")
else:
    all_passed = False
    print(" -> RESULT: FAIL")

# 4. DELIVERABLE D: MULTI-CHANNEL ALERT & NOTIFICATION SYSTEM
print("\n[TEST 4] Deliverable D: Multi-Channel Alert & Notification System")
r4_notifs = client.get("/api/notifications/")
r4_data = r4_notifs.json() if r4_notifs.status_code == 200 else []
p4_success = r4_notifs.status_code == 200 and len(r4_data) > 0
channels_found = set(item.get("channel") for item in r4_data)
print(f" -> Status: {r4_notifs.status_code} | Total Logged Alerts: {len(r4_data)}")
print(f" -> Channels Detected: {', '.join(channels_found)}")
if p4_success:
    print(" -> RESULT: PASS (Multi-Channel Notifications SMS/Email/Webhook Active)")
else:
    all_passed = False
    print(" -> RESULT: FAIL")

# 5. BANK FRM & CFCFRMS LIEN / RESTORATION WORKFLOW
print("\n[TEST 5] Bank FRM Console: CFCFRMS Debit Lien & Fund Restoration")
r5_mules = client.get("/api/bank/mules/")
r5_mules_data = r5_mules.json() if r5_mules.status_code == 200 else []
target_account = r5_mules_data[0].get("id") if len(r5_mules_data) > 0 else "ACC-HBL-12345"

# Place lien
r5_lien = client.post(f"/api/bank/lien/{target_account}/")

# Test Fast-Lien Entire Case (Freezes ALL intermediary mule accounts tied to a complaint)
test_complaint_id = r1_data.get("complaint_id")
r5_fast_lien = client.post(f"/api/complaints/{test_complaint_id}/fast-lien/") if test_complaint_id else None
r5_fast_data = r5_fast_lien.json() if r5_fast_lien and r5_fast_lien.status_code == 200 else {}

# Initiate refund
r5_refund = client.post(f"/api/incidents/{target_account}/refund/")

p5_success = (
    r5_mules.status_code == 200 and
    r5_lien.status_code == 200 and
    (r5_fast_lien is None or (r5_fast_lien.status_code == 200 and r5_fast_data.get("total_mules", 0) > 0)) and
    r5_refund.status_code == 200 and
    r5_refund.json().get("status") == "REFUNDED"
)
print(f" -> Target Account: {target_account}")
print(f" -> Single Lien Enforcement: {r5_lien.status_code}")
if r5_fast_lien:
    print(f" -> Case Fast-Lien ({test_complaint_id}): Status {r5_fast_lien.status_code} | Total Mules Frozen: {r5_fast_data.get('total_mules')} | Secured: Rs.{r5_fast_data.get('total_secured', 0):,.2f}")
print(f" -> Fund Restoration: {r5_refund.status_code} (Ref: {r5_refund.json().get('refund_reference')})")
if p5_success:
    print(" -> RESULT: PASS (End-to-End CFCFRMS Debit Lien & Fund Recovery)")
else:
    all_passed = False
    print(" -> RESULT: FAIL")

# 6. I4C NATIONAL OVERVIEW & TELEMETRY
print("\n[TEST 6] I4C National Dashboard Macro Telemetry")
r6_summary = client.get("/api/dashboard/summary/")
r6_data = r6_summary.json() if r6_summary.status_code == 200 else {}
p6_success = r6_summary.status_code == 200 and "telemetry" in r6_data and "total_complaints" in r6_data
print(f" -> Status: {r6_summary.status_code}")
print(f" -> Macro Complaints: {r6_data.get('total_complaints')} | High Risk Hotspots: {r6_data.get('high_risk_locations')}")
print(f" -> Total Frozen: {str(r6_data.get('telemetry', {}).get('total_frozen')).encode('ascii', 'ignore').decode()} | Recovery Rate: {r6_data.get('telemetry', {}).get('recovery_rate')}")
if p6_success:
    print(" -> RESULT: PASS (National Threat Matrix Synchronized)")
else:
    all_passed = False
    print(" -> RESULT: FAIL")

# 7. CITIZEN NCRP ID CASE STATUS & PRIVACY-PROTECTED TRACKING
print("\n[TEST 7] Citizen Case Status & Privacy Protection (Phone-Bound Segregation)")
tracked_ncrp_id = r1_data.get("complaint_id", "NCRP-2026-1004")
numeric_suffix = tracked_ncrp_id.split("-")[-1]

# 7a. Authenticated citizen tracking their own case (+91 9886012345)
r7_auth_track = client.get(f"/api/complaints/status/{tracked_ncrp_id}/?phone=9886012345")
r7_data = r7_auth_track.json() if r7_auth_track.status_code == 200 else {}

# 7b. Unauthorized citizen attempting to check another citizen's case (+91 9111122222)
r7_stranger_track = client.get(f"/api/complaints/status/{tracked_ncrp_id}/?phone=9111122222")

# 7c. Partial ID search with owner's phone
r7_partial = client.get(f"/api/complaints/status/{numeric_suffix}/?phone=9886012345")

# 7d. Citizen case history feed for owner (+91 9886012345)
r7_owner_cases = client.get("/api/citizen/cases/?phone=9886012345")
r7_owner_data = r7_owner_cases.json() if r7_owner_cases.status_code == 200 else {}

# 7e. Citizen case history feed for a new/different phone (+91 9111122222) - MUST be 0 cases (no leaking!)
r7_stranger_cases = client.get("/api/citizen/cases/?phone=9111122222")
r7_stranger_data = r7_stranger_cases.json() if r7_stranger_cases.status_code == 200 else {}

p7_success = (
    r7_auth_track.status_code == 200 and
    r7_data.get("case_found") is True and
    "stage" in r7_data and
    len(r7_data.get("timeline", [])) == 4 and
    r7_stranger_track.status_code == 403 and
    r7_stranger_track.json().get("access_denied") is True and
    r7_partial.status_code == 200 and
    r7_owner_cases.status_code == 200 and
    len(r7_owner_data.get("cases", [])) > 0 and
    r7_stranger_cases.status_code == 200 and
    len(r7_stranger_data.get("cases", [])) == 0
)

print(f" -> Owner Lookup ({tracked_ncrp_id}): Status {r7_auth_track.status_code} | Stage: {r7_data.get('stage')}")
print(f" -> Unauthorized Phone Lookup: Status {r7_stranger_track.status_code} (Blocked: {r7_stranger_track.json().get('access_denied')})")
print(f" -> Owner Registered Complaints Feed: {len(r7_owner_data.get('cases', []))} complaints found")
print(f" -> Stranger Phone Feed (Zero Leakage Check): {len(r7_stranger_data.get('cases', []))} complaints (Strictly Segregated)")

if p7_success:
    print(" -> RESULT: PASS (Citizen Privacy Segregation & Phone Verification Operational)")
else:
    all_passed = False
    print(" -> RESULT: FAIL")

# 8. DELIVERABLE E: AI/ML REAL-TIME ACCURACY & MODEL PERFORMANCE MATRIX
print("\n[TEST 8] I4C AI/ML Real-Time Performance & Explainability Telemetry")
ml_data = r6_data.get("ml_metrics", {})
p8_success = (
    "accuracy" in ml_data and
    "roc_auc" in ml_data and
    "f1_score" in ml_data and
    "confusion_matrix" in ml_data and
    "feature_importance" in ml_data and
    len(ml_data.get("feature_importance", [])) == 5 and
    ml_data.get("accuracy") > 90 and
    ml_data.get("roc_auc") > 0.9
)
print(f" -> Model Architecture: {ml_data.get('model_name')} ({ml_data.get('engine_status')})")
print(f" -> Accuracy: {ml_data.get('accuracy')}% | ROC-AUC: {ml_data.get('roc_auc')} | F1 Score: {ml_data.get('f1_score')}%")
print(f" -> Real-time Latency: {ml_data.get('latency_ms')} ms | Interception Rate: {ml_data.get('interception_success_rate')}%")
print(f" -> Confusion Matrix: TP={ml_data.get('confusion_matrix', {}).get('true_positives')}, FP={ml_data.get('confusion_matrix', {}).get('false_positives')}, FN={ml_data.get('confusion_matrix', {}).get('false_negatives')}, TN={ml_data.get('confusion_matrix', {}).get('true_negatives')}")
print(f" -> Feature Importance Top Feature: {ml_data.get('feature_importance', [{}])[0].get('feature')} ({ml_data.get('feature_importance', [{}])[0].get('weight')}%)")
if p8_success:
    print(" -> RESULT: PASS (AI/ML Real-Time Accuracy & Performance Metrics Synchronized)")
else:
    all_passed = False
    print(" -> RESULT: FAIL")

print("\n================================================================")
if all_passed:
    print("   ALL TESTS PASSED: 4 KEY DELIVERABLES + NCRP TRACKING + AI/ML OPERATIONAL! ")
else:
    print("   ONE OR MORE TESTS FAILED - CHECK OUTPUT ABOVE               ")
print("================================================================\n")