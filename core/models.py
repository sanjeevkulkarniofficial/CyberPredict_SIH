from django.db import models
from django.utils import timezone


class OfficialUser(models.Model):
    ROLE_CHOICES = [
        ('I4C_ADMIN', 'I4C Admin'),
        ('LEA_OFFICER', 'LEA Police Officer'),
        ('BANK_NODAL', 'Bank Nodal Officer'),
    ]

    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    full_name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    organization = models.CharField(max_length=150)  # e.g., "Hubballi Police Station", "HDFC Bank FRM", "I4C HQ"
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.role}) - {self.organization}"


class CyberComplaint(models.Model):
    FRAUD_CHOICES = [
        ('UPI Fraud', 'UPI Fraud'),
        ('Card Fraud', 'Card Fraud'),
        ('Phishing', 'Phishing'),
        ('Investment Scam', 'Investment Scam'),
        ('Job Scam', 'Job Scam'),
    ]

    complaint_id = models.CharField(max_length=64, unique=True, blank=True)
    crime_type = models.CharField(max_length=50, choices=FRAUD_CHOICES, default='UPI Fraud')
    amount_lost = models.DecimalField(max_digits=12, decimal_places=2)
    suspect_utr = models.CharField(max_length=100, default='UTR-2026-98124', blank=True, help_text="Transaction Reference or UPI UTR Number")
    victim_name = models.CharField(max_length=120, default='Ananya Sharma (Victim)', blank=True, help_text="Complainant / Account Holder Name")
    victim_account_masked = models.CharField(max_length=50, default='XXXX-XXXX-9842', blank=True, help_text="Debited Account Number (Masked)")
    victim_ifsc = models.CharField(max_length=20, default='SBIN0040281', blank=True, help_text="Originating Bank Branch IFSC")
    victim_bank = models.CharField(max_length=100, default='State Bank of India', blank=True, help_text="Originating Bank Name")
    reporting_lag_mins = models.IntegerField(default=20, help_text="Minutes between fraud and complaint filing")
    mule_hops = models.IntegerField(default=2, help_text="Number of intermediary accounts traversed")
    incident_timestamp = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.complaint_id} - {self.crime_type} (₹{self.amount_lost})"


class ATMLocation(models.Model):
    atm_id = models.CharField(max_length=32, unique=True)
    bank_name = models.CharField(max_length=100)
    area = models.CharField(max_length=150)
    latitude = models.FloatField()
    longitude = models.FloatField()
    dist_to_mule_branch_km = models.FloatField(default=0.5)
    past_fraud_cases = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.atm_id} - {self.bank_name} ({self.area})"


class PredictionHotspot(models.Model):
    STATUS_CHOICES = [
        ('High', 'High'),
        ('Medium', 'Medium'),
        ('Low', 'Low'),
    ]

    atm = models.ForeignKey(ATMLocation, on_delete=models.CASCADE, related_name="predictionhotspots")
    complaint = models.ForeignKey(CyberComplaint, on_delete=models.SET_NULL, null=True, blank=True, related_name="predictionhotspots")
    risk_score = models.IntegerField(help_text="Predicted cashout probability percentage (0-100)")
    predicted_time_window = models.CharField(max_length=80, default="18:00 - 21:00")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='High')
    recommended_action = models.TextField()

    # Explainable AI (XAI) feature attribution drivers
    factor_previous_cases = models.IntegerField(default=85)
    factor_pattern_match = models.IntegerField(default=90)
    factor_time_risk = models.IntegerField(default=75)
    factor_proximity = models.IntegerField(default=80)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Hotspot: {self.atm.atm_id} | Score: {self.risk_score}%"


class MuleAccount(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Lien Placed', 'Lien Placed (Frozen)'),
        ('REFUNDED', 'Refunded to Citizen'),
    ]

    account_number = models.CharField(max_length=50, unique=True)
    account_holder = models.CharField(max_length=100)
    bank_name = models.CharField(max_length=100)
    branch = models.CharField(max_length=100)
    layer = models.IntegerField(default=1, help_text="Mule Layer (e.g. 1, 2, 3)")
    utr_ref = models.CharField(max_length=100, default='UTR-2026-98124', blank=True, help_text="CFCFRMS Downstream UTR Trace")
    at_risk_amount = models.DecimalField(max_digits=12, decimal_places=2)
    target_atm = models.ForeignKey(ATMLocation, on_delete=models.CASCADE, related_name="mule_accounts")
    risk_score = models.IntegerField(default=85)
    is_lien_placed = models.BooleanField(default=False)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Active')
    complaint = models.ForeignKey(CyberComplaint, on_delete=models.SET_NULL, null=True, blank=True, related_name="mule_accounts")
    refund_reference = models.CharField(max_length=64, blank=True, null=True)
    refunded_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.account_number} ({self.account_holder}) - Layer {self.layer} [{self.status}]"


class Incident(models.Model):
    ncrp_id = models.CharField(max_length=50, unique=True)
    citizen_phone = models.CharField(max_length=15)
    suspect_utr = models.CharField(max_length=100, default='UTR-2026-98124', blank=True)
    victim_name = models.CharField(max_length=120, default='Ananya Sharma (Victim)', blank=True)
    victim_account_masked = models.CharField(max_length=50, default='XXXX-XXXX-9842', blank=True)
    victim_ifsc = models.CharField(max_length=20, default='SBIN0040281', blank=True)
    victim_bank = models.CharField(max_length=100, default='State Bank of India', blank=True)
    amount_lost = models.DecimalField(max_digits=12, decimal_places=2)
    reporting_lag = models.IntegerField()
    mule_hops = models.IntegerField()
    threat_score = models.IntegerField()

    STATUS_CHOICES = [
        ('LOGGED', 'Complaint Logged'),
        ('FROZEN', 'Lien Placed / Frozen'),
        ('REFUND_PENDING', 'Pending Court/Bank Clearance'),
        ('REFUNDED', 'Money Credited to Victim'),
    ]
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='LOGGED')
    refund_reference_id = models.CharField(max_length=50, blank=True, null=True)
    refunded_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.ncrp_id} - {self.status}"


class NotificationLog(models.Model):
    CHANNEL_CHOICES = [
        ('SMS', 'SMS Gateway'),
        ('EMAIL', 'Email Alert'),
        ('API_WEBHOOK', 'LEA / Bank Webhook'),
        ('DASHBOARD', 'Dashboard Trigger'),
    ]
    RECIPIENT_CHOICES = [
        ('LEA_POLICE', 'Law Enforcement Agency'),
        ('BANK_NODAL', 'Bank FRM Desk'),
        ('I4C_ADMIN', 'I4C Command Matrix'),
    ]
    STATUS_CHOICES = [
        ('DELIVERED', 'Delivered'),
        ('SENT', 'Sent'),
        ('TRIGGERED', 'Triggered'),
        ('FAILED', 'Failed'),
    ]

    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    recipient_agency = models.CharField(max_length=30, choices=RECIPIENT_CHOICES)
    recipient_contact = models.CharField(max_length=150, default='All Registered Units')
    title = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DELIVERED')
    complaint = models.ForeignKey(CyberComplaint, on_delete=models.SET_NULL, null=True, blank=True)
    hotspot = models.ForeignKey(PredictionHotspot, on_delete=models.SET_NULL, null=True, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.channel}] -> {self.recipient_agency}: {self.title} ({self.status})"