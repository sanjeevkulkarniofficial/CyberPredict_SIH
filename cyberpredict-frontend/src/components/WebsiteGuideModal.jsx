import React, { useState } from 'react';

export default function WebsiteGuideModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to CyberPredict 🛡️",
      desc: "Our platform bridges Citizens, Law Enforcement (LEA), Bank Fraud Risk Management (FRM) desks, and I4C to instantly block fraud and restore stolen funds with deep empathy and speed."
    },
    {
      title: "1. For Citizens (Express & Compassionate Intake)",
      desc: "Easily report scams using natural language or express forms. You will receive live tracking, and once resolved, an official digital Refund Certificate."
    },
    {
      title: "2. For Police & Bank Officials",
      desc: "Track high-risk ATM cash-out hot zones on the live map, enforce CFCFRMS debit liens instantly, and execute automated fund reversals."
    }
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="cyber-card max-w-lg w-full p-6 rounded-3xl shadow-2xl space-y-5 border border-slate-200/80 bg-white/95">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <span className="text-[11px] font-mono font-black text-indigo-600 uppercase bg-indigo-50/80 px-3 py-1 rounded-full border border-indigo-200/60 flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
            PLATFORM ARCHITECTURE BRIEF ({step}/{steps.length})
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 text-sm font-bold p-1 rounded-xl hover:bg-slate-100 cursor-pointer transition">
            ✕
          </button>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-heading font-black text-slate-900 tracking-tight">{steps[step - 1].title}</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">{steps[step - 1].desc}</p>
        </div>
        
        {/* Step indicator pills */}
        <div className="flex gap-1.5 pt-1">
          {steps.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx + 1 === step ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between pt-4 border-t border-slate-100">
          <button 
            disabled={step === 1} 
            onClick={() => setStep(step - 1)}
            className="btn-secondary px-4 py-2 text-xs font-heading font-bold disabled:opacity-30 cursor-pointer"
          >
            ← Previous
          </button>
          {step < steps.length ? (
            <button 
              onClick={() => setStep(step + 1)}
              className="btn-cyber-primary px-5 py-2 text-xs cursor-pointer"
            >
              Next Module →
            </button>
          ) : (
            <button 
              onClick={onClose}
              className="btn-cyber-emerald px-5 py-2 text-xs cursor-pointer"
            >
              Launch System 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
}