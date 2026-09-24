from rest_framework import serializers
from .models import PredictionHotspot, ATMLocation, CyberComplaint, MuleAccount, NotificationLog, OfficialUser


class PredictionHotspotSerializer(serializers.ModelSerializer):
    atm_id = serializers.CharField(source='atm.atm_id', read_only=True)
    bank_name = serializers.CharField(source='atm.bank_name', read_only=True)
    area = serializers.CharField(source='atm.area', read_only=True)
    latitude = serializers.FloatField(source='atm.latitude', read_only=True)
    longitude = serializers.FloatField(source='atm.longitude', read_only=True)
    complaint_id = serializers.CharField(source='complaint.complaint_id', default='NCRP-SYS-GEN', read_only=True)
    time_window = serializers.CharField(source='predicted_time_window', read_only=True)
    suspect_utr = serializers.CharField(source='complaint.suspect_utr', read_only=True, default='UTR-2026-98124')
    amount_lost = serializers.DecimalField(source='complaint.amount_lost', max_digits=12, decimal_places=2, read_only=True, default=0)
    created_at = serializers.DateTimeField(read_only=True)
    fraud_type = serializers.SerializerMethodField()
    factors = serializers.SerializerMethodField()

    class Meta:
        model = PredictionHotspot
        fields = [
            'id',
            'atm_id',
            'bank_name',
            'area',
            'latitude',
            'longitude',
            'complaint_id',
            'suspect_utr',
            'amount_lost',
            'risk_score',
            'time_window',
            'fraud_type',
            'status',
            'factors',
            'recommended_action',
            'created_at',
        ]

    def get_fraud_type(self, obj):
        return obj.complaint.crime_type if obj.complaint else "UPI Fraud"

    def get_factors(self, obj):
        return {
            "previous_cases": getattr(obj, 'factor_previous_cases', 85),
            "pattern_match": getattr(obj, 'factor_pattern_match', 90),
            "time_risk": getattr(obj, 'factor_time_risk', 75),
            "proximity": getattr(obj, 'factor_proximity', 80)
        }


class MuleAccountSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='account_number', read_only=True)
    holder = serializers.CharField(source='account_holder', read_only=True)
    bank = serializers.CharField(source='bank_name', read_only=True)
    branch = serializers.CharField(read_only=True)  # No redundant source='branch'
    amount = serializers.SerializerMethodField()
    risk = serializers.IntegerField(source='risk_score', read_only=True)
    status = serializers.SerializerMethodField()
    targetATM = serializers.SerializerMethodField()
    utr = serializers.CharField(source='utr_ref', read_only=True, default='UTR-2026-98124')
    complaint_id = serializers.SerializerMethodField()
    victim_source = serializers.SerializerMethodField()

    class Meta:
        model = MuleAccount
        fields = ['id', 'holder', 'bank', 'branch', 'layer', 'amount', 'risk', 'status', 'targetATM', 'utr', 'complaint_id', 'victim_source']

    def get_complaint_id(self, obj):
        if obj.complaint:
            return obj.complaint.complaint_id
        return ""

    def get_amount(self, obj):
        val = obj.at_risk_amount or 0
        return f"₹{val:,.0f}"

    def get_status(self, obj):
        if getattr(obj, 'status', None) == 'REFUNDED':
            return 'REFUNDED'
        if obj.is_lien_placed or getattr(obj, 'status', None) == 'Lien Placed':
            return 'Lien Placed (Frozen)'
        return getattr(obj, 'status', 'Active') or 'Active'

    def get_targetATM(self, obj):
        return obj.target_atm.atm_id if obj.target_atm else "ATM-HBL-01"

    def get_victim_source(self, obj):
        c = obj.complaint
        masked_acc = getattr(c, 'victim_account_masked', None) if c else None
        if not masked_acc:
            last_digits = (abs(hash(obj.account_number)) % 9000) + 1000
            masked_acc = f"XXXX-XXXX-{last_digits}"

        holder = getattr(c, 'victim_name', None) if c else None
        if not holder:
            holder = "Ananya Sharma (Victim)"

        ifsc = getattr(c, 'victim_ifsc', None) if c else None
        if not ifsc:
            ifsc = "SBIN0040281"

        bank = getattr(c, 'victim_bank', None) if c else None
        if not bank:
            bank = "State Bank of India"

        amount_str = f"₹{float(c.amount_lost):,.0f}" if (c and c.amount_lost) else f"₹{float(obj.at_risk_amount):,.0f}"

        timestamp_str = "11 Sep 2026, 03:40 PM"
        if c and c.incident_timestamp:
            try:
                timestamp_str = c.incident_timestamp.strftime("%d %b %Y, %I:%M %p")
            except Exception:
                timestamp_str = str(c.incident_timestamp)

        return {
            "account_holder": holder,
            "masked_account": masked_acc,
            "account_number": masked_acc,
            "ifsc_code": ifsc,
            "bank_name": bank,
            "debited_amount": amount_str,
            "debited_timestamp": timestamp_str,
            "utr": obj.utr_ref or getattr(c, 'suspect_utr', 'UTR-2026-98124')
        }


