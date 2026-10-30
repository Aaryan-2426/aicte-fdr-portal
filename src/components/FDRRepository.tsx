import React, { useState, useMemo } from 'react';
import { FDRRecord } from '../types/fdr';
import { formatINR, calculateDaysRemaining } from '../utils/fdrEngine';
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  FileText,
  RotateCw,
  ExternalLink,
} from 'lucide-react';

interface FDRRepositoryProps {
  records: FDRRecord[];
  onSelectFDR: (record: FDRRecord) => void;
  onInitiateRenewal: (record: FDRRecord) => void;
  onInitiateBankVerify: (record: FDRRecord) => void;
  initialFilter?: string;
}

export const FDRRepository: React.FC<FDRRepositoryProps> = ({
  records,
  onSelectFDR,
  onInitiateRenewal,
  onInitiateBankVerify,
  initialFilter = 'all',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilter);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const currentDate = '2026-10-30';

  // Unique dropdown lists
  const banks = useMemo(() => Array.from(new Set(records.map((r) => r.bankName))), [records]);
  const regions = useMemo(() => Array.from(new Set(records.map((r) => r.region))), [records]);
  const categories = useMemo(() => Array.from(new Set(records.map((r) => r.category))), [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.instituteName.toLowerCase().includes(q) ||
        r.fdrNumber.toLowerCase().includes(q) ||
        r.permanentInstituteId.toLowerCase().includes(q) ||
        r.aicteApplicationNo.toLowerCase().includes(q) ||
        r.bankName.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Status filter
      if (selectedStatus !== 'all') {
        const daysLeft = calculateDaysRemaining(r.maturityDate, currentDate);
        if (selectedStatus === 'overdue' && (daysLeft >= 0 || r.status === 'released')) return false;
        if (selectedStatus === 'expiring_30' && (daysLeft < 0 || daysLeft > 30 || r.status === 'released'))
          return false;
        if (selectedStatus === 'active' && r.status !== 'active') return false;
        if (selectedStatus === 'discrepant' && r.status !== 'discrepant') return false;
        if (selectedStatus === 'release_requested' && r.status !== 'release_requested') return false;
        if (selectedStatus === 'released' && r.status !== 'released') return false;
      }

      // Region filter
      if (selectedRegion !== 'all' && r.region !== selectedRegion) return false;

      // Bank filter
      if (selectedBank !== 'all' && r.bankName !== selectedBank) return false;

      // Category filter
      if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;

      return true;
    });
  }, [records, searchQuery, selectedStatus, selectedRegion, selectedBank, selectedCategory]);

  // Export to CSV function
  const handleExportCSV = () => {
    const headers = [
      'Permanent Institute ID',
      'Institute Name',
      'Region',
      'FDR Number',
      'Bank Name',
      'Branch',
      'IFSC',
      'Amount (INR)',
      'Issue Date',
      'Maturity Date',
      'Lien Marked to AICTE',
      'Status',
      'Verification Source',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.permanentInstituteId}"`,
      `"${r.instituteName.replace(/"/g, '""')}"`,
      `"${r.region}"`,
      `"${r.fdrNumber}"`,
      `"${r.bankName}"`,
      `"${r.branchName}"`,
      `"${r.ifscCode}"`,
      r.fdrAmount,
      r.issueDate,
      r.maturityDate,
      r.lienMarked ? 'Yes' : 'No',
      `"${r.status}"`,
      `"${r.verificationSource}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AICTE_Security_Deposit_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusDisplay = (rec: FDRRecord) => {
    const daysLeft = calculateDaysRemaining(rec.maturityDate, currentDate);

    if (rec.status === 'released') {
      return (
        <div className="text-slate-600 font-semibold text-xs flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Discharged & Refunded</span>
        </div>
      );
    }

    if (rec.status === 'discrepant') {
      return (
        <div className="text-rose-700 font-bold text-xs flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>Discrepancy Flagged</span>
        </div>
      );
    }

    if (rec.status === 'release_requested') {
      return (
        <div className="text-blue-700 font-bold text-xs flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <span>Release In Scrutiny</span>
        </div>
      );
    }

    if (daysLeft < 0) {
      return (
        <div className="text-rose-700 font-bold text-xs flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>Matured ({Math.abs(daysLeft)}d overdue)</span>
        </div>
      );
    }

    if (daysLeft <= 30) {
      return (
        <div className="text-amber-700 font-bold text-xs flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Expiring in {daysLeft} days</span>
        </div>
      );
    }

    return (
      <div className="text-emerald-700 font-semibold text-xs flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Active & Lien Held</span>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Search & Filter Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Institution Name, Permanent Institute ID, FDR No, or Bank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          {/* Export Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 hover:border-slate-400 text-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              title="Download official regulatory register as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Regulatory Register</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Status Filter */}
          <div>
            <label className="block text-slate-500 font-medium mb-1">Status</label>
            <select
              aria-label="Filter by Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 font-medium text-slate-800 focus:outline-hidden focus:bg-white"
            >
              <option value="all">All Statuses ({records.length})</option>
              <option value="active">Active & Lien Held</option>
              <option value="expiring_30">Expiring ≤ 30 Days</option>
              <option value="overdue">Matured & Overdue</option>
              <option value="discrepant">Discrepancy Flagged</option>
              <option value="release_requested">Release In Scrutiny</option>
              <option value="released">Discharged / Refunded</option>
            </select>
          </div>

          {/* Region Filter */}
          <div>
            <label className="block text-slate-500 font-medium mb-1">Regional Office</label>
            <select
              aria-label="Filter by Regional Office"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 font-medium text-slate-800 focus:outline-hidden focus:bg-white"
            >
              <option value="all">All AICTE Regions</option>
              {regions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* Bank Filter */}
          <div>
            <label className="block text-slate-500 font-medium mb-1">Issuing Bank</label>
            <select
              aria-label="Filter by Issuing Bank"
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 font-medium text-slate-800 focus:outline-hidden focus:bg-white"
            >
              <option value="all">All Scheduled Banks</option>
              {banks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Discipline Category Filter */}
          <div>
            <label className="block text-slate-500 font-medium mb-1">Technical Category</label>
            <select
              aria-label="Filter by Technical Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 font-medium text-slate-800 focus:outline-hidden focus:bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main FDR Records Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Showing {filteredRecords.length} of {records.length} Instruments
          </div>
          <div className="text-xs text-slate-500">
            Total Filtered Value:{' '}
            <span className="font-bold text-slate-900 tabular-nums">
              {formatINR(filteredRecords.reduce((s, r) => s + r.fdrAmount, 0))}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Institute & PID</th>
                <th className="py-3 px-4">FDR Instrument No.</th>
                <th className="py-3 px-4">Bank & Branch</th>
                <th className="py-3 px-4 text-right">Deposit Amount</th>
                <th className="py-3 px-4">Maturity Date</th>
                <th className="py-3 px-4">Lien & Verification</th>
                <th className="py-3 px-4">Administrative Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="font-semibold text-slate-800 text-sm">No instruments matched your criteria</p>
                      <p className="text-xs">Adjust your search terms or clear active filters to view records.</p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedStatus('all');
                          setSelectedRegion('all');
                          setSelectedBank('all');
                          setSelectedCategory('all');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-md hover:bg-slate-800"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const daysLeft = calculateDaysRemaining(rec.maturityDate, currentDate);
                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      onClick={() => onSelectFDR(rec)}
                    >
                      {/* Institute Name & ID */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 text-sm truncate">
                          {rec.instituteName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          PID: {rec.permanentInstituteId} · App: {rec.aicteApplicationNo}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {rec.category} · {rec.region}
                        </div>
                      </td>

                      {/* FDR Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {rec.fdrNumber}
                        <div className="text-[11px] font-normal text-slate-500 font-sans mt-0.5">
                          {rec.purpose.split(' ')[0]} {rec.purpose.split(' ')[1]}
                        </div>
                      </td>

                      {/* Bank & Branch */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{rec.bankName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {rec.branchName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{rec.ifscCode}</div>
                      </td>

                      {/* Deposit Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900 text-sm tabular-nums">
                          {formatINR(rec.fdrAmount)}
                        </div>
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          {rec.interestRate}% p.a.
                        </div>
                      </td>

                      {/* Maturity Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 tabular-nums">
                          {rec.maturityDate}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Issued: {rec.issueDate}
                        </div>
                      </td>

                      {/* Lien & Verification */}
                      <td className="py-3.5 px-4">
                        {rec.lienMarked ? (
                          <div className="text-[11px] font-semibold text-emerald-800">
                            Lien to MS, AICTE: Held
                          </div>
                        ) : (
                          <div className="text-[11px] font-bold text-rose-700">
                            Lien: Not Marked!
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {rec.verificationSource === 'bank_verified' ? (
                            <span className="text-emerald-700">CBS API Verified</span>
                          ) : rec.verificationSource === 'discrepancy_flagged' ? (
                            <span className="text-rose-600 font-bold">Discrepant Data</span>
                          ) : (
                            <span className="text-slate-500">Institute Self-Submitted</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">{getStatusDisplay(rec)}</td>

                      {/* Row Action Buttons */}
                      <td className="py-3.5 px-4 text-right shrink-0">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectFDR(rec);
                            }}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
                            title="Inspect FDR dossier & digital documents"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onInitiateBankVerify(rec);
                            }}
                            className="p-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                            title="Run Core Banking reconciliation check"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
