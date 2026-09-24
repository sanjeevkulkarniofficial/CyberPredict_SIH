import React from 'react';
import { CheckCircle2, Clock, Lock, ShieldCheck, Banknote } from 'lucide-react';

export default function CitizenRefundTracker({ incident, stage }) {
  const currentStatus = stage || incident?.stage || incident?.status || 'LOGGED';

  const steps = [
    {
      key: 'LOGGED',
      title: 'Complaint Lodged',
      desc: '1930 Incident Docket Generated',
      icon: Clock,
    },
    {
      key: 'FROZEN',
      title: 'Debit Lien Enforced',
      desc: 'Mule Accounts Blocked via CFCFRMS',
      icon: Lock,
    },
    {
      key: 'REFUND_PENDING',
      title: 'Refund Clearance',
      desc: 'Nodal Bank Clearing Authorized',
      icon: ShieldCheck,
    },
    {
      key: 'REFUNDED',
      title: 'Restored & Credited',
      desc: 'Funds Reversal Completed',
      icon: Banknote,
    },
  ];

  const getCurrentStepIndex = (status) => {
    switch (status) {
      case 'LOGGED':
        return 0;
      case 'FROZEN':
        return 1;
      case 'REFUND_PENDING':
        return 2;
      case 'REFUNDED':
        return 3;
      default:
        return 0;
    }
  };

  const currentIndex = getCurrentStepIndex(currentStatus);

  return (
    <div className="cyber-card p-5 my-4">
      <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500">
            Automated Fund Recovery Pipeline
          </span>
        </div>
        <span
          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
            currentStatus === 'REFUNDED'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : currentStatus === 'FROZEN'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : currentStatus === 'REFUND_PENDING'
              ? 'bg-sky-50 text-sky-700 border-sky-200'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          }`}
        >
          {currentStatus === 'REFUNDED' && '✅ Restored to Citizen'}
          {currentStatus === 'REFUND_PENDING' && '⏳ Nodal Clearance'}
          {currentStatus === 'FROZEN' && '🔒 Funds Secured Under Lien'}
          {currentStatus === 'LOGGED' && '🚨 Active Intercept Vector'}
        </span>
      </div>

      <div className="relative flex justify-between items-start">
        {/* Connecting Progress Bar Line */}
        <div className="absolute top-5 left-8 right-8 h-1 bg-slate-200 -z-0">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-teal-500 to-emerald-500 transition-all duration-700 rounded-full"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1 z-10 px-1 text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  isDone
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                    : isCurrent
                    ? 'bg-white border-emerald-500 text-emerald-600 ring-4 ring-emerald-500/10 shadow-sm scale-110'
                    : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle2 size={18} /> : <Icon size={18} />}
              </div>

              <div className="mt-2.5">
                <p
                  className={`text-xs font-heading font-bold leading-tight ${
                    isDone || isCurrent ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </p>
                <p
                  className={`text-[10px] mt-0.5 leading-snug hidden sm:block ${
                    isCurrent
                      ? 'text-emerald-700 font-semibold'
                      : isDone
                      ? 'text-slate-500'
                      : 'text-slate-400'
                  }`}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}