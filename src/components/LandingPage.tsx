import React, { useState } from 'react';
import { UserRole, FDRRecord } from '../types/fdr';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Building2,
  Landmark,
  UserCheck,
  LogIn,
  Search,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Clock,
  ArrowRight,
  Sparkles,
  Lock,
  ExternalLink,
  ChevronRight,
  Shield,
  HelpCircle,
  X,
  FileText,
} from 'lucide-react';

interface LandingPageProps {
  records: FDRRecord[];
  onLoginSuccess: (role: UserRole, targetTab?: string) => void;
  onExplorePublicNorms?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  records,
  onLoginSuccess,
  onExplorePublicNorms,
}) => {
  const { signInWithGoogle, loginWithCredentials, authError, clearAuthError } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('central_director');
  const [emailInput, setEmailInput] = useState<string>('director.regulation@aicte-india.org');
  const [passwordInput, setPasswordInput] = useState<string>('••••••••••••');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Public search query
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResult, setSearchResult] = useState<FDRRecord | null>(null);
  const [searched, setSearched] = useState<boolean>(false);

  // Role credentials definitions
  const rolePresets: Record<
    UserRole,
    {
      title: string;
      desc: string;
      email: string;
      badge: string;
      icon: React.ReactNode;
      defaultTab: string;
      jurisdiction: string;
    }
  > = {
    central_director: {
      title: 'AICTE Central Bureau',
      desc: 'HQ New Delhi · Full executive supervisory, regulatory overrides & refund sanction authority',
      email: 'director.regulation@aicte-india.org',
      badge: 'Statutory Regulator',
      icon: <ShieldCheck className="w-5 h-5 text-amber-600" />,
      defaultTab: 'dashboard',
      jurisdiction: 'National Headquarters, New Delhi',
    },
    regional_officer: {
      title: 'Regional Scrutiny Officer',
      desc: 'Northern Regional Office · Jurisdictional FDR verification & discrepancy auditing',
      email: 'ro.northern@aicte-india.org',
      badge: 'Regional Jurisdiction',
      icon: <Building2 className="w-5 h-5 text-blue-600" />,
      defaultTab: 'repository',
      jurisdiction: 'Northern Region (Kanpur)',
    },
    institute_head: {
      title: 'Institution Representative / Principal',
      desc: 'Techno Institute of Technology · FDR submission, 10-yr lock-in tracking & refund petitioning',
      email: 'principal@techno-inst.edu.in',
      badge: 'Approved Institution',
      icon: <UserCheck className="w-5 h-5 text-emerald-600" />,
      defaultTab: 'submission',
      jurisdiction: 'Permanent ID: 1-458921102',
    },
    bank_officer: {
      title: 'Scheduled Bank Officer (CBS Nodal)',
      desc: 'State Bank of India · Real-time Finacle/BaNCS CBS verification & lien confirmation',
      email: 'nodal.cbs@sbi.co.in',
      badge: 'Scheduled Bank Desk',
      icon: <Landmark className="w-5 h-5 text-purple-600" />,
      defaultTab: 'verification',
      jurisdiction: 'Treasury & Institutional Banking',
    },
  };

  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSelectRolePreset = (role: UserRole) => {
    setSelectedRole(role);
    setEmailInput(rolePresets[role].email);
    setPasswordInput('');
    setLoginError(null);
  };

  const handleOpenLoginModalForRole = (role: UserRole) => {
    handleSelectRolePreset(role);
    setShowLoginModal(true);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!passwordInput || passwordInput.trim().length === 0) {
      setLoginError('Security password is required. (Enter your password or use test password: aicte@2026)');
      return;
    }

    if (!emailInput || !emailInput.includes('@')) {
      setLoginError('Please enter a valid official institutional email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const preset = rolePresets[selectedRole];
      await loginWithCredentials(selectedRole, emailInput, preset.title, preset.jurisdiction);
      setIsSubmitting(false);
      setShowLoginModal(false);
      onLoginSuccess(selectedRole, preset.defaultTab);
    } catch (err: any) {
      setIsSubmitting(false);
      setLoginError(err?.message || 'Authentication error. Please verify your credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      setIsSubmitting(false);
      setShowLoginModal(false);
      onLoginSuccess(selectedRole, rolePresets[selectedRole].defaultTab);
    } catch {
      setIsSubmitting(false);
    }
  };

  const handlePublicSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim().toLowerCase();
    if (!clean) return;
    const found = records.find(
      (r) =>
        r.fdrNumber.toLowerCase().includes(clean) ||
        r.permanentInstituteId.toLowerCase().includes(clean) ||
        r.instituteName.toLowerCase().includes(clean)
    );
    setSearchResult(found || null);
    setSearched(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-amber-200">
      {/* Top Tricolor Strip */}
      <div className="h-1.5 w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]"></div>
        <div className="h-full w-1/3 bg-white"></div>
        <div className="h-full w-1/3 bg-[#138808]"></div>
      </div>

      {/* Official Government Top Navigation */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            {/* National Branding */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 font-serif font-black shadow-inner">
                <span className="text-sm tracking-widest">AICTE</span>
              </div>
              <div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  अखिल भारतीय तकनीकी शिक्षा परिषद · Ministry of Education, Govt. of India
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-950 tracking-tight flex items-center gap-2">
                  <span>Security Deposit & FDR Management Portal</span>
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    APH 2024-27 Live
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Login CTA */}
            <div className="flex items-center gap-3">
              <a
                href="#verify-section"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Public Verification</span>
              </a>

              <button
                onClick={() => {
                  setSelectedRole('central_director');
                  setEmailInput(rolePresets.central_director.email);
                  setShowLoginModal(true);
                }}
                className="px-4 py-2 text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                <span>Portal Login</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 border-b border-slate-200 py-12 md:py-20">
        {/* Subtle decorative grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Mission & Headline */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span>AICTE Regulation Bureau · Problem Statement #26265</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
                Streamlining Security Deposits & Fixed Deposit Receipts for Technical Institutions
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                A unified, tamper-evident digital architecture for the submission, Finacle/BaNCS CBS verification, automated 10-year lock-in surveillance, renewal tracking, and statutory release of institutional security deposits.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>Access Stakeholder Desk</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <a
                  href="#verify-section"
                  className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-xl border border-slate-300 shadow-xs hover:border-slate-400 transition-all flex items-center gap-2"
                >
                  <Search className="w-4 h-4 text-blue-600" />
                  <span>Verify FDR Record</span>
                </a>

                <button
                  onClick={onExplorePublicNorms}
                  className="px-4 py-3 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>View APH 2024-27 Norms</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 border-t border-slate-200">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Joint Lien with AICTE Member Secretary</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Core Banking CBS Probing</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>10-Year Statutory Lock-in Tracker</span>
                </div>
              </div>
            </div>

            {/* Right Column: Quick Role Sign-in Cards */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xl shadow-slate-200/50">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Stakeholder Gateway</h3>
                    <p className="text-xs text-slate-500">Select your authorized regulatory portal role</p>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-50 text-amber-900 rounded border border-amber-300">
                    🔒 Sign-in Required
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  {(Object.keys(rolePresets) as UserRole[]).map((roleKey) => {
                    const preset = rolePresets[roleKey];
                    return (
                      <button
                        key={roleKey}
                        onClick={() => handleOpenLoginModalForRole(roleKey)}
                        className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-slate-900 hover:bg-slate-50/80 transition-all flex items-start gap-3 group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white group-hover:shadow-xs transition-colors shrink-0">
                          {preset.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-blue-900">
                              {preset.title}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {preset.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {preset.jurisdiction}
                          </p>
                          <div className="mt-1 text-[10px] font-mono text-slate-500 group-hover:text-blue-700 flex items-center gap-1 font-medium">
                            <span>Login ID: {preset.email} · Click to Sign In →</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 shrink-0 self-center transition-transform group-hover:translate-x-0.5" />
                      </button>
                    );
                  })}
                </div>

                {/* Additional Google / Custom Login Link */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Need specific credentials?</span>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Custom Login Form</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Key Metrics Ticker */}
      <section className="bg-slate-900 text-white py-6 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="border-r border-slate-800/80 last:border-r-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                ₹288.40 Cr
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                Total Custodial Guarantee
              </div>
            </div>
            <div className="border-r border-slate-800/80 last:border-r-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                10,480+
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                Approved Technical Institutes
              </div>
            </div>
            <div className="border-r border-slate-800/80 last:border-r-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                34
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                Scheduled Commercial Banks
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono">
                100%
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                CBS Lien Verification Compliance
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Capabilities */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">
              Statutory Capabilities · AICTE Regulation Bureau
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              End-to-End Governance Across the Entire FDR Lifecycle
            </h3>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Replacing fragmented paper records and manual correspondence with an integrated regulatory infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Capability 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Centralized Deposit Repository
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Institution-wise and instrument-wise digital records with joint-name custody details, issuing bank branches, IFSC, deposit terms, and permanent institute IDs.
              </p>
            </div>

            {/* Capability 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-4">
                <Landmark className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Core Banking CBS Verification
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Real-time API cross-referencing against Finacle and BaNCS to confirm genuine deposit creation, non-encumbrance status, and lien markings in favor of AICTE.
              </p>
            </div>

            {/* Capability 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Automated Maturity Radar
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Pre-emptive notification ladder dispatching alerts at 90, 60, 30, and 15 days before maturity to prevent unauthorized bank auto-liquidations.
              </p>
            </div>

            {/* Capability 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-4">
                <FileCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Renewal & Replacement Tracking
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Seamless linking of rollover FDRs, preserving chronological parent-child audit trails, updated interest rate records, and revised maturity milestones.
              </p>
            </div>

            {/* Capability 5 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Statutory Release & Refund
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Rigorous 10-year lock-in fulfillment check, autonomous APH condition verification, regional scrutiny clearance, and digitally authorized discharge letters.
              </p>
            </div>

            {/* Capability 6 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                APH Norms & Scrutiny Engine
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Automated deposit calculation for new colleges, seat expansions, minority concessions, and women's colleges with instant AICTE formula validation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Public FDR & Verification Search Desk */}
      <section id="verify-section" className="py-14 bg-slate-100 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">
                  Public FDR Verification & Status Inquiry
                </h3>
                <p className="text-xs text-slate-500">
                  Check the registration, bank lien status, and regulatory validity of an institutional FDR
                </p>
              </div>
            </div>

            <form onSubmit={handlePublicSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter FDR Number (e.g. FDR-SBI-2024-8841) or Institute ID (e.g. 1-458921102)"
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs shrink-0 cursor-pointer"
              >
                Query Status
              </button>
            </form>

            {/* Search Suggestions */}
            <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500">
              <span className="font-semibold">Quick test inputs:</span>
              <button
                type="button"
                onClick={() => setSearchQuery('FDR-SBI-2024-8841')}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                FDR-SBI-2024-8841
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setSearchQuery('FDR-PNB-2023-4109')}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                FDR-PNB-2023-4109
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setSearchQuery('1-458921102')}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                1-458921102
              </button>
            </div>

            {/* Result Display */}
            {searched && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                {searchResult ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                          Permanent ID: {searchResult.permanentInstituteId}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {searchResult.instituteName}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Status: {searchResult.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          Lien Marked: {searchResult.lienMarked ? 'YES (Verified)' : 'NO'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">FDR Certificate</span>
                        <span className="font-mono font-bold text-slate-800">
                          {searchResult.fdrNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Issuing Bank</span>
                        <span className="font-semibold text-slate-800">
                          {searchResult.bankName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Maturity Date</span>
                        <span className="font-semibold text-slate-800">
                          {searchResult.maturityDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Lock-in Period</span>
                        <span className="font-semibold text-slate-800">
                          {searchResult.lockInPeriodYears} Years ({searchResult.releaseDetails?.lockInTenureMet ? 'Tenure Fulfilled' : 'Active Custody'})
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      No active security deposit or FDR found matching &quot;{searchQuery}&quot;. Please verify the registration number or login for full records.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Integration with Scheduled Commercial Banks */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
            Authorized Integration with Major Scheduled Commercial Banks
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-slate-600 font-semibold text-sm">
            <span className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
              State Bank of India (SBI)
            </span>
            <span className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
              Punjab National Bank (PNB)
            </span>
            <span className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
              Canara Bank
            </span>
            <span className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
              Bank of Baroda
            </span>
            <span className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
              Union Bank of India
            </span>
            <span className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
              HDFC Bank (Institutional)
            </span>
            <span className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
              ICICI Bank
            </span>
          </div>
        </div>
      </section>

      {/* Official Government Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
            <div>
              <div className="font-bold text-white text-sm mb-2">
                All India Council for Technical Education (AICTE)
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Statutory body under Department of Higher Education, Ministry of Education, Government of India.
                Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070.
              </p>
            </div>
            <div>
              <div className="font-bold text-white text-sm mb-2">Regulatory Authority</div>
              <ul className="space-y-1 text-[11px]">
                <li>AICTE Approval Process Handbook (APH) 2024-27</li>
                <li>Joint Lien Custody Regulations</li>
                <li>Core Banking System (Finacle / BaNCS) Direct Verification</li>
                <li>National Informatics Centre (NIC) Compliance</li>
              </ul>
            </div>
            <div>
              <div className="font-bold text-white text-sm mb-2">Technical Assistance</div>
              <p className="text-[11px] leading-relaxed">
                FDR Support Desk: 011-29581000 / 29581050<br />
                Email: helpdesk-fdr@aicte-india.org<br />
                Working Hours: 09:30 AM to 05:30 PM (Mon-Fri)
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div>© {new Date().getFullYear()} AICTE Regulation Bureau · Government of India</div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>NIC Guidelines</span>
              <span>·</span>
              <span>Terms of Service</span>
              <span>·</span>
              <span>Security Policy</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Stakeholder Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold font-serif text-sm">
                  AICTE
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Official Portal Login</h3>
                  <p className="text-xs text-slate-400">
                    Select your stakeholder role to access your designated workspace
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Notification */}
            {(authError || loginError) && (
              <div className="bg-rose-50 border-b border-rose-200 p-3 text-xs text-rose-800 flex items-center justify-between">
                <span>{loginError || authError}</span>
                <button
                  type="button"
                  onClick={() => {
                    setLoginError(null);
                    clearAuthError();
                  }}
                  className="font-bold underline text-rose-900 ml-2 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Stakeholder Role Radio / Button Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Select Stakeholder Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(rolePresets) as UserRole[]).map((rKey) => {
                    const preset = rolePresets[rKey];
                    const isSelected = selectedRole === rKey;
                    return (
                      <button
                        key={rKey}
                        type="button"
                        onClick={() => handleSelectRolePreset(rKey)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isSelected ? 'bg-slate-800 text-amber-400' : 'bg-slate-100'
                          }`}
                        >
                          {preset.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{preset.title}</div>
                          <div
                            className={`text-[10px] truncate ${
                              isSelected ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {preset.badge}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email / Government ID *
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Security Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordInput('aicte@2026');
                        setLoginError(null);
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                    >
                      Fill Demo Password (aicte@2026)
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Enter password to authenticate"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Authentication required. Enter your password to access the {rolePresets[selectedRole].title} workspace.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4 text-amber-400" />
                    <span>
                      {isSubmitting
                        ? 'Authenticating...'
                        : `Sign In as ${rolePresets[selectedRole].title}`}
                    </span>
                  </button>
                </div>
              </form>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-semibold">
                  Or Sign In via Google
                </span>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-300 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
