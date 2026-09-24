import React from 'react';
import { ShieldAlert, Printer, X, MapPin, Clock, AlertTriangle, FileText, CheckCircle2, Building2 } from 'lucide-react';

export default function EvidenceDossierModal({ hotspot, onClose, triggerAlert }) {
  if (!hotspot) return null;

  const handlePrint = () => {
    window.print();
    if (triggerAlert) {
      triggerAlert('info', 'Dossier Exported', 'Intelligence report sent to print / PDF export spooler.');
    }
  };

  const isCritical = (hotspot.risk_score || 0) >= 80;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="cyber-card relative bg-white/95 border border-slate-200/90 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="hud-corner-tl !border-rose-400"></div>
        <div className="hud-corner-tr !border-rose-400"></div>
        <div className="hud-corner-bl !border-rose-400"></div>
        <div className="hud-corner-br !border-rose-400"></div>

        {/* Header Bar */}
        <div className="bg-slate-50/90 border-b border-slate-200 p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                  CONFIDENTIAL • LAW ENFORCEMENT SENSITIVE
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
                  NCRP / I4C TACTICAL DOSSIER
                </span>
              </div>
              <h3 className="text-base font-heading font-black text-slate-900 mt-0.5 tracking-tight">
                Tactical Cash-Out Interception Dossier: <span className="font-mono text-indigo-600">{hotspot.complaint_id || 'NCRP-EMERGENCY'}</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 btn-cyber-primary text-xs cursor-pointer"
            >
              <Printer size={14} /> Print Dossier PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs font-sans">
          {/* Government / Agency Subheader */}
          <div className="border-b border-slate-200 pb-4 text-center">
            <h2 className="text-sm font-heading font-black uppercase tracking-widest text-slate-900">
              Indian Cyber Crime Coordination Centre (I4C) & State LEA
            </h2>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Proactive Financial Cyber Fraud Intervention & Cash Withdrawal Prevention Matrix
            </p>
          </div>

          {/* Incident Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Case Reference</span>
              <span className="text-xs font-mono font-bold text-indigo-600 mt-0.5 block">{hotspot.complaint_id}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Modus Operandi</span>
              <span className="text-xs font-bold text-slate-900 mt-0.5 block">{hotspot.fraud_type || 'UPI Fraud'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Predictive Risk</span>
              <span className={`text-xs font-black mt-0.5 block ${isCritical ? 'text-rose-600' : 'text-amber-600'}`}>
                {hotspot.risk_score}% ({isCritical ? 'CRITICAL HIGH' : 'MODERATE RISK'})
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Tactical Window</span>
              <span className="text-xs font-mono font-bold text-amber-700 mt-0.5 block">
                {hotspot.time_window || 'Immediate Intercept'}
              </span>
            </div>
          </div>

          {/* CFCFRMS UTR Trace & Multi-Hop Footprint */}
          <div className="p-4 bg-indigo-50/50 border border-indigo-200/80 rounded-xl space-y-2.5">
            <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5 font-heading">
                <FileText size={14} className="text-indigo-600" /> CFCFRMS Digital Footprint & UTR Trace Ledger
              </h4>
              <span className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-100/70 px-2 py-0.5 rounded border border-indigo-200">
                I4C / NPCI Central Switch
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-slate-700">
              <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Victim 1st-Hop UTR</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                  {hotspot.suspect_utr || 'UTR-2026-98124'}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">✓ Verified on National Switch</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Layer-1 Beneficiary Account</span>
                <span className="text-xs font-mono font-bold text-rose-700 mt-0.5 block">ACC-HBL-91763</span>
                <span className="text-[10px] text-rose-600 font-medium block mt-0.5">Matched: National Suspect DB</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Downstream Dispersion</span>
                <span className="text-xs font-mono font-bold text-indigo-700 mt-0.5 block">Layer 2 & Layer 3 Mules</span>
                <span className="text-[10px] text-indigo-600 font-medium block mt-0.5">Electronic Freeze Notices Broadcast</span>
              </div>
            </div>
          </div>

          {/* Forecasted Withdrawal Terminal Telemetry */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <MapPin size={14} className="text-rose-600" /> Forecasted Target Cash-Out Terminal
              </h4>
              <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                GPS: {hotspot.latitude?.toFixed(4)}, {hotspot.longitude?.toFixed(4)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">ATM Terminal ID & Bank</p>
                <p className="font-bold text-slate-900 text-sm">{hotspot.atm_id} — {hotspot.bank_name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Jurisdiction & Location</p>
                <p className="text-xs font-medium text-slate-700">{hotspot.area}</p>
              </div>
            </div>
          </div>

          {/* Explainable AI (XAI) Attribution Breakdown */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText size={14} className="text-indigo-600" /> Explainable AI (XAI) Factor Attribution Drivers
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {hotspot.factors &&
                Object.entries(hotspot.factors).map(([key, val]) => (
                  <div key={key} className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-500 capitalize">
                      {key.replace('_', ' ')}
                    </div>
                    <div className="text-sm font-black text-slate-900 mt-1">{val}%</div>
                    <div className="w-full bg-slate-200 rounded-full h-1 mt-1.5">
                      <div className="bg-gradient-to-r from-rose-500 to-indigo-500 h-1 rounded-full" style={{ width: `${val}%` }} />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Tactical SOP Directives */}
          <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <AlertTriangle size={14} /> Immediate Tactical Directives for Beat Patrol
            </h4>
            <p className="text-xs text-rose-900 leading-relaxed font-medium">
              {hotspot.recommended_action ||
                `Deploy urgent PCR beat unit to ${hotspot.atm_id} (${hotspot.area}). Request bank nodal to initiate CCTV video preservation order and freeze intermediary beneficiary accounts.`}
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-800 pt-2 border-t border-rose-200/80">
              <li>Deploy patrol vehicle to terminal perimeter within tactical window.</li>
              <li>Issue Section 91 CrPC / BNSS preservation notice to bank branch manager for CCTV footage.</li>
              <li>Confirm CFCFRMS debit lien enforcement on active Layer-1 & Layer-2 mule accounts.</li>
            </ul>
          </div>

          {/* Chain of Custody / Sign-Off Block */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[11px] font-mono text-slate-500">
            <div>
              <span>Generated by: CyberPredict Predictive Engine v2.1</span>
              <br />
              <span>Authorization: I4C National Command Matrix</span>
            </div>
            <div className="text-right">
              <span>Investigating Officer Verification</span>
              <div className="mt-1 text-slate-800 font-bold underline decoration-dotted">
                Insp. Rajesh Kumar (LEA-HBL-01)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

