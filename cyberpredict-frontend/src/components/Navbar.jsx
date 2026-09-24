import React from 'react';
import { 
  ShieldAlert, 
  Building2, 
  UserCircle, 
  LayoutDashboard, 
  LogOut, 
  ShieldCheck, 
  HelpCircle, 
  ChevronRight, 
  Home,
  FileDown
} from 'lucide-react';

export default function Navbar({ user, onLogout, onOpenGuide, onRoleSwitch }) {
  // Normalize role keys so both formats work seamlessly
  const normalizedRole = user?.role === 'I4C_ADMIN' ? 'I4C' :
                         user?.role === 'LEA_OFFICER' ? 'POLICE' :
                         user?.role === 'BANK_NODAL' ? 'BANK' :
                         user?.role || 'I4C';

  const roleConfig = {
    I4C: {
      label: 'I4C Command Matrix',
      icon: LayoutDashboard,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-600',
      breadcrumbRole: 'I4C Command Hub',
      breadcrumbSub: 'National Threat Matrix'
    },
    POLICE: {
      label: 'Police (LEA) Console',
      icon: ShieldAlert,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dotColor: 'bg-indigo-600',
      breadcrumbRole: 'Police LEA Operations',
      breadcrumbSub: 'Tactical Intercept Grid'
    },
    BANK: {
      label: 'Bank FRM Desk',
      icon: Building2,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-600',
      breadcrumbRole: 'Bank Nodal Desk',
      breadcrumbSub: 'CFCFRMS Lien & Restoration'
    },
    CITIZEN: {
      label: '1930 Citizen Portal',
      icon: UserCircle,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      dotColor: 'bg-amber-600',
      breadcrumbRole: 'Citizen Emergency Desk',
      breadcrumbSub: 'Express Intake & Reversals'
    }
  };

  const activeRole = roleConfig[normalizedRole] || roleConfig.I4C;
  const ActiveIcon = activeRole.icon;

  return (
    <header className="glass-surface-dense sticky top-0 z-50 shadow-sm border-b border-slate-200/60">
      {/* Top Navbar Row */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Left: Branding & Role Dropdown */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Futuristic Vector Shield Emblem */}
            <div className="relative h-10 w-10 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 via-indigo-700 to-blue-500 rounded-xl shadow-md shadow-indigo-300/50 flex items-center justify-center text-white">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L4 5V11C4 16.52 7.41 21.62 12 22C16.59 21.62 20 16.52 20 11V5L12 2Z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="1.5" fill="#a5b4fc" />
                </svg>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-base font-extrabold text-slate-900 tracking-tight">CYBERPREDICT</h1>
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <ShieldCheck size={11} className="text-indigo-600" /> v2.1
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-tight">National Cybercrime Predictive Analytics System</p>
            </div>
          </div>

          <div className="hidden sm:block h-7 w-[1px] bg-slate-200" />

          {/* Live National System Status Beacon */}
          <div className="hidden xl:flex items-center gap-2.5 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200 text-[11px] font-mono font-semibold text-slate-700 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>NCCRP LIVE SYNC</span>
            <span className="text-slate-300">|</span>
            <span className="text-violet-700 font-bold">12.4ms AI LAG</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-bold">96.8% ACC</span>
          </div>

          {/* Active Authorized Console Badge or Official 1-Click Role Switcher */}
          {normalizedRole === 'CITIZEN' ? (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-xl border text-xs font-semibold ${activeRole.badgeColor} shadow-2xs`}>
              <span className={`h-2 w-2 rounded-full animate-pulse ${activeRole.dotColor}`} />
              <ActiveIcon size={14} />
              <span className="font-heading font-bold">{activeRole.label}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => onRoleSwitch && onRoleSwitch('POLICE')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-heading font-bold transition flex items-center gap-1 cursor-pointer ${
                  normalizedRole === 'POLICE'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Switch to Police LEA Console"
              >
                <span>👮 <span className="hidden md:inline">Police</span> LEA</span>
              </button>
              <button
                type="button"
                onClick={() => onRoleSwitch && onRoleSwitch('BANK')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-heading font-bold transition flex items-center gap-1 cursor-pointer ${
                  normalizedRole === 'BANK'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Switch to Bank FRM Desk"
              >
                <span>🏦 <span className="hidden md:inline">Bank</span> FRM</span>
              </button>
              <button
                type="button"
                onClick={() => onRoleSwitch && onRoleSwitch('I4C')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-heading font-bold transition flex items-center gap-1 cursor-pointer ${
                  normalizedRole === 'I4C'
                    ? 'bg-white text-rose-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Switch to I4C Command Matrix"
              >
                <span>🏛️ <span className="hidden md:inline">I4C</span> Matrix</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Walkthrough Guide, User Info & Logout */}
        <div className="flex items-center gap-3 md:gap-4">
      

        

          <div className="text-right">
            <div className="text-xs font-bold text-slate-800 font-heading">
              {user?.name || 'Authorized Officer'}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {user?.org || 'Secured Gateway'}
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Terminate Session"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-xs font-semibold transition cursor-pointer hover:-translate-y-0.5"
          >
            <LogOut size={14} />
            <span className="hidden md:inline font-sans">Logout</span>
          </button>
        </div>
      </div>

      {/* Dynamic Breadcrumbs Navigation Bar */}
      <div className="bg-slate-50/95 border-t border-slate-200/80 px-4 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center text-[11px] font-mono text-slate-500 gap-1.5">
          <div className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 cursor-pointer">
            <Home size={12} />
            <span className="font-semibold">Home</span>
          </div>
          
          <ChevronRight size={12} className="text-slate-400" />
          
          <span className="text-slate-600 font-medium">
            {activeRole.breadcrumbRole}
          </span>
          
          <ChevronRight size={12} className="text-slate-400" />
          
          <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/70 shadow-2xs">
            {activeRole.breadcrumbSub}
          </span>
        </div>
      </div>
    </header>
  );
}