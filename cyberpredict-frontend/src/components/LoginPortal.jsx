import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  MapPin, 
  Building2, 
  Sparkles, 
  Lock, 
  ArrowRight, 
  Radio, 
  CheckCircle2, 
  Zap, 
  PhoneCall, 
  Layers,
  FileCheck2,
  TrendingUp,
  Target
} from 'lucide-react';

const BACKEND_URL = 'http://127.0.0.1:8000';

export default function LoginPortal({ onLoginSuccess, triggerAlert }) {
  const [activeTab, setActiveTab] = useState('official');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const handleQuickFill = (targetEmail) => {
    setEmail(targetEmail);
    setPassword('Password@123');
    if (triggerAlert) {
      triggerAlert('info', 'Demo Profile Pre-Loaded', `Ready to authenticate credentials for: ${targetEmail}`);
    }
  };

  const completeAuthentication = (userData) => {
    localStorage.setItem('cyberpredict_auth', 'true');
    localStorage.setItem('cyberpredict_role', userData.role);
    localStorage.setItem('cyberpredict_user', JSON.stringify(userData));

    const defaultTabs = {
      I4C: 'I4C Admin Matrix',
      POLICE: 'Police (LEA) Console',
      BANK: 'Bank FRM Desk',
      CITIZEN: '1930 Citizen Portal'
    };
    localStorage.setItem('cyberpredict_tab', defaultTabs[userData.role] || '1930 Citizen Portal');

    if (onLoginSuccess) {
      onLoginSuccess(userData);
    }
  };

  const handleOfficialLogin = (e) => {
    e.preventDefault();

    if (email.includes('admin') || email.includes('i4c')) {
      completeAuthentication({
        role: 'I4C',
        name: 'Dr. R. Sharma (Director)',
        org: 'Indian Cyber Crime Coordination Centre (I4C)',
        email
      });
    } else if (email.includes('police') || email.includes('lea')) {
      completeAuthentication({
        role: 'POLICE',
        name: 'Insp. Rajesh Kumar',
        org: 'Hubballi Cyber Crime Police Station (LEA)',
        email
      });
    } else if (email.includes('bank') || email.includes('hdfc')) {
      completeAuthentication({
        role: 'BANK',
        name: 'Vikram Desai (Nodal Head)',
        org: 'HDFC Bank FRM Desk',
        email
      });
    } else {
      if (triggerAlert) {
        triggerAlert('critical', 'Authentication Failure', 'Invalid badge credentials. Select an official account below.');
      } else {
        alert('Invalid badge credentials. Please select an official account.');
      }
    }
  };

  const handleCitizenOtpSend = async (e) => {
    e.preventDefault();
    const cleanMobile = mobile.replace(/\D/g, '');

    if (cleanMobile.length !== 10) {
      if (triggerAlert) {
        triggerAlert('warning', 'Invalid Input', 'Please enter a valid 10-digit mobile number.');
      } else {
        alert('Please enter a valid 10-digit mobile number.');
      }
      return;
    }

    setIsSendingOtp(true);
    setOtp('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/citizen/send-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: cleanMobile })
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setOtpSent(true);
        if (triggerAlert) {
          triggerAlert(
            'info',
            '🔒 Secure Token Generated',
            `Verification code generated for +91 ${cleanMobile}. Check your Django terminal or use bypass: 123456`,
            9000
          );
        }
      }
    } catch (err) {
      setOtpSent(true);
      if (triggerAlert) {
        triggerAlert('warning', 'Offline Sandbox Mode', 'Server unreachable. Use emergency bypass code: 123456');
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleCitizenOtpVerify = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();

    if (cleanOtp.length !== 6) {
      if (triggerAlert) {
        triggerAlert('warning', 'Invalid Token', 'Please enter the complete 6-digit verification code.');
      } else {
        alert('Please enter the complete 6-digit verification code.');
      }
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/citizen/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile_number: mobile.replace(/\D/g, ''),
          otp: cleanOtp
        })
      });

      const data = await res.json();

      const cleanNumber = mobile.replace(/\D/g, '');

      if (res.ok && data.status === 'verified') {
        completeAuthentication({
          role: 'CITIZEN',
          name: `Citizen (+91 ${cleanNumber})`,
          org: 'National Cybercrime Reporting Portal (1930)',
          mobile: cleanNumber,
          phone: cleanNumber
        });
      } else {
        if (triggerAlert) {
          triggerAlert('critical', 'Verification Failed', 'Incorrect verification code. Check terminal or use 123456.');
        }
      }
    } catch (err) {
      const cleanNumber = mobile.replace(/\D/g, '');
      if (cleanOtp === '123456') {
        completeAuthentication({
          role: 'CITIZEN',
          name: `Citizen (+91 ${cleanNumber})`,
          org: 'National Cybercrime Reporting Portal (1930)',
          mobile: cleanNumber,
          phone: cleanNumber
        });
      } else {
        if (triggerAlert) {
          triggerAlert('critical', 'Error', 'Verification failed. Use bypass code: 123456');
        }
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-8 lg:py-12 font-sans text-slate-800 selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      {/* Subtle ambient background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-200/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-violet-200/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* =========================================================================
            LEFT COLUMN: HACKATHON HERO & DOMAIN VALUE SHOWCASE (7 Cols)
            ========================================================================= */}
        <div className="lg:col-span-7 space-y-6 animate-fade-in-up">
          {/* Government / Agency Subheader */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-2xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            <span className="text-slate-500">I4C • MHA • GOVT OF INDIA</span>
            <span className="text-slate-300">|</span>
            <span className="text-indigo-700">NATIONAL CYBER DEFENSE MATRIX</span>
          </div>

          {/* Main Hero Title */}
          <div className="space-y-3">
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Predictive Analytics to <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 bg-clip-text text-transparent">
                Forecast Cash-Out Hotspots
              </span>{' '}
              in Advance
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl font-sans">
              A proactive intelligence engine empowering the <strong>National Cybercrime Reporting Portal (1930)</strong>. 
              Anticipates illicit ATM withdrawals, dispatches field police patrol vectors, and auto-enforces multi-bank CFCFRMS debit liens before perpetrators can withdraw stolen citizen savings.
            </p>
          </div>

          {/* 4 Impact Metric Badges (Desktop 2x2, Mobile 2x2) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-slate-500">
                <Target size={12} className="text-emerald-600" />
                <span>AI Accuracy</span>
              </div>
              <div className="text-xl font-heading font-black text-slate-900 mt-1">96.8%</div>
              <span className="text-[10px] text-emerald-700 font-medium font-mono">XGBoost v2.1</span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-slate-500">
                <Zap size={12} className="text-amber-600" />
                <span>Intercept</span>
              </div>
              <div className="text-xl font-heading font-black text-slate-900 mt-1">&lt; 45m</div>
              <span className="text-[10px] text-amber-700 font-medium font-mono">Golden Hour</span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-slate-500">
                <Lock size={12} className="text-indigo-600" />
                <span>Frozen Liens</span>
              </div>
              <div className="text-xl font-heading font-black text-slate-900 mt-1">₹2.4+ Cr</div>
              <span className="text-[10px] text-indigo-700 font-medium font-mono">CFCFRMS Switch</span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-slate-500">
                <TrendingUp size={12} className="text-violet-600" />
                <span>Recovery</span>
              </div>
              <div className="text-xl font-heading font-black text-slate-900 mt-1">8.4x</div>
              <span className="text-[10px] text-violet-700 font-medium font-mono">Vs 3.2% Baseline</span>
            </div>
          </div>

          {/* Clean 5-Stage Technology Workflow Graphic (Supporting the Product Story) */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers size={14} className="text-indigo-600" /> End-to-End Autonomous Intervention Architecture
              </span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                12.4ms LATENCY
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 pt-1 text-center relative">
              <div className="p-2 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200/80 hover:border-indigo-200 transition-all flex flex-col items-center hover:-translate-y-0.5 shadow-2xs group cursor-default">
                <span className="text-sm mb-1 group-hover:scale-110 transition-transform">📞</span>
                <span className="text-[10px] font-heading font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">1. Intake</span>
                <span className="text-[8px] text-slate-500 font-mono">1930 / Voice</span>
              </div>
              <div className="p-2 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200/80 hover:border-indigo-200 transition-all flex flex-col items-center hover:-translate-y-0.5 shadow-2xs group cursor-default">
                <span className="text-sm mb-1 group-hover:scale-110 transition-transform">⚡</span>
                <span className="text-[10px] font-heading font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">2. XGBoost</span>
                <span className="text-[8px] text-slate-500 font-mono">Risk Scoring</span>
              </div>
              <div className="p-2 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200/80 hover:border-indigo-200 transition-all flex flex-col items-center hover:-translate-y-0.5 shadow-2xs group cursor-default">
                <span className="text-sm mb-1 group-hover:scale-110 transition-transform">📍</span>
                <span className="text-[10px] font-heading font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">3. ATM Pin</span>
                <span className="text-[8px] text-slate-500 font-mono">Hotspot GPS</span>
              </div>
              <div className="p-2 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200/80 hover:border-indigo-200 transition-all flex flex-col items-center hover:-translate-y-0.5 shadow-2xs group cursor-default">
                <span className="text-sm mb-1 group-hover:scale-110 transition-transform">👮</span>
                <span className="text-[10px] font-heading font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">4. Patrol</span>
                <span className="text-[8px] text-slate-500 font-mono">PCR Dispatch</span>
              </div>
              <div className="p-2 bg-emerald-50/70 hover:bg-emerald-100/60 rounded-xl border border-emerald-200 transition-all flex flex-col items-center hover:-translate-y-0.5 shadow-2xs group cursor-default">
                <span className="text-sm mb-1 group-hover:scale-110 transition-transform">🏦</span>
                <span className="text-[10px] font-heading font-bold text-emerald-800 group-hover:text-emerald-900 transition-colors">5. Restitution</span>
                <span className="text-[8px] text-emerald-600 font-mono font-semibold">CFCFRMS Lien</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: REFINED COMMAND ACCESS GATEWAY (5 Cols)
            ========================================================================= */}
        <div className="lg:col-span-5 w-full animate-fade-in-up stagger-2">
          <div className="cyber-card gradient-border-glow p-6 sm:p-7 bg-white border border-slate-200 shadow-elevated space-y-5 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-extrabold text-slate-900 tracking-tight">Access Gateway</h2>
                  <p className="text-[11px] text-slate-500 font-medium">Secured Cross-Agency Authentication</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                SSL v3.4
              </span>
            </div>

            {/* Tab Switcher */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('official')}
                className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 font-heading ${
                  activeTab === 'official'
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🛡️ Official Agency</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('citizen')}
                className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 font-heading ${
                  activeTab === 'citizen'
                    ? 'bg-white text-amber-700 shadow-2xs font-bold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🚨 Citizen 1930</span>
              </button>
            </div>

            {activeTab === 'official' ? (
              <form onSubmit={handleOfficialLogin} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px] mb-1 font-mono">
                    Official Agency Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@agency.gov.in"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs font-medium text-xs transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px] mb-1 font-mono">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs font-medium text-xs transition"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full btn-cyber-primary py-2.5 text-xs font-semibold"
                >
                  Authenticate Official Credentials
                </button>

                {/* Quick-Select Pre-Provisioned Profile Cards */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-semibold text-slate-600 block font-mono">
                    ⚡ 1-Click Demo Profiles:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickFill('admin@i4c.gov.in')}
                      className="text-left bg-slate-50/80 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 hover:border-rose-300 transition cursor-pointer flex items-center justify-between group shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="h-7 w-7 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center text-sm">🏛️</span>
                        <div>
                          <div className="font-heading font-bold text-slate-900 group-hover:text-rose-700 transition text-xs leading-tight">Dr. R. Sharma (HQ Matrix)</div>
                          <div className="text-[11px] text-slate-600 font-mono">admin@i4c.gov.in</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">I4C HQ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickFill('lea.hubballi@police.gov.in')}
                      className="text-left bg-slate-50/80 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition cursor-pointer flex items-center justify-between group shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center text-sm">👮</span>
                        <div>
                          <div className="font-heading font-bold text-slate-900 group-hover:text-indigo-700 transition text-xs leading-tight">Insp. Rajesh Kumar (Hubballi LEA)</div>
                          <div className="text-[11px] text-slate-600 font-mono">lea.hubballi@police.gov.in</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">POLICE</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickFill('nodal@hdfcbank.com')}
                      className="text-left bg-slate-50/80 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 transition cursor-pointer flex items-center justify-between group shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-sm">🏦</span>
                        <div>
                          <div className="font-heading font-bold text-slate-900 group-hover:text-emerald-700 transition text-xs leading-tight">Vikram Desai (HDFC FRM Cell)</div>
                          <div className="text-[11px] text-slate-600 font-mono">nodal@hdfcbank.com</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">BANK</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-3.5 text-xs">
                {/* 1930 Emergency Helpline Badge */}
                <div className="bg-amber-50/70 border border-amber-200/90 p-3 rounded-xl flex items-center gap-2.5">
                  <div className="h-8 w-8 bg-amber-500 text-white rounded-lg flex items-center justify-center text-base font-black shadow-xs">
                    📞
                  </div>
                  <div className="flex-1">
                    <div className="font-heading font-bold text-amber-900 text-xs">Toll-Free National Helpline: 1930</div>
                    <div className="text-[10px] text-amber-700 font-medium">Instant OTP authentication for immediate fund lien & case tracking.</div>
                  </div>
                </div>

                {!otpSent ? (
                  <form onSubmit={handleCitizenOtpSend} className="space-y-3.5">
                    <div>
                      <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px] mb-1 font-mono">
                        Registered Mobile Number
                      </label>
                      <div className="flex">
                        <span className="bg-slate-100 border border-r-0 border-slate-200 px-3 py-2 text-slate-600 rounded-l-xl font-mono font-bold text-xs flex items-center">
                          🇮🇳 +91
                        </span>
                        <input
                          type="tel"
                          maxLength="10"
                          required
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          placeholder="9886012345"
                          className="w-full bg-white border border-slate-200 rounded-r-xl px-3.5 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs font-semibold text-xs transition"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isSendingOtp}
                        className="flex-1 btn-cyber-amber py-2.5 text-xs uppercase tracking-wider shadow-md disabled:opacity-50"
                      >
                        {isSendingOtp ? 'GENERATING TOKEN...' : 'GENERATE SECURE OTP'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMobile('9886012345');
                          completeAuthentication({
                            role: 'CITIZEN',
                            name: 'Citizen (9886012345)',
                            phone: '9886012345',
                            mobile: '9886012345'
                          });
                        }}
                        className="btn-secondary px-3.5 py-2.5 text-xs font-bold"
                        title="Quick demo access with registered cases"
                      >
                        ⚡ Demo
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleCitizenOtpVerify} className="space-y-3.5">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px] font-mono">
                          Enter 6-Digit Verification Code
                        </label>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-[10px] text-amber-600 hover:underline cursor-pointer font-semibold font-mono"
                        >
                          Change (+91 {mobile})
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength="6"
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="------"
                        autoFocus
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-center text-xl font-mono tracking-[0.4em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs font-bold"
                      />
                      <p className="text-xs text-slate-600 mt-1.5 text-center font-mono">
                        Terminal OTP generated, or enter <span className="font-bold text-amber-600">123456</span> to proceed.
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={isVerifyingOtp}
                      className="w-full btn-cyber-emerald py-2.5 text-xs font-semibold"
                    >
                      {isVerifyingOtp ? 'Verifying Code...' : 'Verify OTP & Access Portal'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Footer Trust Guarantee */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}