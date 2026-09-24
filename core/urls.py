from django.urls import path
from . import views

urlpatterns = [
    # 1. Citizen complaint submission (canonical + alias)
    path('complaints/submit/', views.submit_citizen_complaint, name='submit_complaint'),
    path('citizen/report/', views.submit_citizen_complaint, name='citizen_report'),

    # 2. Hotspots GIS predictions with drill-down filters (canonical + alias)
    path('hotspots/', views.get_prediction_hotspots, name='hotspots'),
    path('predictions/hotspots/', views.get_prediction_hotspots, name='prediction_hotspots'),

    # 3. I4C National Overview
    path('dashboard/summary/', views.get_dashboard_summary, name='dashboard_summary'),

    # 4. Bank FRM Mule Accounts (canonical + alias)
    path('mules/', views.get_bank_mules, name='bank_mules'),
    path('bank/mules/', views.get_bank_mules, name='bank_mules_alt'),

    # 5. Bank Debit Lien Enforcement (canonical + alias)
    path('mules/<str:account_id>/lien/', views.place_account_lien, name='place_lien'),
    path('bank/lien/<str:account_id>/', views.place_account_lien, name='bank_lien'),
    path('complaints/<str:complaint_id>/fast-lien/', views.fast_lien_case, name='fast_lien_case'),
    path('bank/fast-lien/<str:complaint_id>/', views.fast_lien_case, name='bank_fast_lien'),

    # 6. Incident Refund / Fund Reversal
    path('incidents/<str:account_id>/refund/', views.initiate_refund, name='initiate_refund'),
    path('api/incidents/<str:account_id>/refund/', views.initiate_refund, name='initiate_refund_legacy'),

    # 7. NLP Multilingual Parser
    path('complaints/nlp-parse/', views.parse_nlp_complaint, name='nlp_parse'),
    path('api/complaints/nlp-parse/', views.parse_nlp_complaint, name='nlp_parse_legacy'),

    # 8. Alert & Notification System (Deliverable d)
    path('notifications/', views.get_notifications, name='notifications'),
    path('notifications/beat-alert/', views.dispatch_beat_alert, name='dispatch_beat_alert'),

    # 9. Authentication Endpoints
    path('auth/citizen/send-otp/', views.send_citizen_otp, name='send_citizen_otp'),
    path('auth/citizen/verify-otp/', views.verify_citizen_otp, name='verify_citizen_otp'),
    path('auth/official/login/', views.official_login, name='official_login'),

    # 10. Citizen Case Status & Recovery Tracking (NCRP ID)
    path('complaints/status/<str:ncrp_id>/', views.get_case_status, name='case_status'),
    path('citizen/cases/<str:ncrp_id>/', views.get_case_status, name='citizen_case_status_alt'),
    path('citizen/cases/', views.get_citizen_cases, name='citizen_cases'),
]