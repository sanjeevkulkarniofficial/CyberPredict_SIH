import React, { useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import Navbar from './components/Navbar';
import LoginPortal from './components/LoginPortal';
import PolicePortal from './components/PolicePortal';
import BankPortal from './components/BankPortal';
import AdminPortal from './components/AdminPortal';
import CitizenPortal from './components/CitizenPortal';
import WebsiteGuideModal from './components/WebsiteGuideModal';

/* =========================================================================
   SYNTHESIZED NOTIFICATION AUDIO (Web Audio API)
   ========================================================================= */
function playChime(type = 'alert') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'critical') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(587.33, now + 0.15);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.start(now);
      osc.stop(now + 0.55);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    }
  } catch (e) {
    console.warn('Audio playback restricted by browser policy:', e);
  }
}

export default function App() {
  // Session Initialization from localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('cyberpredict_user');
      const isAuth = localStorage.getItem('cyberpredict_auth');
      return isAuth === 'true' && savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [alertData, setAlertData] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Master Alert Trigger with Audible Web Audio Synthesizer
  const triggerAlert = useCallback((type, title, message, duration = 7000) => {
    playChime(type === 'critical' ? 'critical' : 'normal');
    setAlertData({ type, title, message });
    if (duration > 0) {
      setTimeout(() => {
        setAlertData((prev) => (prev?.message === message ? null : prev));
      }, duration);
    }
  }, []);

  const handleLoginSuccess = (user) => {
    localStorage.setItem('cyberpredict_auth', 'true');
    localStorage.setItem('cyberpredict_role', user.role);
    localStorage.setItem('cyberpredict_user', JSON.stringify(user));
    setCurrentUser(user);

    setTimeout(() => {
      if (user.role === 'POLICE' || user.role === 'LEA_OFFICER') {
        triggerAlert(
          'critical',
          '🚨 ACTIVE TACTICAL INTERCEPT FLAGGED',
          'Hubballi LEA connected. High-risk withdrawal hotspot flagged. Beat patrol vectoring active.',
          7000
        );
      } else if (user.role === 'BANK' || user.role === 'BANK_NODAL') {
        triggerAlert(
          'warning',
          '🛡️ CFCFRMS LIEN FREEZE READY',
          'Connected to Bank FRM Cell. Beneficiary accounts flagged for immediate debit lien.',
          7000
        );
      } else if (user.role === 'I4C' || user.role === 'I4C_ADMIN') {
        triggerAlert(
          'critical',
          '🏛️ NATIONAL THREAT MATRIX SYNCHRONIZED',
          'I4C Command Matrix online. 8,000+ daily complaints ingestion feed streaming.',
          7000
        );
      } else if (user.role === 'CITIZEN') {
        triggerAlert(
          'info',
          '1930 Express Intake Ready',
          'Authentication complete. Enter incident details or speak to trigger proactive protection.',
          5000
        );
      }
    }, 400);
  };

  const handleLogout = () => {
    localStorage.removeItem('cyberpredict_auth');
    localStorage.removeItem('cyberpredict_role');
    localStorage.removeItem('cyberpredict_user');
    localStorage.removeItem('cyberpredict_receipt');
    triggerAlert('info', 'Session Terminated', 'You have securely signed out.');
    setCurrentUser(null);
  };

  const handleRoleSwitch = (newRole) => {
    const roleProfiles = {
      I4C: {
        name: 'Dr. R. Sharma (Director)',
        org: 'Indian Cyber Crime Coordination Centre (I4C)'
      },
      POLICE: {
        name: 'Insp. Rajesh Kumar',
        org: 'Hubballi Cyber Crime Police Station (LEA)'
      },
      BANK: {
        name: 'Vikram Desai (Nodal Head)',
        org: 'HDFC Bank FRM Desk'
      }
    };

    const updatedUser = {
      ...currentUser,
      role: newRole,
      name: roleProfiles[newRole]?.name || currentUser.name,
      org: roleProfiles[newRole]?.org || currentUser.org,
    };

    localStorage.setItem('cyberpredict_role', newRole);
    localStorage.setItem('cyberpredict_user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);

    triggerAlert(
      'info',
      `Switched to ${newRole === 'I4C' ? 'I4C Matrix' : (newRole === 'POLICE' ? 'Police LEA' : 'Bank FRM')}`,
      `Operational console updated for ${updatedUser.name}.`,
      4000
    );
  };

  // Unauthenticated View: Render Login Portal
  if (!currentUser) {
    return (
      <>
        {/* Floating Toast Alert Banner */}
        {alertData && (
          <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 bg-white/95 text-slate-900 px-5 py-4 rounded-xl shadow-xl border border-slate-200/90 max-w-md backdrop-blur-md transition-all duration-300 border-l-4 border-l-indigo-600">
            <div className="flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center text-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
              ℹ️
            </div>
            <div className="flex-1 pr-2">
              <div className="text-[10px] font-bold uppercase tracking-wider font-mono text-indigo-700">
                {alertData.title}
              </div>
              <div className="text-xs font-semibold text-slate-800 leading-snug mt-0.5">
                {alertData.message}
              </div>
            </div>
            <button
              onClick={() => setAlertData(null)}
              className="text-slate-400 hover:text-slate-700 text-xs px-2 py-1 rounded hover:bg-slate-100 transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
        <LoginPortal onLoginSuccess={handleLoginSuccess} triggerAlert={triggerAlert} />
      </>
    );
  }

  // Normalized active role
  const activeRole = currentUser.role === 'I4C_ADMIN' ? 'I4C' :
                     currentUser.role === 'LEA_OFFICER' ? 'POLICE' :
                     currentUser.role === 'BANK_NODAL' ? 'BANK' :
                     currentUser.role;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Floating Global Toast Alert Banner */}
      {alertData && (
        <div
          className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 bg-white/95 text-slate-900 px-5 py-4 rounded-xl shadow-xl border border-slate-200/90 max-w-md backdrop-blur-md transition-all duration-300 border-l-4 ${
            alertData.type === 'critical'
              ? 'border-l-rose-600 shadow-rose-100'
              : alertData.type === 'warning'
              ? 'border-l-amber-500 shadow-amber-100'
              : alertData.type === 'success'
              ? 'border-l-emerald-600 shadow-emerald-100'
              : 'border-l-indigo-600 shadow-indigo-100'
          }`}
        >
          <div
            className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center text-lg ${
              alertData.type === 'critical'
                ? 'bg-rose-50 border border-rose-200 animate-pulse'
                : alertData.type === 'warning'
                ? 'bg-amber-50 border border-amber-200'
                : alertData.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-indigo-50 border border-indigo-200'
            }`}
          >
            {alertData.type === 'critical' && '🚨'}
            {alertData.type === 'warning' && '⚠️'}
            {alertData.type === 'success' && '🛡️'}
            {alertData.type === 'info' && 'ℹ️'}
          </div>
          <div className="flex-1 pr-2">
            <div
              className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                alertData.type === 'critical'
                  ? 'text-rose-600'
                  : alertData.type === 'warning'
                  ? 'text-amber-700'
                  : alertData.type === 'success'
                  ? 'text-emerald-700'
                  : 'text-indigo-700'
              }`}
            >
              {alertData.title}
            </div>
            <div className="text-xs font-semibold text-slate-800 leading-snug mt-0.5">
              {alertData.message}
            </div>
          </div>
          <button
            onClick={() => setAlertData(null)}
            className="text-slate-400 hover:text-slate-700 text-xs px-2 py-1 rounded hover:bg-slate-100 transition cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Unified Platform Navbar */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        onOpenGuide={() => setIsGuideOpen(true)}
        onRoleSwitch={handleRoleSwitch}
      />

      {/* Main Workspace Mount */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeRole === 'CITIZEN' && (
          <CitizenPortal
            currentUser={currentUser}
            triggerAlert={triggerAlert}
            onComplaintLogged={() => {
              triggerAlert(
                'success',
                'TELEMETRY SYNCHRONIZED',
                'New prediction generated and pushed to police & bank dispatch queues.',
                5000
              );
            }}
          />
        )}

        {activeRole === 'POLICE' && (
          <PolicePortal triggerAlert={triggerAlert} />
        )}

        {activeRole === 'BANK' && (
          <BankPortal triggerAlert={triggerAlert} />
        )}

        {activeRole === 'I4C' && (
          <AdminPortal triggerAlert={triggerAlert} />
        )}
      </main>

      {/* Website Walkthrough Guide Modal */}
      {isGuideOpen && (
        <WebsiteGuideModal onClose={() => setIsGuideOpen(false)} />
      )}
    </div>
  );
}