class NotificationLogSerializer(serializers.ModelSerializer):
    complaint_id = serializers.CharField(source='complaint.complaint_id', read_only=True, default='')
    crime_type = serializers.CharField(source='complaint.crime_type', read_only=True, default='Cyber Financial Fraud')
    amount_lost = serializers.DecimalField(source='complaint.amount_lost', max_digits=12, decimal_places=2, read_only=True, default=0)
    suspect_utr = serializers.CharField(source='complaint.suspect_utr', read_only=True, default='')
    hotspot_atm = serializers.SerializerMethodField()
    target_bank = serializers.SerializerMethodField()
    target_area = serializers.SerializerMethodField()
    risk_score = serializers.SerializerMethodField()
    time_window = serializers.SerializerMethodField()
    sent_time = serializers.DateTimeField(source='sent_at', format='%H:%M:%S', read_only=True)

    class Meta:
        model = NotificationLog
        fields = [
            'id',
            'channel',
            'recipient_agency',
            'recipient_contact',
            'title',
            'message',
            'status',
            'complaint_id',
            'crime_type',
            'amount_lost',
            'suspect_utr',
            'hotspot_atm',
            'target_bank',
            'target_area',
            'risk_score',
            'time_window',
            'sent_at',
            'sent_time'
        ]

    def _get_hotspot(self, obj):
        if obj.hotspot:
            return obj.hotspot
        if obj.complaint:
            return obj.complaint.predictionhotspots.first()
        return None

    def get_hotspot_atm(self, obj):
        hs = self._get_hotspot(obj)
        return hs.atm.atm_id if hs and hs.atm else 'ATM-HBL-02'

    def get_target_bank(self, obj):
        hs = self._get_hotspot(obj)
        return hs.atm.bank_name if hs and hs.atm else 'HDFC Bank'

    def get_target_area(self, obj):
        hs = self._get_hotspot(obj)
        return hs.atm.area if hs and hs.atm else 'Vidyanagar, Hubballi'

    def get_risk_score(self, obj):
        hs = self._get_hotspot(obj)
        return hs.risk_score if hs else 88

    def get_time_window(self, obj):
        hs = self._get_hotspot(obj)
        return hs.predicted_time_window if hs else 'Immediate Intercept (< 45m)'


class CyberComplaintCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CyberComplaint
        fields = [
            'complaint_id',
            'crime_type',
            'amount_lost',
            'suspect_utr',
            'victim_name',
            'victim_account_masked',
            'victim_ifsc',
            'victim_bank',
            'reporting_lag_mins',
            'mule_hops',
            'incident_timestamp',
        ]
        extra_kwargs = {
            'complaint_id': {'read_only': True},
            'incident_timestamp': {'required': False},
            'suspect_utr': {'required': False},
            'victim_name': {'required': False},
            'victim_account_masked': {'required': False},
            'victim_ifsc': {'required': False},
            'victim_bank': {'required': False},
        }

    def create(self, validated_data):
        count = CyberComplaint.objects.count() + 1001
        validated_data['complaint_id'] = f"NCRP-2026-{count}"
        return super().create(validated_data)