import React from 'react';
import { FDRRecord } from '../types/fdr';
import { formatINR, formatINRLakhsOrCrores, calculateDaysRemaining } from '../utils/fdrEngine';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertOctagon,
  FileCheck,
  Building,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface ExecutiveDashboardProps {
  records: FDRRecord[];
  onSelectFDR: (record: FDRRecord) => void;
  onNavigateTab: (tab: string, filter?: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  records,
  onSelectFDR,
  onNavigateTab,
}) => {
  const currentDate = '2026-10-30';

  // Metrics calculations
  const totalPortfolioAmount = records.reduce((sum, r) => sum + r.fdrAmount, 0);
  const activeRecords = records.filter((r) => r.status === 'active' || r.status === 'renewed');
  const activeCustodyAmount = activeRecords.reduce((sum, r) => sum + r.fdrAmount, 0);

  const overdueRecords = records.filter((r) => {
    if (r.status === 'released') return false;
    const days = calculateDaysRemaining(r.maturityDate, currentDate);
    return days < 0;
  });

  const expiring30Days = records.filter((r) => {
    if (r.status === 'released') return false;
    const days = calculateDaysRemaining(r.maturityDate, currentDate);
    return days >= 0 && days <= 30;
  });

  const expiring60Days = records.filter((r) => {
    if (r.status === 'released') return false;
    const days = calculateDaysRemaining(r.maturityDate, currentDate);
    return days > 30 && days <= 60;
  });

  const discrepantRecords = records.filter(
    (r) => r.status === 'discrepant' || r.verificationSource === 'discrepancy_flagged'
  );

  const releasePendingRecords = records.filter((r) => r.status === 'release_requested');

  // Bank-wise aggregation
  const bankDistribution = records.reduce<Record<string, { count: number; totalAmount: number }>>(
    (acc, r) => {
      const bank = r.bankName;
      if (!acc[bank]) acc[bank] = { count: 0, totalAmount: 0 };
      acc[bank].count += 1;
      acc[bank].totalAmount += r.fdrAmount;
      return acc;
    },
    {}
  );

  // Region-wise aggregation
  const regionDistribution = records.reduce<Record<string, { count: number; totalAmount: number }>>(
    (acc, r) => {
      const reg = r.region;
      if (!acc[reg]) acc[reg] = { count: 0, totalAmount: 0 };
      acc[reg].count += 1;
      acc[reg].totalAmount += r.fdrAmount;
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {/* Top Banner with Official Council Context */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span>Regulation Bureau</span>
              <span>·</span>
              <span>Approval Process Handbook (APH) Statutory Oversight</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              National Security Deposit & FDR Regulatory Dashboard
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Real-time monitoring of institutional Fixed Deposit Receipts (FDRs), continuous lien
              enforcements to Member Secretary AICTE, scheduled maturity tracking, and authorized refund clearances.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('submission')}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              + Submit Deposit
            </button>
            <button
              onClick={() => onNavigateTab('verification')}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Run CBS Reconciliation
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Tiles with Tabular Numerals */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Custody */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Total Portfolio Value</div>
          <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
            {formatINRLakhsOrCrores(totalPortfolioAmount)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {records.length} technical institutions
          </div>
        </div>

        {/* Active Under Custody */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Active Lien In Force</div>
          <div className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">
            {formatINRLakhsOrCrores(activeCustodyAmount)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {activeRecords.length} verified instruments
          </div>
        </div>

        {/* Overdue / Expired */}
        <div
          onClick={() => onNavigateTab('maturity')}
          className="bg-white border border-rose-200 rounded-xl p-4 shadow-xs cursor-pointer hover:border-rose-400 transition-colors"
        >
          <div className="text-xs font-medium text-rose-700 flex items-center justify-between">
            <span>Matured & Overdue</span>
            <AlertOctagon className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold text-rose-700 mt-1 tabular-nums">
            {overdueRecords.length}
          </div>
          <div className="text-[11px] text-rose-600 mt-1">Requires renewal intimation</div>
        </div>

        {/* Expiring in 30 Days */}
        <div
          onClick={() => onNavigateTab('maturity')}
          className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="text-xs font-medium text-amber-700 flex items-center justify-between">
            <span>Expiring ≤ 30 Days</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold text-amber-700 mt-1 tabular-nums">
            {expiring30Days.length}
          </div>
          <div className="text-[11px] text-amber-600 mt-1">Critical countdown</div>
        </div>

        {/* Discrepancies */}
        <div
          onClick={() => onNavigateTab('verification')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="text-xs font-medium text-slate-600 flex items-center justify-between">
            <span>Discrepant Flags</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
            {discrepantRecords.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Lien or amount mismatch</div>
        </div>

        {/* Release Requests */}
        <div
          onClick={() => onNavigateTab('release')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="text-xs font-medium text-slate-600 flex items-center justify-between">
            <span>Release In-Review</span>
            <FileCheck className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
            {releasePendingRecords.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">10-year tenure review</div>
        </div>
      </div>

      {/* Grid: Priority Attention Radar & Maturity Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Urgent Actions & Pending Scrutiny */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Priority Action Workbench</h3>
              <p className="text-xs text-slate-500">
                Instruments requiring immediate regional intervention, renewal reminder, or discrepancy resolution.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('repository')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              <span>View All ({records.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {/* Show top critical items without duplicates */}
            {Array.from(
              new Map(
                [...overdueRecords, ...expiring30Days, ...discrepantRecords, ...releasePendingRecords].map((r) => [r.id, r])
              ).values()
            )
              .slice(0, 5)
              .map((rec) => {
                const daysLeft = calculateDaysRemaining(rec.maturityDate, currentDate);
                return (
                  <div
                    key={rec.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition-colors cursor-pointer"
                    onClick={() => onSelectFDR(rec)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          {rec.fdrNumber}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs font-medium text-slate-600">
                          {rec.bankName}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          ID: {rec.permanentInstituteId}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {rec.instituteName}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>{rec.category}</span>
                        <span>·</span>
                        <span>{rec.region}</span>
                        <span>·</span>
                        <span className="font-semibold text-slate-700 tabular-nums">
                          {formatINR(rec.fdrAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                      {daysLeft < 0 ? (
                        <div className="text-right">
                          <span className="text-xs font-bold text-rose-700">Matured Overdue</span>
                          <div className="text-[11px] text-rose-600 tabular-nums">
                            {Math.abs(daysLeft)} days past
                          </div>
                        </div>
                      ) : daysLeft <= 30 ? (
                        <div className="text-right">
                          <span className="text-xs font-bold text-amber-700">Expiring Soon</span>
                          <div className="text-[11px] text-amber-600 tabular-nums">
                            {daysLeft} days left
                          </div>
                        </div>
                      ) : rec.status === 'discrepant' ? (
                        <div className="text-right">
                          <span className="text-xs font-bold text-rose-600">Discrepancy</span>
                          <div className="text-[11px] text-slate-500">Bank mismatch</div>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-xs font-bold text-blue-700">Release In-Review</span>
                          <div className="text-[11px] text-slate-500">10 yrs completed</div>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFDR(rec);
                        }}
                        className="text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-400 px-2.5 py-1 rounded"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Column: Maturity Horizon Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Maturity Horizon Radar</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated 90-60-30 day statutory intimation ladder
            </p>

            <div className="mt-4 space-y-3">
              {/* Overdue */}
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg">
                <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                  <span>Matured & Overdue</span>
                  <span className="tabular-nums font-mono">{overdueRecords.length} Instruments</span>
                </div>
                <div className="text-[11px] text-rose-700 mt-1">
                  Value: {formatINRLakhsOrCrores(overdueRecords.reduce((s, r) => s + r.fdrAmount, 0))}
                </div>
              </div>

              {/* 0 - 30 Days */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Expiring within 30 Days</span>
                  <span className="tabular-nums font-mono">{expiring30Days.length} Instruments</span>
                </div>
                <div className="text-[11px] text-amber-700 mt-1">
                  Value: {formatINRLakhsOrCrores(expiring30Days.reduce((s, r) => s + r.fdrAmount, 0))}
                </div>
              </div>

              {/* 31 - 60 Days */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Expiring in 31 - 60 Days</span>
                  <span className="tabular-nums font-mono">{expiring60Days.length} Instruments</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Value: {formatINRLakhsOrCrores(expiring60Days.reduce((s, r) => s + r.fdrAmount, 0))}
                </div>
              </div>

              {/* Safe Horizon (>60 Days) */}
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>Safe Horizon (&gt;60 Days)</span>
                  <span className="tabular-nums font-mono">
                    {records.length - (overdueRecords.length + expiring30Days.length + expiring60Days.length)} Instruments
                  </span>
                </div>
                <div className="text-[11px] text-emerald-700 mt-1">
                  Under active lien in designated scheduled banks
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab('maturity')}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <span>Launch Maturity & Renewal Management</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Distribution Analysis: Bank-wise & Regional Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Issuing Bank Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Scheduled Commercial Bank Distribution</h3>
              <p className="text-xs text-slate-500">
                Deposit concentration across authorized RBI scheduled banks
              </p>
            </div>
            <LandmarkBadge bankCount={Object.keys(bankDistribution).length} />
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {Object.entries(bankDistribution).map(([bank, data]) => {
              const pct = Math.round((data.totalAmount / totalPortfolioAmount) * 100);
              return (
                <div key={bank} className="py-2.5 flex items-center justify-between text-sm">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 text-xs sm:text-sm">{bank}</div>
                    <div className="text-[11px] text-slate-500">
                      {data.count} FDRs · {pct}% of total custody portfolio
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums">
                      {formatINR(data.totalAmount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AICTE Regional Offices Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">AICTE Regional Office Jurisdiction</h3>
              <p className="text-xs text-slate-500">
                Custodial oversight partitioned by regional bureau offices
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">7 Regions</span>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {Object.entries(regionDistribution).map(([region, data]) => (
              <div key={region} className="py-2.5 flex items-center justify-between text-sm">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 text-xs sm:text-sm">{region}</div>
                  <div className="text-[11px] text-slate-500">
                    {data.count} technical institutions monitored
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums">
                    {formatINR(data.totalAmount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LandmarkBadge: React.FC<{ bankCount: number }> = ({ bankCount }) => (
  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
    {bankCount} Banks
  </span>
);
