from django.contrib import admin
from .models import CyberComplaint, ATMLocation, PredictionHotspot, MuleAccount, NotificationLog, OfficialUser

@admin.register(OfficialUser)
class OfficialUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'role', 'organization', 'is_active', 'created_at')
    search_fields = ('email', 'full_name', 'organization')
    list_filter = ('role', 'is_active')

@admin.register(CyberComplaint)
class CyberComplaintAdmin(admin.ModelAdmin):
    list_display = ('complaint_id', 'crime_type', 'amount_lost', 'reporting_lag_mins', 'incident_timestamp')
    search_fields = ('complaint_id', 'crime_type')

@admin.register(ATMLocation)
class ATMLocationAdmin(admin.ModelAdmin):
    list_display = ('atm_id', 'bank_name', 'area', 'dist_to_mule_branch_km', 'past_fraud_cases')
    search_fields = ('atm_id', 'bank_name', 'area')

@admin.register(PredictionHotspot)
class PredictionHotspotAdmin(admin.ModelAdmin):
    list_display = ('atm', 'complaint', 'risk_score', 'status', 'predicted_time_window')
    list_filter = ('status',)

@admin.register(MuleAccount)
class MuleAccountAdmin(admin.ModelAdmin):
    list_display = ('account_number', 'account_holder', 'bank_name', 'at_risk_amount', 'risk_score', 'status', 'is_lien_placed')
    list_filter = ('status', 'is_lien_placed', 'bank_name')

@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ('channel', 'recipient_agency', 'title', 'status', 'sent_at')
    list_filter = ('channel', 'recipient_agency', 'status')
    