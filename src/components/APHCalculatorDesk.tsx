import React, { useState } from 'react';
import {
  calculateAPHNormRequiredFDR,
  calculateMaturityYield,
  formatINR,
  formatINRLakhsOrCrores,
} from '../utils/fdrEngine';
import { InstituteCategory } from '../types/fdr';
import { Calculator, BookOpen, CheckCircle2, TrendingUp, ShieldAlert, Sparkles } from 'lucide-react';

export const APHCalculatorDesk: React.FC = () => {
  // APH Calculator state
  const [selectedCategory, setSelectedCategory] = useState<InstituteCategory>('Engineering & Technology');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('Establishment of New Technical Institution');
  const [isConcession, setIsConcession] = useState<boolean>(false);
  const [divisionIntakeCount, setDivisionIntakeCount] = useState<number>(1);

  // Interest Yield Calculator state
  const [calcPrincipal, setCalcPrincipal] = useState<number>(3500000);
  const [calcRate, setCalcRate] = useState<number>(7.1);
  const [calcTenureYears, setCalcTenureYears] = useState<number>(10);

  const aphResult = calculateAPHNormRequiredFDR(selectedCategory, selectedPurpose, isConcession);
  const yieldResult = calculateMaturityYield(calcPrincipal, calcRate, calcTenureYears * 12);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span>Statutory Reference & Actuarial Calculator</span>
              <span>·</span>
              <span>AICTE Approval Process Handbook (APH 2024-27)</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              APH Security Deposit Norms & Yield Calculator
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Determine mandatory Fixed Deposit requirements based on statutory institutional discipline,
              approval purpose, and concessional categories. Simulate quarterly compounding maturity yields.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Regulatory Cycle: 2024-2027
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Statutory APH Deposit Calculator */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-slate-700" />
              <span>Mandatory Security Deposit Estimator</span>
            </div>
            <span className="text-xs font-semibold text-slate-500">APH Chapter 1</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Technical Discipline / Faculty
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as InstituteCategory)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-medium text-slate-800"
              >
                <option value="Engineering & Technology">Engineering & Technology (Degree / Diploma)</option>
                <option value="Management (PGDM/MBA)">Management (Standalone PGDM / MBA)</option>
                <option value="Pharmacy">Pharmacy (Degree / Pharm.D)</option>
                <option value="Architecture & Planning">Architecture & Planning</option>
                <option value="Hotel Management & Catering">Hotel Management & Catering (HMCT)</option>
                <option value="Applied Arts & Crafts">Applied Arts & Crafts</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Regulatory Purpose
              </label>
              <select
                value={selectedPurpose}
                onChange={(e) => setSelectedPurpose(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-medium text-slate-800"
              >
                <option value="Establishment of New Technical Institution">
                  Establishment of New Technical Institution
                </option>
                <option value="Introduction of New Course / Program">
                  Introduction of New Course / Program (Per Division)
                </option>
                <option value="Increase in Approved Intake">
                  Increase in Approved Intake (Per 60 Intake Division)
                </option>
              </select>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
              <label className="flex items-start gap-2 cursor-pointer text-slate-800 font-medium">
                <input
                  type="checkbox"
                  checked={isConcession}
                  onChange={(e) => setIsConcession(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-slate-900"
                />
                <span>
                  Women-Exclusive, Minority, or Divyang Institutional Concession (20% reduction under APH norms)
                </span>
              </label>
            </div>
          </div>

          {/* Computed Output Box */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">
                  Required Security Deposit (FDR)
                </span>
                <div className="text-2xl font-bold tabular-nums text-amber-400 mt-0.5">
                  {formatINR(aphResult.requiredAmountINR)}
                </div>
                <div className="text-xs text-slate-300">
                  Equivalent to {aphResult.requiredAmountLakhs} Lakhs
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">
                  Mandatory Lock-in
                </span>
                <div className="text-xl font-bold mt-0.5">{aphResult.lockInYears} Years</div>
                <div className="text-[11px] text-emerald-400">Fixed Joint Custody</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Statutory Authority: {aphResult.aphReference}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Interest Yield & Compounding Simulator */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-700" />
              <span>Quarterly Compounding Maturity Simulator</span>
            </div>
            <span className="text-xs font-semibold text-slate-500">RBI Standard</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Principal Amount (INR)
              </label>
              <input
                type="number"
                value={calcPrincipal}
                onChange={(e) => setCalcPrincipal(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-bold text-slate-900 tabular-nums"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Interest Rate (% p.a.)
              </label>
              <input
                type="number"
                step="0.05"
                value={calcRate}
                onChange={(e) => setCalcRate(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md tabular-nums"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tenure (Years)</label>
              <input
                type="number"
                value={calcTenureYears}
                onChange={(e) => setCalcTenureYears(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md tabular-nums"
              />
            </div>
          </div>

          {/* Yield Result Display */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-emerald-900 font-semibold block text-[11px]">
                  Estimated Maturity Value
                </span>
                <span className="text-xl font-bold text-emerald-950 tabular-nums">
                  {formatINR(yieldResult.maturityValue)}
                </span>
                <div className="text-[11px] text-emerald-700">
                  {formatINRLakhsOrCrores(yieldResult.maturityValue)}
                </div>
              </div>

              <div>
                <span className="text-emerald-900 font-semibold block text-[11px]">
                  Total Accrued Interest
                </span>
                <span className="text-xl font-bold text-emerald-800 tabular-nums">
                  {formatINR(yieldResult.interestEarned)}
                </span>
                <div className="text-[11px] text-emerald-700">Compounded Quarterly</div>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200 text-[11px] text-emerald-800">
              Note: Accrued interest is non-withdrawable during the lock-in period and is subject to
              final discharge upon regulatory clearance.
            </div>
          </div>

          {/* Quick Benchmark Reference Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2 px-3">Discipline</th>
                  <th className="py-2 px-3">Standard Norm</th>
                  <th className="py-2 px-3">Lock-In</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                <tr>
                  <td className="py-2 px-3 font-medium">Engineering & Tech (Degree)</td>
                  <td className="py-2 px-3 font-bold tabular-nums">₹35 Lakhs</td>
                  <td className="py-2 px-3">10 Years</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Management (PGDM/MBA)</td>
                  <td className="py-2 px-3 font-bold tabular-nums">₹25 Lakhs</td>
                  <td className="py-2 px-3">8 Years</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Pharmacy (Degree)</td>
                  <td className="py-2 px-3 font-bold tabular-nums">₹30 Lakhs</td>
                  <td className="py-2 px-3">8 Years</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Architecture & Planning</td>
                  <td className="py-2 px-3 font-bold tabular-nums">₹20 Lakhs</td>
                  <td className="py-2 px-3">8 Years</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Increase in Intake</td>
                  <td className="py-2 px-3 font-bold tabular-nums">+₹5 Lakhs / 60 seats</td>
                  <td className="py-2 px-3">5 Years</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
