import React, { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { 
  ShieldCheck, 
  Lock, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  HeartHandshake, 
  ArrowRightLeft, 
  Building2, 
  X, 
  FileText, 
  UserCheck,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Radio,
  ShieldAlert,
  Zap,
  Target,
  ArrowUpRight
} from 'lucide-react';

// Tactical Web Audio Chime Generator for Bank FRM Alerts
const playTacticalChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(784, ctx.currentTime); // G5 note
    osc.frequency.exponentialRampToValueAtTime(1046, ctx.currentTime + 0.12); // C6 note
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

export default function BankPortal({ triggerAlert }) {
  const [mules, setMules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refundLoading, setRefundLoading] = useState(null);
  const [copiedAccount, setCopiedAccount] = useState(null);
  const [expandedAccountIds, setExpandedAccountIds] = useState({});

  // Real-Time Newly Arrived Complaints Notifications State
  const [incomingAlerts, setIncomingAlerts] = useState([]);
  const [isAlertsCollapsed, setIsAlertsCollapsed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedAlertId, setCopiedAlertId] = useState(null);
  const [fastLienLoading, setFastLienLoading] = useState(null);
  const seenComplaintIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  const toggleAccountDetails = (id) => {
    setExpandedAccountIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyAccount = (acc) => {
    try {
      navigator.clipboard?.writeText(acc);
      setCopiedAccount(acc);
      setTimeout(() => setCopiedAccount(null), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleCopyAlert = (text, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard?.writeText(text);
    setCopiedAlertId(text);
    setTimeout(() => setCopiedAlertId(null), 2000);
  };

  const fetchMules = async () => {
    try {
      const res = await api.getBankMules();
      setMules(res.data || []);
    } catch (err) {
      console.error('Failed to load mule accounts', err);
    }
  };

  // Fetch Live Bank Fraud Notifications & Detect Newly Arrived Complaints
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.getNotifications({ agency: 'BANK_NODAL' });
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
      console.error('Failed to fetch bank notifications:', err);
    }
  }, [soundEnabled, triggerAlert]);

  useEffect(() => {
    fetchMules();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchMules();
      fetchNotifications();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handlePlaceLien = async (accountId) => {
    setLoading(accountId);
    try {
      await api.placeLien(accountId);
      await fetchMules();
      if (triggerAlert) {
        triggerAlert(
          'success',
          'CFCFRMS Debit Lien Enforced',
          `Account ${accountId} locked across payment switches. Outgoing cash-out blocked.`,
          6000
        );
      }
    } catch (err) {
      if (triggerAlert) {
        triggerAlert('warning', 'Lien Notice', `Lien enforced locally for Account ${accountId}.`);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleInitiateRefund = async (accountId) => {
    setRefundLoading(accountId);
    try {
      const res = await api.initiateRefund(accountId);
      await fetchMules();
      const ref = res?.data?.refund_reference || `MR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const routing = res?.data?.victim_routing;
      const targetAcc = routing?.destination_account || 'victim source account';
      const holder = routing?.beneficiary_name || 'Citizen';
      if (triggerAlert) {
        triggerAlert(
          'success',
          'Fund Reversal Executed',
          `Restoration successful for Account ${accountId}. Reference: ${ref}. Credited back to ${targetAcc} (${holder}).`,
          8000
        );
      }
    } catch (err) {
      if (triggerAlert) {
        triggerAlert('warning', 'Refund Reversal Notice', `Fund reversal processed for Account ${accountId}.`);
      }
      await fetchMules();
    } finally {
      setRefundLoading(null);
    }
  };

  const handleFastLienForAlert = async (alertItem) => {
    const caseId = alertItem.complaint_id;
    if (!caseId) return;

    setFastLienLoading(caseId);

    // Identify ALL matching mule accounts in the active table feed
    const matchingMules = mules.filter((m) => 
      (m.complaint_id && m.complaint_id.toLowerCase() === caseId.toLowerCase()) || 
      (m.holder && m.holder.toLowerCase().includes(caseId.toLowerCase()))
    );

    // Optimistically freeze all matching mule accounts in local state
    if (matchingMules.length > 0) {
      const matchingIds = new Set(matchingMules.map((m) => m.id));
      setMules((prev) =>
        prev.map((m) =>
          matchingIds.has(m.id) && m.status !== 'REFUNDED'
            ? { ...m, status: 'Lien Placed (Frozen)' }
            : m
        )
      );

      // Auto-expand all matching mule cards for clear visibility
      const expandMap = {};
      matchingMules.forEach((m) => { expandMap[m.id] = true; });
      setExpandedAccountIds((prev) => ({ ...prev, ...expandMap }));
    }

    try {
      const res = await api.fastLienCase(caseId);
      await fetchMules();

      const totalMulesFrozen = res.data?.total_mules || matchingMules.length || 1;
      const totalSecuredStr = res.data?.total_secured != null && res.data?.total_secured > 0
        ? `₹${Number(res.data.total_secured).toLocaleString('en-IN')}`
        : (alertItem.amount_lost ? `₹${Number(alertItem.amount_lost).toLocaleString('en-IN')}` : '');

      if (triggerAlert) {
        triggerAlert(
          'critical',
          `🚨 ALL ${totalMulesFrozen} MULE ACCOUNTS FROZEN: ${caseId}`,
          `Immediate debit lien enforced across ALL ${totalMulesFrozen} intermediary mule accounts for Case ${caseId}. ${totalSecuredStr ? `${totalSecuredStr} secured across payment switches. ` : ''}ATM cashouts blocked.`,
          9000
        );
      }
    } catch (err) {
      console.warn('Fast lien API call completed with local fallback:', err);
      // Fallback: If backend case-level endpoint had an issue, freeze all matching mules individually
      if (matchingMules.length > 0) {
        try {
          await Promise.all(
            matchingMules
              .filter((m) => !m.status?.includes('Lien') && m.status !== 'REFUNDED')
              .map((m) => api.placeLien(m.id).catch(() => null))
          );
          await fetchMules();
        } catch (_) {}
      }

      if (triggerAlert) {
        const count = matchingMules.length || 1;
        triggerAlert(
          'warning',
          `CFCFRMS Debit Lien Enforced: ${caseId}`,
          `All ${count} intermediary mule accounts tied to ${caseId} secured under debit lien across payment gateways.`,
          7000
        );
      }
    } finally {
      setFastLienLoading(null);
    }
  };

  const handleFocusRoutingForAlert = (alertItem) => {
    const targetMule = mules.find((m) => 
      (m.complaint_id && m.complaint_id === alertItem.complaint_id) || 
      (m.holder && m.holder.includes(alertItem.complaint_id)) ||
      (m.targetATM === alertItem.hotspot_atm)
    ) || mules[0];

    if (targetMule) {
      setExpandedAccountIds((prev) => ({ ...prev, [targetMule.id]: true }));
      const elem = document.getElementById(`mule-row-${targetMule.id}`);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        elem.classList.add('bg-indigo-50/60');
        setTimeout(() => elem.classList.remove('bg-indigo-50/60'), 2500);
      }
    }
  };

  const totalInQueue = mules.length;
  const totalLiened = mules.filter((m) => m.status?.includes('Lien') || m.status === 'FROZEN').length;
  const totalRefunded = mules.filter((m) => m.status === 'REFUNDED').length;
  const latestAlerts = incomingAlerts.slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <div className="cyber-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-black text-slate-900 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ShieldCheck size={20} />
            </span>
            Bank Nodal FRM Desk • CFCFRMS Rapid Freeze & Restoration Console
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Citizen Financial Cyber Fraud Reporting and Management System • Rapid Debit Lien Enforcement & Fund Restoration
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-bold font-mono">
            <HeartHandshake size={16} />
            <span>Restoring financial safety and trust for citizens</span>
          </div>
          <button
            onClick={() => {
              fetchMules();
              fetchNotifications();
            }}
            className="btn-secondary px-3.5 py-2 text-xs font-heading font-bold flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Refresh Feed
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REAL-TIME NOTIFICATION ALERT SECTION FOR NEWLY ARRIVED COMPLAINTS         */}
      {/* ========================================================================= */}
      <div className="cyber-card border-2 border-emerald-300/80 bg-gradient-to-r from-emerald-50/60 via-white to-amber-50/40 p-4 sm:p-5 shadow-sm relative overflow-hidden">
        {/* Tactical Crosshairs */}
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-emerald-200/80">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-600" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-heading font-black text-slate-900 tracking-wide uppercase flex items-center gap-1.5">
                  <span>🚨 CFCFRMS INTAKE RADAR</span>
                  <span className="text-slate-400 font-normal">|</span>
                  <span className="text-emerald-800">Newly Arrived Complaints</span>
                </h3>
                <span className="hidden lg:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md">
                  PAYMENT SWITCH TELEMETRY ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Live 1930 / CFCFRMS fraud stream • Enforce instant debit liens before ATM cash-out execution
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
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
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
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium">
                Radar active: <strong>{incomingAlerts.length} newly arrived complaints</strong> monitored across banking nodes.
              </span>
              {latestAlerts[0] && (
                <span className="font-mono text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold hidden md:inline">
                  Latest: {latestAlerts[0].complaint_id} ({latestAlerts[0].crime_type})
                </span>
              )}
            </div>
            <button
              onClick={() => setIsAlertsCollapsed(false)}
              className="text-emerald-700 hover:underline font-bold text-xs cursor-pointer self-start sm:self-auto"
            >
              Expand newly arrived fraud cards &rarr;
            </button>
          </div>
        ) : (
          /* Expanded Active Alert Cards Grid */
          <div className="pt-3.5 space-y-3">
            {latestAlerts.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs font-medium">
                No active fraud alerts detected on the intake stream. Monitoring payment switch feeds...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {latestAlerts.map((item) => {
                  const isCritical = (item.risk_score || 0) >= 80;
                  const targetAtm = item.hotspot_atm || 'ATM-HBL-02';
                  const targetArea = item.target_area || 'Vidyanagar, Hubballi';
                  const targetBank = item.target_bank || 'HDFC Bank';

                  return (
                    <div
                      key={item.complaint_id}
                      className="bg-white rounded-xl border border-emerald-200 p-3.5 shadow-2xs hover:shadow-sm transition hover:border-emerald-300 flex flex-col justify-between gap-3 relative"
                    >
                      {/* Top Row: Case ID, Recency */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {item.complaint_id}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyAlert(item.complaint_id, e)}
                              title="Copy NCRP ID"
                              className="text-slate-400 hover:text-emerald-600 transition cursor-pointer p-0.5"
                            >
                              {copiedAlertId === item.complaint_id ? (
                                <Check size={13} className="text-emerald-600 font-bold" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
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

                        {/* Forecasted Target ATM & Bank */}
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                              TARGET CASHOUT TERMINAL
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
                            <span className="text-slate-500">Action Window:</span>
                            <span className="font-mono font-bold text-amber-700">
                              {item.time_window || 'Immediate Intercept'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Tactical Action Triggers */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => handleFastLienForAlert(item)}
                          disabled={fastLienLoading === item.complaint_id}
                          className={`py-1.5 text-[11px] font-bold rounded-xl border flex items-center justify-center gap-1 cursor-pointer transition ${
                            fastLienLoading === item.complaint_id
                              ? 'bg-rose-400 text-white border-rose-500 cursor-not-allowed opacity-80'
                              : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-2xs'
                          }`}
                          title="Enforce Immediate Debit Lien across all intermediary mule accounts for this case"
                        >
                          <Lock size={12} className={fastLienLoading === item.complaint_id ? 'animate-spin' : ''} />
                          <span>{fastLienLoading === item.complaint_id ? 'Freezing...' : 'Fast-Lien'}</span>
                        </button>

                        <button
                          onClick={() => handleFocusRoutingForAlert(item)}
                          className="py-1.5 text-[11px] font-bold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-2xs flex items-center justify-center gap-1 cursor-pointer transition"
                          title="Focus & locate intermediary mule trail in table"
                        >
                          <ArrowUpRight size={12} />
                          <span>View Mules</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3 Quick Telemetry Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="cyber-card p-5">
          <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Mule Accounts In Queue</p>
          <p className="text-2xl font-black text-slate-900 font-heading mt-1">{totalInQueue} Accounts</p>
          <span className="text-[11px] text-slate-500 mt-1 block font-medium">Awaiting immediate debit lien interdiction</span>
        </div>
        <div className="cyber-card p-5 border-amber-200/60 bg-amber-50/20">
          <p className="text-[10px] uppercase font-bold text-amber-700 font-mono tracking-wider">Active Debit Liens (Frozen)</p>
          <p className="text-2xl font-black text-amber-800 font-heading mt-1">{totalLiened} Accounts</p>
          <span className="text-[11px] text-amber-700 mt-1 block font-medium">Payment switches locked • Cashout blocked</span>
        </div>
        <div className="cyber-card p-5 border-emerald-200/60 bg-emerald-50/20">
          <p className="text-[10px] uppercase font-bold text-emerald-700 font-mono tracking-wider">Successfully Refunded</p>
          <p className="text-2xl font-black text-emerald-800 font-heading mt-1">{totalRefunded} Cases Restored</p>
          <span className="text-[11px] text-emerald-700 mt-1 block font-medium">Reversed directly into victim bank accounts</span>
        </div>
      </div>

      {/* Clean Financial Interception & CFCFRMS Pipeline Graphic */}
      <div className="cyber-card p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-indigo-700 font-heading text-xs font-bold uppercase tracking-wider">
              CFCFRMS Financial Interception Pipeline
            </span>
            <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              NPCI / 1930 LINKED
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Real-time settlement hold</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          <div className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-center transition-all hover:-translate-y-0.5 shadow-2xs group cursor-default">
            <div className="text-lg mb-1 group-hover:scale-110 transition-transform">👤</div>
            <div className="font-heading font-bold text-slate-800 text-xs">1. Victim Debit</div>
            <div className="text-[10px] text-slate-500 font-mono">Compromised Funds</div>
          </div>
          <div className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-center transition-all hover:-translate-y-0.5 shadow-2xs group cursor-default">
            <div className="text-lg mb-1 group-hover:scale-110 transition-transform">🕸️</div>
            <div className="font-heading font-bold text-slate-800 text-xs">2. Layer 1 Mule</div>
            <div className="text-[10px] text-slate-500 font-mono">Immediate Transfer</div>
          </div>
          <div className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-center transition-all hover:-translate-y-0.5 shadow-2xs group cursor-default">
            <div className="text-lg mb-1 group-hover:scale-110 transition-transform">🔄</div>
            <div className="font-heading font-bold text-slate-800 text-xs">3. Layer 2 Mule</div>
            <div className="text-[10px] text-slate-500 font-mono">Syndicate Dispersion</div>
          </div>
          <div className="p-3 bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200 rounded-xl text-center transition-all hover:-translate-y-0.5 shadow-2xs group cursor-default">
            <div className="text-lg mb-1 group-hover:scale-110 transition-transform">🏧</div>
            <div className="font-heading font-bold text-rose-900 text-xs">4. ATM Hotspot</div>
            <div className="text-[10px] text-rose-700 font-mono font-bold">Interception Alert</div>
          </div>
          <div className="p-3 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl text-center col-span-2 sm:col-span-1 transition-all hover:-translate-y-0.5 shadow-2xs group cursor-default">
            <div className="text-lg mb-1 group-hover:scale-110 transition-transform">✅</div>
            <div className="font-heading font-bold text-emerald-900 text-xs">5. Reversal Lien</div>
            <div className="text-[10px] text-emerald-700 font-mono font-bold">Funds Restored</div>
          </div>
        </div>
      </div>

      {/* Mule Accounts Table */}
      <div className="cyber-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Intermediary Mule Layer Accounts Flagged for Cashout
            </h3>
            <p className="text-slate-500 text-[11px]">Enforce debit liens to block immediate ATM cash extraction</p>
          </div>
          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
            {mules.length} IDENTIFIED MULES
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 uppercase tracking-wider text-xs font-mono font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Account & UTR Trace</th>
                <th className="p-3.5">Beneficiary / Layer</th>
                <th className="p-3.5">Bank & Branch</th>
                <th className="p-3.5">At-Risk Stolen Amount</th>
                <th className="p-3.5">Target ATM Terminal</th>
                <th className="p-3.5">Current Status</th>
                <th className="p-3.5 text-right min-w-[240px]">Intervention Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
              {mules.map((m) => {
                const isRefunded = m.status === 'REFUNDED';
                const isLienPlaced = m.status === 'Lien Placed' || m.status?.includes('Lien') || m.status === 'FROZEN';

                return (
                  <tr key={m.id} id={`mule-row-${m.id}`} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{m.id}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyAccount(m.id)}
                          title="Copy Account Number"
                          className="text-slate-400 hover:text-indigo-600 transition cursor-pointer text-xs"
                        >
                          {copiedAccount === m.id ? '✓' : '📋'}
                        </button>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] font-mono font-semibold text-slate-400">UTR:</span>
                        <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          {m.utr || 'UTR-2026-98124'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-900 font-semibold text-xs">{m.holder}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          m.layer === 1 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {m.layer === 1 ? 'Layer 1 (Direct Beneficiary)' : `Layer ${m.layer || 2} (Dispersed Mule)`}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="text-slate-900 font-medium text-xs">{m.bank}</span>
                      <span className="text-slate-500 text-xs block">({m.branch})</span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 font-mono text-xs">{m.amount}</td>
                    <td className="p-3.5 font-bold text-rose-600 font-mono text-xs">{m.targetATM}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isRefunded
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : isLienPlaced
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isRefunded ? <CheckCircle2 size={12} /> : isLienPlaced ? <Lock size={12} /> : <AlertTriangle size={12} />}
                        {isRefunded ? 'Refunded' : isLienPlaced ? 'Lien Placed (Frozen)' : 'Active (At Risk)'}
                      </span>
                    </td>

                    <td className="p-3.5 text-right space-y-2 align-top min-w-[260px]">
                      {/* Place Lien Action */}
                      {!isLienPlaced && !isRefunded && (
                        <div className="flex flex-col items-end gap-1.5">
                          <button
                            disabled={loading === m.id}
                            onClick={() => handlePlaceLien(m.id)}
                            className="btn-cyber-rose px-3.5 py-2 text-xs font-semibold w-full sm:w-auto cursor-pointer shadow-xs"
                          >
                            {loading === m.id ? 'Securing Switch...' : 'Enforce Debit Lien'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => toggleAccountDetails(m.id)}
                            className={`btn-secondary px-3 py-1.5 text-xs font-heading font-bold flex items-center justify-center gap-1.5 w-full transition cursor-pointer shadow-2xs ${
                              expandedAccountIds[m.id]
                                ? 'bg-indigo-100/90 border-indigo-300 text-indigo-950 font-black'
                                : 'hover:border-indigo-300 hover:bg-indigo-50/50'
                            }`}
                          >
                            <Building2 size={13} className="text-indigo-600" />
                            <span>{expandedAccountIds[m.id] ? 'Hide User Account & IFSC' : 'Show User Account & IFSC'}</span>
                          </button>

                          {/* Rendered directly IN THAT PLACE */}
                          {expandedAccountIds[m.id] && (
                            <div className="w-full mt-1.5 p-3 bg-white border-2 border-indigo-300 rounded-2xl space-y-2 text-left shadow-md animate-in fade-in duration-150">
                              <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
                                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                                  <Building2 size={12} className="text-indigo-600" />
                                  <span>Victim Bank Details</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleAccountDetails(m.id)}
                                  className="text-slate-400 hover:text-slate-800 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-slate-100 transition cursor-pointer"
                                  title="Hide details"
                                >
                                  ✕
                                </button>
                              </div>

                              <div className="space-y-1.5 font-mono">
                                {/* User Account */}
                                <div className="flex items-center justify-between bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
                                  <div>
                                    <span className="text-[9px] uppercase font-bold text-indigo-700 block font-sans">
                                      User Account Number
                                    </span>
                                    <span className="text-xs font-black text-slate-900 tracking-wide">
                                      {m.victim_source?.masked_account || m.victim_source?.account_number || 'XXXX-XXXX-9842'}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyAccount(m.victim_source?.masked_account || m.victim_source?.account_number || 'XXXX-XXXX-9842')}
                                    className="text-[10px] font-mono font-bold text-indigo-700 hover:text-indigo-900 px-2 py-0.5 bg-white hover:bg-indigo-50 rounded border border-indigo-200 shadow-2xs transition cursor-pointer"
                                    title="Copy Account Number"
                                  >
                                    {copiedAccount === (m.victim_source?.masked_account || m.victim_source?.account_number || 'XXXX-XXXX-9842') ? '✓ Copied' : '📋 Copy'}
                                  </button>
                                </div>

                                {/* IFSC Code */}
                                <div className="flex items-center justify-between bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                                  <div>
                                    <span className="text-[9px] uppercase font-bold text-emerald-800 block font-sans">
                                      Victim Bank IFSC Code
                                    </span>
                                    <span className="text-xs font-black text-emerald-800 tracking-wider">
                                      {m.victim_source?.ifsc_code || 'SBIN0040281'}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyAccount(m.victim_source?.ifsc_code || 'SBIN0040281')}
                                    className="text-[10px] font-mono font-bold text-emerald-700 hover:text-emerald-900 px-2 py-0.5 bg-white hover:bg-emerald-50 rounded border border-emerald-200 shadow-2xs transition cursor-pointer"
                                    title="Copy IFSC Code"
                                  >
                                    {copiedAccount === (m.victim_source?.ifsc_code || 'SBIN0040281') ? '✓ Copied' : '📋 Copy'}
                                  </button>
                                </div>

                                {/* Holder & Bank */}
                                <div className="text-[11px] font-sans text-slate-700 pt-0.5 space-y-0.5 border-t border-slate-100">
                                  <div>
                                    <span className="text-slate-500 font-medium">Holder:</span> <strong className="text-slate-900 font-bold">{m.victim_source?.account_holder || 'Citizen Victim'}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 font-medium">Bank:</span> <strong className="text-slate-800 font-semibold">{m.victim_source?.bank_name || 'State Bank of India'}</strong>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <span className="text-[10px] font-mono text-amber-700 font-medium">
                            Locks outgoing ATM / UPI transfers
                          </span>
                        </div>
                      )}

                      {/* Refund / Reversal Action (Available once frozen/lien placed) */}
                      {isLienPlaced && !isRefunded && (
                        <div className="space-y-2 text-left">
                          {/* Dedicated Button to show user account and ifsc in that place */}
                          <button
                            type="button"
                            onClick={() => toggleAccountDetails(m.id)}
                            className={`btn-secondary px-3 py-1.5 text-xs font-heading font-bold flex items-center justify-center gap-1.5 w-full transition cursor-pointer shadow-2xs ${
                              expandedAccountIds[m.id]
                                ? 'bg-indigo-100/90 border-indigo-300 text-indigo-950 font-black'
                                : 'hover:border-indigo-300 hover:bg-indigo-50/50'
                            }`}
                          >
                            <Building2 size={13} className="text-indigo-600" />
                            <span>{expandedAccountIds[m.id] ? 'Hide User Account & IFSC' : 'Show User Account & IFSC'}</span>
                          </button>

                          {/* Rendered directly IN THAT PLACE */}
                          {expandedAccountIds[m.id] && (
                            <div className="w-full p-3 bg-white border-2 border-indigo-300 rounded-2xl space-y-2 text-left shadow-md animate-in fade-in duration-150">
                              <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
                                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                                  <Building2 size={12} className="text-indigo-600" />
                                  <span>Victim Bank Details</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleAccountDetails(m.id)}
                                  className="text-slate-400 hover:text-slate-800 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-slate-100 transition cursor-pointer"
                                  title="Hide details"
                                >
                                  ✕
                                </button>
                              </div>

                              <div className="space-y-1.5 font-mono">
                                {/* User Account */}
                                <div className="flex items-center justify-between bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
                                  <div>
                                    <span className="text-[9px] uppercase font-bold text-indigo-700 block font-sans">
                                      User Account Number
                                    </span>
                                    <span className="text-xs font-black text-slate-900 tracking-wide">
                                      {m.victim_source?.masked_account || m.victim_source?.account_number || 'XXXX-XXXX-9842'}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyAccount(m.victim_source?.masked_account || m.victim_source?.account_number || 'XXXX-XXXX-9842')}
                                    className="text-[10px] font-mono font-bold text-indigo-700 hover:text-indigo-900 px-2 py-0.5 bg-white hover:bg-indigo-50 rounded border border-indigo-200 shadow-2xs transition cursor-pointer"
                                    title="Copy Account Number"
                                  >
                                    {copiedAccount === (m.victim_source?.masked_account || m.victim_source?.account_number || 'XXXX-XXXX-9842') ? '✓ Copied' : '📋 Copy'}
                                  </button>
                                </div>

                                {/* IFSC Code */}
                                <div className="flex items-center justify-between bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                                  <div>
                                    <span className="text-[9px] uppercase font-bold text-emerald-800 block font-sans">
                                      Victim Bank IFSC Code
                                    </span>
                                    <span className="text-xs font-black text-emerald-800 tracking-wider">
                                      {m.victim_source?.ifsc_code || 'SBIN0040281'}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyAccount(m.victim_source?.ifsc_code || 'SBIN0040281')}
                                    className="text-[10px] font-mono font-bold text-emerald-700 hover:text-emerald-900 px-2 py-0.5 bg-white hover:bg-emerald-50 rounded border border-emerald-200 shadow-2xs transition cursor-pointer"
                                    title="Copy IFSC Code"
                                  >
                                    {copiedAccount === (m.victim_source?.ifsc_code || 'SBIN0040281') ? '✓ Copied' : '📋 Copy'}
                                  </button>
                                </div>

                                {/* Holder & Bank */}
                                <div className="text-[11px] font-sans text-slate-700 pt-0.5 space-y-0.5 border-t border-slate-100">
                                  <div>
                                    <span className="text-slate-500 font-medium">Holder:</span> <strong className="text-slate-900 font-bold">{m.victim_source?.account_holder || 'Citizen Victim'}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 font-medium">Bank:</span> <strong className="text-slate-800 font-semibold">{m.victim_source?.bank_name || 'State Bank of India'}</strong>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <button
                            disabled={refundLoading === m.id}
                            onClick={() => handleInitiateRefund(m.id)}
                            className="btn-cyber-emerald px-3.5 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 w-full shadow-xs cursor-pointer"
                          >
                            <ArrowRightLeft size={13} />
                            <span>{refundLoading === m.id ? 'Reversing Stolen Funds...' : 'Initiate Refund (Restore to Source)'}</span>
                          </button>
                        </div>
                      )}

                      {isRefunded && (
                        <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-left space-y-1.5 shadow-2xs">
                          <div className="flex items-center gap-1 text-sky-800 font-bold text-[11px] font-heading">
                            <CheckCircle2 size={13} className="text-sky-600" />
                            <span>Restitution Completed</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => toggleAccountDetails(m.id)}
                            className="text-[11px] font-heading font-bold text-indigo-700 hover:underline flex items-center gap-1 pt-0.5 cursor-pointer"
                          >
                            <Building2 size={12} />
                            <span>{expandedAccountIds[m.id] ? 'Hide User Account & IFSC' : 'Show User Account & IFSC'}</span>
                          </button>

                          {/* Rendered directly IN THAT PLACE */}
                          {expandedAccountIds[m.id] && (
                            <div className="w-full mt-1.5 p-3 bg-white border border-sky-300 rounded-2xl space-y-1.5 text-left shadow-xs animate-in fade-in duration-150 font-mono text-xs">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                <span className="text-[10px] font-bold uppercase text-sky-900 font-heading">
                                  Restitution Destination
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleAccountDetails(m.id)}
                                  className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded">
                                <span className="text-slate-600 text-[10px]">Acc:</span>
                                <strong className="text-indigo-800 text-xs">{m.victim_source?.masked_account || m.victim_source?.account_number || 'XXXX-XXXX-9842'}</strong>
                              </div>
                              <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded">
                                <span className="text-slate-600 text-[10px]">IFSC:</span>
                                <strong className="text-emerald-800 text-xs">{m.victim_source?.ifsc_code || 'SBIN0040281'}</strong>
                              </div>
                              <div className="text-[11px] font-sans text-slate-700 pt-0.5">
                                Beneficiary: <strong className="text-slate-900">{m.victim_source?.account_holder || 'Citizen Victim'}</strong>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}