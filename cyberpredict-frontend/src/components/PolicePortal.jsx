import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api';
import { 
  AlertCircle, 
  RefreshCw, 
  Radio, 
  ShieldCheck, 
  Filter, 
  SlidersHorizontal, 
  FileText, 
  Send, 
  MapPin, 
  Clock, 
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Target
} from 'lucide-react';
import EvidenceDossierModal from './EvidenceDossierModal';

function RecenterMap({ center, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.0 });
    }
  }, [center, map, zoom]);
  return null;
}

// Tactical High-Visibility ATM Red Alert Marker Generator
const createTacticalAlertIcon = (hotspot, isSelected, isIsolated) => {
  const isCritical = (hotspot.risk_score || 0) >= 80;
  const atmCode = hotspot.atm_id || 'ATM';
  const risk = hotspot.risk_score || 85;

  // If selected or isolated: Show prominent radar beacon with floating HUD chip
  if (isSelected || isIsolated) {
    return L.divIcon({
      className: 'bg-transparent border-0',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <!-- Smooth expanding radar wave -->
          <div class="animate-ping" style="position: absolute; width: 52px; height: 52px; border-radius: 50%; background: ${isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.35)'};"></div>
          
          <!-- Mid radar halo -->
          <div class="animate-pulse" style="position: absolute; width: 36px; height: 36px; border-radius: 50%; border: 2px solid ${isCritical ? '#f43f5e' : '#f59e0b'}; background: ${isCritical ? 'rgba(225, 29, 72, 0.25)' : 'rgba(245, 158, 11, 0.2)'};"></div>

          <!-- Core Glowing Tactical Beacon -->
          <div style="position: relative; z-index: 10; width: 26px; height: 26px; border-radius: 50%; background: ${isCritical ? '#be123c' : '#d97706'}; border: 2px solid #ffffff; box-shadow: 0 0 14px ${isCritical ? 'rgba(225, 29, 72, 0.9)' : 'rgba(217, 119, 6, 0.8)'}, 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 13px;">
            🚨
          </div>

          <!-- Floating Precision HUD Chip -->
          <div style="position: absolute; bottom: calc(100% + 4px); left: 50%; transform: translateX(-50%); white-space: nowrap; z-index: 30; pointer-events: none;">
            <div style="background: rgba(15, 23, 42, 0.94); border: 1.5px solid ${isCritical ? '#f43f5e' : '#f59e0b'}; border-radius: 9999px; padding: 3px 9px; box-shadow: 0 4px 14px rgba(0,0,0,0.35); backdrop-filter: blur(8px); display: flex; align-items: center; gap: 5px;">
              <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; font-size: 11px; font-weight: 800; color: #ffffff; letter-spacing: 0.3px;">${atmCode}</span>
              <span style="color: #64748b; font-size: 10px;">•</span>
              <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; font-size: 10px; font-weight: 900; color: #ffffff; background: ${isCritical ? '#e11d48' : '#d97706'}; padding: 1px 5px; border-radius: 4px;">${risk}% THREAT</span>
            </div>
            <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 4px solid ${isCritical ? '#f43f5e' : '#f59e0b'}; margin: 0 auto;"></div>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -28]
    });
  }

  // Overview mode (all hotspots): Clean, non-cluttering glowing radar blip
  return L.divIcon({
    className: 'bg-transparent border-0',
    html: `
      <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="position: absolute; width: 20px; height: 20px; border-radius: 50%; background: ${isCritical ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.25)'};"></div>
        <div style="position: relative; z-index: 5; width: 12px; height: 12px; border-radius: 50%; background: ${isCritical ? '#e11d48' : '#d97706'}; border: 2px solid #ffffff; box-shadow: 0 0 6px ${isCritical ? 'rgba(225, 29, 72, 0.7)' : 'rgba(217, 119, 6, 0.6)'};"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14]
  });
};

// Tactical Web Audio Chime Generator
const playTacticalChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6 note
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Audio Context might be restricted before first gesture
  }
};

const formatRecency = (isoDate) => {
  if (!isoDate) return 'Just now';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function PolicePortal({ triggerAlert }) {
  const [hotspots, setHotspots] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isolateSelectedCase, setIsolateSelectedCase] = useState(false);

  // Real-Time Newly Arrived Complaints Notifications State
  const [incomingAlerts, setIncomingAlerts] = useState([]);
  const [isAlertsCollapsed, setIsAlertsCollapsed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const seenComplaintIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  // Drill-Down Filter States (Deliverable b)
  const [crimeTypeFilter, setCrimeTypeFilter] = useState('All');
  const [timeWindowFilter, setTimeWindowFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All');
  const [minRiskFilter, setMinRiskFilter] = useState(0);

  const handleCopy = (text, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Fetch Hotspots
  const fetchHotspots = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (crimeTypeFilter !== 'All') params.crime_type = crimeTypeFilter;
      if (timeWindowFilter !== 'All') params.time_window = timeWindowFilter;
      if (areaFilter !== 'All') params.area = areaFilter;
      if (minRiskFilter > 0) params.min_risk = minRiskFilter;

      const res = await api.getHotspots(params);
      const data = res.data || [];
      setHotspots(data);

      if (data.length > 0) {
        setSelectedHotspot((curr) => {
          if (curr) {
            const match = data.find((h) => h.complaint_id === curr.complaint_id || h.atm_id === curr.atm_id);
            return match || data[0];
          }
          return data[0];
        });
      } else {
        setSelectedHotspot(null);
      }
    } catch (err) {
      console.error('Failed to fetch hotspots:', err);
    } finally {
      setLoading(false);
    }
  }, [crimeTypeFilter, timeWindowFilter, areaFilter, minRiskFilter]);

  // 2. Fetch Live Newly Arrived Complaints Notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.getNotifications({ agency: 'LEA_POLICE' });
      const data = res.data || [];

      // Filter and deduplicate to distinct complaint records
      const distinct = [];
      const seen = new Set();
      for (const n of data) {
        if (n.complaint_id && !seen.has(n.complaint_id)) {
          seen.add(n.complaint_id);
          distinct.push(n);
        }
      }
      setIncomingAlerts(distinct);

      const currentIds = new Set(distinct.map((n) => n.complaint_id));
      if (isInitialLoadRef.current) {
        seenComplaintIdsRef.current = currentIds;
        isInitialLoadRef.current = false;
      } else {
        const brandNew = distinct.filter((n) => !seenComplaintIdsRef.current.has(n.complaint_id));
        if (brandNew.length > 0) {
          if (soundEnabled) playTacticalChime();
          const latest = brandNew[0];
          if (triggerAlert) {
            triggerAlert(
              'critical',
              `🚨 NEW COMPLAINT ARRIVED: ${latest.complaint_id}`,
              `${latest.crime_type} (₹${Number(latest.amount_lost || 0).toLocaleString('en-IN')}) reported. Target: ${latest.hotspot_atm} (${latest.target_area}). Threat: ${latest.risk_score}%.`,
              8000
            );
          }
          brandNew.forEach((n) => seenComplaintIdsRef.current.add(n.complaint_id));
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [soundEnabled, triggerAlert]);

  // Polling Interval
  useEffect(() => {
    fetchHotspots();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchHotspots();
      fetchNotifications();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchHotspots, fetchNotifications]);

  // Dynamic In-Memory Filter for Instant Zero-Latency UI Response
  const displayedHotspots = hotspots.filter((h) => {
    if (minRiskFilter > 0 && (h.risk_score || 0) < minRiskFilter) return false;
    return true;
  });

  // Map Alert Hotspots: If a case is isolated, show only alert marks related to the selected case's ATM / complaint
  const mapHotspots = (isolateSelectedCase && selectedHotspot)
    ? displayedHotspots.filter((h) => 
        h.atm_id === selectedHotspot.atm_id || 
        (h.complaint_id && selectedHotspot.complaint_id && h.complaint_id === selectedHotspot.complaint_id)
      )
    : displayedHotspots;

  const effectiveMapHotspots = mapHotspots.length > 0 ? mapHotspots : (selectedHotspot ? [selectedHotspot] : []);

  // Keep selectedHotspot synchronized with active filtered targets
  useEffect(() => {
    if (displayedHotspots.length > 0) {
      if (!selectedHotspot || !displayedHotspots.some((h) => (h.complaint_id && h.complaint_id === selectedHotspot.complaint_id) || h.atm_id === selectedHotspot.atm_id)) {
        setSelectedHotspot(displayedHotspots[0]);
      }
    } else {
      setSelectedHotspot(null);
    }
  }, [displayedHotspots, selectedHotspot]);

  const handleResetFilters = () => {
    setCrimeTypeFilter('All');
    setTimeWindowFilter('All');
    setAreaFilter('All');
    setMinRiskFilter(0);
    setIsolateSelectedCase(false);
  };

  const handleDispatchBeat = async (customAtmId, customComplaintId) => {
    const targetAtm = customAtmId || selectedHotspot?.atm_id;
    const targetComplaint = customComplaintId || selectedHotspot?.complaint_id || 'NCRP-EMERGENCY';
    if (!targetAtm) return;

    setIsDispatching(true);
    try {
      await api.dispatchBeatAlert({
        atm_id: targetAtm,
        complaint_id: targetComplaint
      });
      if (triggerAlert) {
        triggerAlert(
          'critical',
          '🚨 BEAT PATROL DISPATCHED',
          `Tactical mobile PCR units vectored to ${targetAtm}. CCTV preservation signal sent.`,
          7000
        );
      }
      fetchNotifications();
      fetchHotspots();
    } catch (err) {
      if (triggerAlert) {
        triggerAlert('warning', 'Dispatch Warning', 'Alert recorded locally for field units.');
      }
    } finally {
      setIsDispatching(false);
    }
  };

  const handleFocusAtm = (targetAtmId, complaintId) => {
    const matched = hotspots.find((h) => (complaintId && h.complaint_id === complaintId) || h.atm_id === targetAtmId);
    if (matched) {
      setSelectedHotspot(matched);
      setIsolateSelectedCase(true);
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }
  };

  const handleOpenDossierForAlert = (alertItem) => {
    const matched = hotspots.find((h) => h.complaint_id === alertItem.complaint_id || h.atm_id === alertItem.hotspot_atm);
    if (matched) {
      setSelectedHotspot(matched);
      setIsolateSelectedCase(true);
    } else {
      setSelectedHotspot({
        atm_id: alertItem.hotspot_atm || 'ATM-HBL-02',
        bank_name: alertItem.target_bank || 'HDFC Bank',
        area: alertItem.target_area || 'Vidyanagar, Hubballi',
        latitude: 15.3688,
        longitude: 75.1235,
        complaint_id: alertItem.complaint_id,
        suspect_utr: alertItem.suspect_utr,
        risk_score: alertItem.risk_score || 88,
        time_window: alertItem.time_window || 'Immediate Intercept',
        fraud_type: alertItem.crime_type,
        factors: {
          previous_cases: 85,
          pattern_match: 90,
          time_risk: 75,
          proximity: 80
        },
        recommended_action: 'Deploy tactical intercept unit immediately.'
      });
    }
    setIsDossierOpen(true);
  };

  // Top 4 latest distinct newly arrived complaints
  const latestAlerts = incomingAlerts.slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Evidence Dossier Modal */}
      {isDossierOpen && (
        <EvidenceDossierModal
          hotspot={selectedHotspot}
          onClose={() => setIsDossierOpen(false)}
          triggerAlert={triggerAlert}
        />
      )}

      {/* Top Banner */}
      <div className="cyber-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-black text-slate-900 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
              <Radio className="animate-pulse" size={20} />
            </span>
            Law Enforcement Agency (LEA) Tactical Patrol Grid
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            GIS-Enabled Predictive ATM Cash-Out Risk Engine • Proactive Field Interception to Safeguard Citizen Assets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700 text-xs font-bold font-mono">
            <ShieldCheck size={15} className="text-indigo-600" />
            <span>Protecting Victims & Blocking Exfiltration</span>
          </div>
          <button
            onClick={() => {
              fetchHotspots();
              fetchNotifications();
            }}
            className="btn-secondary px-3.5 py-2 text-xs font-heading font-bold flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REAL-TIME NOTIFICATION ALERT SECTION FOR NEWLY ARRIVED COMPLAINTS         */}
      {/* ========================================================================= */}
      <div className="cyber-card border-2 border-rose-300/80 bg-gradient-to-r from-rose-50/70 via-white to-amber-50/40 p-4 sm:p-5 shadow-sm relative overflow-hidden">
        {/* Tactical Crosshairs */}
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-rose-200/80">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-heading font-black text-slate-900 tracking-wide uppercase flex items-center gap-1.5">
                  <span>🚨 LIVE NCRP INTAKE RADAR</span>
                  <span className="text-slate-400 font-normal">|</span>
                  <span className="text-rose-700">Newly Arrived Complaints</span>
                </h3>
                <span className="hidden lg:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 rounded-md">
                  REAL-TIME CFCFRMS INGESTION
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Live multi-channel notification stream • Auto-predicting withdrawal ATM vectors within the Golden Hour
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Audible Alert Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Tactical Audio Chime ON (Click to mute)' : 'Tactical Audio Chime MUTED (Click to enable)'}
              className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              }`}
            >
             
            </button>

            {/* Expand / Collapse Button */}
            <button
              onClick={() => setIsAlertsCollapsed(!isAlertsCollapsed)}
              className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-heading font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span className="font-mono text-[11px] font-bold">
                {isAlertsCollapsed ? 'Expand Alerts' : 'Collapse'}
              </span>
              {isAlertsCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {/* Collapsed Bar State */}
        {isAlertsCollapsed ? (
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-700 gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-medium">
                Radar active: <strong>{incomingAlerts.length} newly arrived complaints</strong> monitored on the field grid.
              </span>
              {latestAlerts[0] && (
                <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-bold hidden md:inline">
                  Latest: {latestAlerts[0].complaint_id} ({latestAlerts[0].crime_type})
                </span>
              )}
            </div>
            <button
              onClick={() => setIsAlertsCollapsed(false)}
              className="text-indigo-600 hover:underline font-bold text-xs cursor-pointer self-start sm:self-auto"
            >
              Expand newly arrived complaint cards &rarr;
            </button>
          </div>
        ) : (
          /* Expanded Active Alert Cards Grid */
          <div className="pt-3.5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {latestAlerts.map((item) => {
                const isCritical = (item.risk_score || 0) >= 80;
                const targetAtm = item.hotspot_atm || 'ATM-HBL-02';
                const targetArea = item.target_area || 'Vidyanagar, Hubballi';
                const targetBank = item.target_bank || 'HDFC Bank';

                return (
                  <div
                    key={item.complaint_id}
                    className="bg-white rounded-xl border border-rose-200 p-3.5 shadow-2xs hover:shadow-sm transition hover:border-rose-300 flex flex-col justify-between gap-3 relative"
                  >
                    {/* Top Row: Case ID, Recency & Threat Badge */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {item.complaint_id}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(item.complaint_id, e)}
                            title="Copy NCRP ID"
                            className="text-slate-400 hover:text-indigo-600 transition cursor-pointer p-0.5"
                          >
                            {copiedId === item.complaint_id ? (
                              <Check size={13} className="text-emerald-600 font-bold" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                          <Clock size={10} />
                          <span>{formatRecency(item.sent_at)}</span>
                        </span>
                      </div>

                      {/* Crime Category & Debited Amount */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {item.crime_type}
                        </span>
                        <span className="font-mono text-xs font-black text-slate-900">
                          ₹{Number(item.amount_lost || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Forecasted Cashout Terminal */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                            FORECASTED CASHOUT ATM
                          </span>
                          <span
                            className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded ${
                              isCritical ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.risk_score}% Threat
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 text-xs">
                          {targetAtm} • <span className="font-medium text-slate-600">{targetBank}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{targetArea}</p>
                        <div className="pt-1 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500">Window:</span>
                          <span className="font-mono font-bold text-amber-700">
                            {item.time_window || 'Immediate Intercept'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Tactical Action Triggers */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => handleFocusAtm(targetAtm, item.complaint_id)}
                        className="btn-secondary py-1.5 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        title="Focus on GIS Map"
                      >
                        <Target size={12} className="text-indigo-600" />
                        <span>Focus</span>
                      </button>

                      <button
                        onClick={() => handleDispatchBeat(targetAtm, item.complaint_id)}
                        disabled={isDispatching}
                        className="py-1.5 text-[11px] font-bold rounded-xl border bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-2xs flex items-center justify-center gap-1 cursor-pointer transition"
                        title="Vector Beat Patrol"
                      >
                        <Send size={12} className={isDispatching ? 'animate-ping' : ''} />
                        <span>Vector</span>
                      </button>

                      <button
                        onClick={() => handleOpenDossierForAlert(item)}
                        className="btn-secondary py-1.5 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        title="Inspect Official Evidence Dossier"
                      >
                        <FileText size={12} className="text-indigo-600" />
                        <span>Dossier</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Drill-Down Filter Toolbar (Deliverable b) */}
      <div className="cyber-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
            <Filter size={15} className="text-indigo-600" />
            <span>GIS Drill-Down Intelligence Filters</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-indigo-600 transition cursor-pointer font-semibold"
          >
            <RotateCcw size={12} /> Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Crime Category */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Crime Category</label>
            <select
              value={crimeTypeFilter}
              onChange={(e) => setCrimeTypeFilter(e.target.value)}
              className="w-full bg-white text-slate-800 font-medium rounded-lg px-2 py-1 outline-none border border-slate-200 text-xs cursor-pointer focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Categories (Global)</option>
              <option value="UPI Fraud">UPI Fraud</option>
              <option value="Investment Scam">Investment Scam</option>
              <option value="Job Scam">Job Scam</option>
              <option value="Card Fraud">Card Fraud</option>
              <option value="Phishing">Phishing</option>
            </select>
          </div>

          {/* 2. Tactical Time Window */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tactical Time Window</label>
            <select
              value={timeWindowFilter}
              onChange={(e) => setTimeWindowFilter(e.target.value)}
              className="w-full bg-white text-slate-800 font-medium rounded-lg px-2 py-1 outline-none border border-slate-200 text-xs cursor-pointer focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Time Windows</option>
              <option value="Immediate">Immediate Intercept (&lt; 45m)</option>
              <option value="Hour">Within 1 - 2 Hours</option>
              <option value="Batch">Batch Extraction (19:00 - 22:00)</option>
            </select>
          </div>

          {/* 3. Location / Sector */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Area / Jurisdiction</label>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full bg-white text-slate-800 font-medium rounded-lg px-2 py-1 outline-none border border-slate-200 text-xs cursor-pointer focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Jurisdictions</option>
              <option value="Hubballi">Hubballi Sector</option>
              <option value="Dharwad">Dharwad Sector</option>
            </select>
          </div>

          {/* 4. Minimum Threat Score Dropdown */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Min Risk Score</label>
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                ≥ {minRiskFilter}%
              </span>
            </div>
            <select
              value={minRiskFilter}
              onChange={(e) => setMinRiskFilter(Number(e.target.value))}
              className="w-full bg-white text-slate-800 font-medium rounded-lg px-2 py-1 outline-none border border-slate-200 text-xs cursor-pointer focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
            >
              <option value={0}>All Risk Levels (≥ 0%)</option>
              <option value={50}>Moderate & Above (≥ 50%)</option>
              <option value={70}>High Alert (≥ 70%)</option>
              <option value={80}>Severe Threat (≥ 80%)</option>
              <option value={90}>Urgent Tactical (≥ 90%)</option>
              <option value={95}>Critical Intercept Only (≥ 95%)</option>
            </select>
          </div>
        </div>

        {/* Min Risk Score Quick Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-200/90">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 font-heading">
              Min Risk Score Buttons:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: 'All Hotspots (≥0%)', value: 0 },
              { label: 'Moderate (≥50%)', value: 50 },
              { label: 'High (≥70%)', value: 70 },
              { label: 'Severe (≥80%)', value: 80 },
              { label: 'Urgent (≥90%)', value: 90 },
              { label: 'Critical (≥95%)', value: 95 },
            ].map((btn) => {
              const isActive = minRiskFilter === btn.value;
              return (
                <button
                  key={btn.value}
                  type="button"
                  onClick={() => setMinRiskFilter(btn.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition cursor-pointer border shadow-2xs flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/70 hover:text-indigo-900'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive
                        ? 'bg-white'
                        : btn.value >= 90
                        ? 'bg-rose-500'
                        : btn.value >= 70
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono font-bold text-slate-600 flex items-center gap-1">
            <span>Filter Applied:</span>
            <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 font-black">
              ≥ {minRiskFilter}% Threat
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Map & Hotspot Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Leaflet GIS Map & Active Interception Queue */}
        <div className="lg:col-span-2 space-y-4">
          {/* Leaflet Map with Futuristic Tactical HUD Styling */}
          <div className="h-96 w-full bg-slate-100 border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs relative z-0">
            {/* Tactical HUD Corner Crosshairs */}
            <div className="hud-corner-tl z-20" />
            <div className="hud-corner-tr z-20" />
            <div className="hud-corner-bl z-20" />
            <div className="hud-corner-br z-20" />

            {/* Tactical Coordinates & Beat Unit Telemetry Overlay */}
            <div className="absolute top-3 right-3 z-[1000] hidden sm:flex items-center gap-2.5 bg-white/95 border border-slate-200/90 px-3 py-1.5 rounded-xl text-[10px] font-mono text-slate-600 backdrop-blur-md shadow-xs">
              <span className="text-indigo-700 font-bold">LAT: {selectedHotspot?.latitude?.toFixed(4) || '15.3688'}° N</span>
              <span className="text-slate-300">|</span>
              <span className="text-indigo-700 font-bold">LON: {selectedHotspot?.longitude?.toFixed(4) || '75.1235'}° E</span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> 4 PCR UNITS VECTORED
              </span>
            </div>

            {/* Tactical Map Mode & Case Isolation HUD Banner */}
            <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 max-w-[80%]">
              {isolateSelectedCase && selectedHotspot ? (
                <div className="flex items-center gap-2 bg-slate-900/95 text-white border-2 border-rose-500/90 px-3 py-1.5 rounded-xl text-xs backdrop-blur-md shadow-xl font-mono">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-80" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
                  </span>
                  <span className="font-bold text-rose-300 hidden md:inline">
                    🚨 CASE ALERT ISOLATED:
                  </span>
                  <span className="font-black text-white bg-rose-600 px-2 py-0.5 rounded shadow-xs">
                    {selectedHotspot.complaint_id || 'NCRP CASE'}
                  </span>
                  <span className="text-slate-400 font-sans hidden sm:inline">→</span>
                  <span className="font-black text-amber-300 bg-black/40 px-1.5 py-0.5 rounded">
                    {selectedHotspot.atm_id} ({selectedHotspot.risk_score}% Threat)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsolateSelectedCase(false)}
                    className="ml-2 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-[11px] font-sans font-bold transition shadow-md cursor-pointer flex items-center gap-1"
                    title="Show all active patrol grid hotspots"
                  >
                    <span>🌐 Show All Hotspots ({displayedHotspots.length})</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-slate-900/90 text-white border border-slate-700 px-3 py-1.5 rounded-xl text-xs backdrop-blur-md shadow-lg font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-200">
                    PATROL GRID: <strong>{displayedHotspots.length} Alerts Active</strong>
                  </span>
                  {selectedHotspot && (
                    <button
                      type="button"
                      onClick={() => setIsolateSelectedCase(true)}
                      className="ml-2 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-sans font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                      title="Isolate alert for selected case"
                    >
                      <span>🎯 Isolate Alert for {selectedHotspot.complaint_id || selectedHotspot.atm_id}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {effectiveMapHotspots.length > 0 ? (
              <MapContainer
                center={[effectiveMapHotspots[0].latitude || 15.3688, effectiveMapHotspots[0].longitude || 75.1235]}
                zoom={isolateSelectedCase ? 14 : 12}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {selectedHotspot && (
                  <RecenterMap center={[selectedHotspot.latitude, selectedHotspot.longitude]} zoom={isolateSelectedCase ? 14 : 13} />
                )}

                {effectiveMapHotspots.map((h, idx) => {
                  const isSelected = selectedHotspot?.complaint_id === h.complaint_id && selectedHotspot?.atm_id === h.atm_id;
                  const isCritical = (h.risk_score || 0) >= 80;

                  return (
                    <Marker
                      key={h.complaint_id ? `${h.complaint_id}-${idx}` : `${h.atm_id}-${idx}`}
                      position={[h.latitude, h.longitude]}
                      icon={createTacticalAlertIcon(h, isSelected, isolateSelectedCase)}
                      eventHandlers={{
                        click: () => {
                          setSelectedHotspot(h);
                          if (triggerAlert) {
                            triggerAlert(
                              isCritical ? 'critical' : 'warning',
                              `Target Focused: ${h.atm_id}`,
                              `Flagged ${h.risk_score}% threat in ${h.area}. Linked to ${h.complaint_id || 'NCRP complaint'}.`
                            );
                          }
                        },
                      }}
                    >
                      <Popup>
                        <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }} className="p-2 min-w-[230px] text-slate-900 space-y-2">
                          <div className="flex items-center justify-between border-b border-rose-200 pb-1.5">
                            <span className="text-[11px] font-mono font-black text-rose-700 uppercase flex items-center gap-1">
                              <span className="animate-pulse">🚨</span> ATM CASHOUT RED ALERT
                            </span>
                            <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded text-white ${isCritical ? 'bg-rose-600' : 'bg-amber-600'}`}>
                              {h.risk_score}% THREAT
                            </span>
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-950 flex items-center gap-1">
                              <span>{h.atm_id}</span>
                              <span className="text-slate-400 font-normal">•</span>
                              <span className="text-slate-700 font-semibold">{h.bank_name}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">{h.area}</p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Case ID:</span>
                              <span className="font-mono font-bold text-indigo-700">{h.complaint_id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Modus:</span>
                              <span className="font-bold text-slate-800">{h.fraud_type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Loss Amount:</span>
                              <span className="font-mono font-bold text-slate-900">₹{Number(h.amount_lost || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Tactical Window:</span>
                              <span className="font-mono font-bold text-amber-700">{h.time_window || 'Immediate Intercept'}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDispatchBeat(h.atm_id, h.complaint_id)}
                            className="w-full py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 mt-1 transition"
                          >
                            <span>🚨 Vector Beat Patrol Unit</span>
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                {loading ? 'Synchronizing GIS Coordinates...' : 'No hotspots match current drill-down filters.'}
              </div>
            )}
          </div>

          {/* Tactical Hotspot Cards List */}
          <div className="cyber-card overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>🚨</span> Tactical Interception Queue ({displayedHotspots.length} Active Targets)
                </h3>
                <p className="text-slate-500 text-[11px]">Ranked by Threat Severity & Modus Operandi</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                LIVE NCRP SYNC
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {displayedHotspots.map((item, idx) => {
                const isSelected = selectedHotspot?.complaint_id === item.complaint_id && selectedHotspot?.atm_id === item.atm_id;
                const isCritical = (item.risk_score || 0) >= 80;

                return (
                  <div
                    key={item.complaint_id ? `${item.complaint_id}-${idx}` : `${item.atm_id}-${idx}`}
                    onClick={() => {
                      setSelectedHotspot(item);
                      setIsolateSelectedCase(true);
                    }}
                    className={`p-3.5 flex items-center justify-between gap-4 cursor-pointer transition ${
                      isSelected
                        ? 'bg-rose-50/80 border-l-4 border-rose-600 shadow-xs ring-1 ring-rose-200/80'
                        : 'hover:bg-slate-50/80 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl font-mono text-xs font-bold flex flex-col items-center justify-center min-w-[50px] border ${
                          isCritical
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <span>{item.risk_score}%</span>
                        <span className="text-[10px] uppercase font-bold tracking-tight">
                          {isCritical ? 'CRITICAL' : 'MED'}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{item.atm_id}</span>
                          <span className="text-slate-300 font-normal">•</span>
                          <span className="text-slate-700 text-xs font-medium">{item.bank_name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                            {item.fraud_type}  
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                            {item.complaint_id}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin size={11} className="text-indigo-500" />
                            <span>{item.area}</span>
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            <Clock size={10} />
                            <span>{item.time_window}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected && isolateSelectedCase ? (
                        <span className="text-[10px] font-mono font-black text-rose-700 bg-rose-100/90 border border-rose-300 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                          <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                          <span>MAP ALERT ACTIVE</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition">
                          <span>Isolate Map Alert</span> &rarr;
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Interception Target Intelligence & Action Directives */}
        <div className="cyber-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-rose-600" size={18} />
              <h3 className="font-heading font-black text-sm text-slate-900 uppercase">
                Interception Target Intelligence
              </h3>
            </div>
            {selectedHotspot && (
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${
                  (selectedHotspot.risk_score || 0) >= 80
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {selectedHotspot.risk_score}% Cashout Threat
              </span>
            )}
          </div>

          {selectedHotspot ? (
            <div className="space-y-4">
              {/* Target Terminal Box */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">TARGET ATM TERMINAL</span>
                <p className="text-sm font-bold text-slate-900">
                  {selectedHotspot.atm_id} — {selectedHotspot.bank_name}
                </p>
                <p className="text-xs text-slate-600 font-medium">{selectedHotspot.area}</p>
                <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Tactical Window:</span>
                  <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {selectedHotspot.time_window}
                  </span>
                </div>
              </div>

              {/* Explainable AI Decision Weights */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block font-mono">
                  XAI Feature Attribution Weights
                </span>
                {selectedHotspot.factors &&
                  Object.entries(selectedHotspot.factors).map(([key, val]) => (
                        <div key={key}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600 capitalize font-medium">{key.replace('_', ' ')}</span>
                            <span className="font-bold text-slate-900 font-mono">{val}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/60">
                            <div
                              className="bg-gradient-to-r from-rose-500 to-indigo-600 h-1.5 rounded-full"
                              style={{ width: `${val}%` }}
                            />
                          </div>
                        </div>
                      ))}
              </div>

              {/* Tactical SOP Directives */}
              <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block mb-1">
                  TACTICAL SOP RECOMMENDATION
                </span>
                <p className="text-xs text-rose-900 leading-relaxed font-medium">
                  {selectedHotspot.recommended_action}
                </p>
              </div>

              {/* Dual Action Buttons: Dispatch Beat Patrol + Open Evidence Dossier (Deliverables c & d) */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleDispatchBeat()}
                  disabled={isDispatching}
                  className="btn-cyber-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Send size={14} className={isDispatching ? 'animate-ping' : ''} />
                  <span>{isDispatching ? 'Transmitting Beat Vector...' : 'Broadcast PCR Beat Vector'}</span>
                </button>

                <button
                  onClick={() => setIsDossierOpen(true)}
                  className="btn-secondary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <FileText size={14} className="text-indigo-600" />
                  <span>Inspect Official Evidence Dossier</span>
                </button>

                {/* Active Beat Patrol Units Status Strip */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>ACTIVE VECTORS:</span>
                  <div className="flex gap-1">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold border border-slate-200">PCR-04</span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold border border-slate-200">PCR-09</span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold border border-slate-200">PCR-12</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">Select any ATM marker to inspect decision weights.</p>
          )}
        </div>
      </div>
    </div>
  );
}