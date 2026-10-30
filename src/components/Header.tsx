import React from 'react';
import { UserRole } from '../types/fdr';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Bell,
  Building2,
  Landmark,
  UserCheck,
  LogIn,
  LogOut,
  Sparkles,
  Box,
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  unreadAlertCount: number;
  onOpenNotifications: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onExitToLanding: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  unreadAlertCount,
  onOpenNotifications,
  activeTab,
  onSelectTab,
  onExitToLanding,
}) => {
  const { user, userProfile, signInWithGoogle, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onExitToLanding();
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Government of India Tricolor Ribbon */}
      <div className="h-1.5 w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]"></div>
        <div className="h-full w-1/3 bg-white"></div>
        <div className="h-full w-1/3 bg-[#138808]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 gap-4">
          {/* Brand Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onExitToLanding}
              title="Return to Public Landing Page"
              className="w-11 h-11 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 font-serif font-black shadow-inner cursor-pointer hover:bg-slate-800 transition-colors"
            >
              <span className="text-sm tracking-wider">AICTE</span>
            </button>
            <div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <span>अखिल भारतीय तकनीकी शिक्षा परिषद · Ministry of Education, Govt. of India</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight">
                  Security Deposit & FDR Management Portal
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  {currentRole === 'central_director'
                    ? 'Central Bureau (HQ)'
                    : currentRole === 'regional_officer'
                    ? 'Regional Scrutiny'
                    : currentRole === 'institute_head'
                    ? 'Technical Institute'
                    : 'Bank CBS Desk'}
                </span>
              </div>
            </div>
          </div>

          {/* User Profile, Role Switcher & Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Link to Landing Page */}
            <button
              onClick={onExitToLanding}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Go back to Public Landing Page"
            >
              <span>Public Portal</span>
            </button>

            {/* Role Switcher */}
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <label htmlFor="role-select" className="text-xs font-medium text-slate-500 px-2">
                Role:
              </label>
              <select
                id="role-select"
                aria-label="Switch User Role"
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded px-2.5 py-1 focus:outline-hidden cursor-pointer"
              >
                <option value="central_director">AICTE Central Bureau (HQ New Delhi)</option>
                <option value="regional_officer">Regional Scrutiny Officer</option>
                <option value="institute_head">Institute Representative / Principal</option>
                <option value="bank_officer">Scheduled Bank Verification Desk</option>
              </select>
            </div>

            {/* User Profile Box */}
            {userProfile || user ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 pr-2.5">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                    {(userProfile?.displayName || user?.displayName || userProfile?.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-[11px] font-bold text-slate-900 leading-tight truncate max-w-[130px]">
                    {userProfile?.displayName || user?.displayName || userProfile?.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold leading-none">
                    {user ? 'Google Synced' : 'Authorized Session'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                  title="Sign out to landing page"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span>Google Sign-In</span>
              </button>
            )}

            {/* Notification Trigger */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
              title="View Alerts & Escalation Notifications"
              aria-label="View Alerts & Escalation Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadAlertCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Primary Functional Tabs (No 3D vault) */}
        <nav className="flex space-x-1 overflow-x-auto py-1 border-t border-slate-100 text-sm font-medium">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Executive Dashboard
          </button>
          <button
            onClick={() => onSelectTab('repository')}
            className={`px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'repository'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Central Repository
          </button>
          <button
            onClick={() => onSelectTab('submission')}
            className={`px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'submission'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            + New Deposit Submission
          </button>
          <button
            onClick={() => onSelectTab('verification')}
            className={`px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'verification'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Bank Verification Desk</span>
            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
              CBS API
            </span>
          </button>
          <button
            onClick={() => onSelectTab('maturity')}
            className={`px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'maturity'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Maturity Radar
          </button>
          <button
            onClick={() => onSelectTab('release')}
            className={`px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'release'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Release & Refund
          </button>
          <button
            onClick={() => onSelectTab('ai_assistant')}
            className={`px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ai_assistant'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>AI Advisory Hub</span>
          </button>
          <button
            onClick={() => onSelectTab('aph_calculator')}
            className={`px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'aph_calculator'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            APH Norms
          </button>
          <button
            onClick={() => onSelectTab('audit_trail')}
            className={`px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'audit_trail'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Audit Trail
          </button>
        </nav>
      </div>
    </header>
  );
};
