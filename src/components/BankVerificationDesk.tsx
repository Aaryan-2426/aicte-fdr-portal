import React, { useState } from 'react';
import { FDRRecord } from '../types/fdr';
import { formatINR, detectFDRDiscrepancies } from '../utils/fdrEngine';
import {
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Landmark,
  Building,
  FileText,
  Send,
  Eye,
  Check,
} from 'lucide-react';

interface BankVerificationDeskProps {
  records: FDRRecord[];
  onUpdateRecord: (updatedRecord: FDRRecord) => void;
  onSelectFDR: (record: FDRRecord) => void;
}

export const BankVerificationDesk: React.FC<BankVerificationDeskProps> = ({
  records,
  onUpdateRecord,
  onSelectFDR,
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string>(records[3]?.id || records[0]?.id);
  const [isQueryingBank, setIsQueryingBank] = useState<boolean>(false);
  const [querySuccessMessage, setQuerySuccessMessage] = useState<string | null>(null);

  const selectedRecord = records.find((r) => r.id === selectedRecordId) || records[0];

  // Core Banking System Mock Query
  const handleQueryBankAPI = () => {
    if (!selectedRecord) return;
    setIsQueryingBank(true);
    setQuerySuccessMessage(null);

    setTimeout(() => {
      setIsQueryingBank(false);

      // If it's Deccan Institute (fdr-104), retain realistic discrepancy; for others, return verified
      const isProblematic = selectedRecord.id === 'fdr-104';

      const bankVerifiedAmount = isProblematic ? 2500000 : selectedRecord.fdrAmount;
      const bankVerifiedLien = !isProblematic;
      const bankVerifiedMaturity = selectedRecord.maturityDate;

      const discrepancies = detectFDRDiscrepancies(
        {
          fdrAmount: selectedRecord.fdrAmount,
          maturityDate: selectedRecord.maturityDate,
          lienMarked: selectedRecord.lienMarked,
          bankName: selectedRecord.bankName,
          jointName: selectedRecord.jointName,
        },
        {
          fdrAmount: bankVerifiedAmount,
          maturityDate: bankVerifiedMaturity,
          lienMarked: bankVerifiedLien,
          accountStatus: 'active',
        }
      );

      const updated: FDRRecord = {
        ...selectedRecord,
        verificationSource: discrepancies.length > 0 ? 'discrepancy_flagged' : 'bank_verified',
        status: discrepancies.length > 0 ? 'discrepant' : 'active',
        bankConfirmationRef: `${selectedRecord.bankName.slice(0, 3).toUpperCase()}/CBS-API/${Date.now().toString().slice(-6)}`,
        bankConfirmationDate: '2026-10-30',
        bankVerifiedAmount,
        bankVerifiedLien,
        bankVerifiedMaturity,
        discrepancyReasons: discrepancies.length > 0 ? discrepancies : undefined,
        auditTrail: [
          ...selectedRecord.auditTrail,
          {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            action: 'Automated Core Banking API Query',
            userRole: 'Bank Verification Desk',
            userName: 'AICTE-CBS Integration Gateway',
            details: discrepancies.length > 0
              ? `API query executed. Found ${discrepancies.length} discrepancy items.`
              : 'Core Banking API confirmed deposit amount, active status, and AICTE lien endorsement.',
          },
        ],
      };

      onUpdateRecord(updated);
      setQuerySuccessMessage(
        discrepancies.length > 0
          ? `Bank query completed: ${discrepancies.length} discrepancy item(s) detected!`
          : `Bank API successfully validated instrument against ${selectedRecord.bankName} core banking database.`
      );
    }, 1200);
  };

  const handleIssueDeficiencyMemo = () => {
    if (!selectedRecord) return;
    const updated: FDRRecord = {
      ...selectedRecord,
      auditTrail: [
        ...selectedRecord.auditTrail,
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          action: 'Statutory Deficiency Memo Dispatched',
          userRole: 'AICTE Regional Scrutiny Officer',
          userName: 'Dr. Regional Officer',
          details: `Formal deficiency notice issued to ${selectedRecord.instituteName} regarding FDR discrepancies.`,
        },
      ],
    };
    onUpdateRecord(updated);
    alert(`Deficiency Memo successfully dispatched to ${selectedRecord.instituteName} & Branch Manager.`);
  };

  const handleCertifyClearance = () => {
    if (!selectedRecord) return;
    const updated: FDRRecord = {
      ...selectedRecord,
      status: 'active',
      verificationSource: 'bank_verified',
      discrepancyReasons: undefined,
      lienMarked: true,
      auditTrail: [
        ...selectedRecord.auditTrail,
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          action: 'Scrutiny Officer Manual Clearance',
          userRole: 'AICTE Scrutiny Officer',
          userName: 'Dr. Officer',
          details: 'Scrutiny officer verified physical bank letter and cleared all discrepancy flags.',
        },
      ],
    };
    onUpdateRecord(updated);
    alert(`Instrument ${selectedRecord.fdrNumber} marked as Verified and Lien Confirmed.`);
  };

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span>Independent Financial Verification Module</span>
              <span>·</span>
              <span>Core Banking System (CBS) / RBI e-Kuber Gateway</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Bank Verification & Discrepancy Scrutiny Desk
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Distinguish between information claimed by the technical institution and records independently
              confirmed by issuing Scheduled Commercial Banks. Detect and audit mismatched amounts, unconfirmed
              liens, or premature cancellations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Gateway Protocol: SFTP / REST CBS v2.4
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Instruments for Verification */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Verification Queue ({records.length})
            </div>
            <span className="text-[11px] text-slate-500">Select to scrutinize</span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {records.map((rec) => {
              const isSelected = rec.id === selectedRecordId;
              const isDiscrepant = rec.status === 'discrepant';
              const isVerified = rec.verificationSource === 'bank_verified';

              return (
                <div
                  key={rec.id}
                  onClick={() => {
                    setSelectedRecordId(rec.id);
                    setQuerySuccessMessage(null);
                  }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-slate-900 bg-slate-50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-slate-900">{rec.fdrNumber}</span>
                    {isDiscrepant ? (
                      <span className="text-rose-700 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Discrepancy
                      </span>
                    ) : isVerified ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Bank Verified
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">Self-Submitted</span>
                    )}
                  </div>

                  <div className="font-semibold text-slate-800 text-xs mt-1 truncate">
                    {rec.instituteName}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{rec.bankName}</span>
                    <span className="font-bold text-slate-700 tabular-nums">
                      {formatINR(rec.fdrAmount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: In-Depth Side-by-Side Reconciliation Workbench */}
        {selectedRecord && (
          <div className="lg:col-span-8 space-y-4">
            {/* Header info card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="text-xs font-semibold text-slate-500 font-mono">
                    Permanent ID: {selectedRecord.permanentInstituteId} · Application: {selectedRecord.aicteApplicationNo}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedRecord.instituteName}
                  </h3>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {selectedRecord.category} · {selectedRecord.region}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleQueryBankAPI}
                    disabled={isQueryingBank}
                    className="px-3.5 py-2 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-xs"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isQueryingBank ? 'animate-spin' : ''}`} />
                    <span>{isQueryingBank ? 'Probing Core Banking...' : 'Query Bank CBS API'}</span>
                  </button>
                  <button
                    onClick={() => onSelectFDR(selectedRecord)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200"
                    title="View Full FDR Dossier"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Message */}
              {querySuccessMessage && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                    querySuccessMessage.includes('discrepancy')
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  }`}
                >
                  {querySuccessMessage.includes('discrepancy') ? (
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span>{querySuccessMessage}</span>
                </div>
              )}

              {/* Side-by-Side Reconciliation Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column A: Institution Claim */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-600" />
                      <span>Institution Submitted Claim</span>
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                      Self-Declaration
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Claimed Deposit Amount</span>
                      <span className="font-bold text-slate-900 text-sm tabular-nums">
                        {formatINR(selectedRecord.fdrAmount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">FDR Receipt Number</span>
                      <span className="font-mono font-bold text-slate-800">
                        {selectedRecord.fdrNumber}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Claimed Issuing Bank</span>
                      <span className="font-semibold text-slate-800">{selectedRecord.bankName}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Branch & IFSC</span>
                      <span className="text-slate-700">
                        {selectedRecord.branchName} ({selectedRecord.ifscCode})
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Claimed Maturity Date</span>
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {selectedRecord.maturityDate}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Lien Marked to AICTE</span>
                      <span
                        className={`font-semibold ${
                          selectedRecord.lienMarked ? 'text-emerald-700' : 'text-rose-700 font-bold'
                        }`}
                      >
                        {selectedRecord.lienMarked ? 'Claimed as Lien Marked' : 'NOT Marked in declaration'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Joint Account Title</span>
                      <span className="text-slate-800 font-medium">{selectedRecord.jointName}</span>
                    </div>
                  </div>
                </div>

                {/* Column B: Bank CBS Master Confirmation */}
                <div
                  className={`border rounded-lg p-4 space-y-3 ${
                    selectedRecord.verificationSource === 'discrepancy_flagged'
                      ? 'bg-rose-50/50 border-rose-300'
                      : 'bg-emerald-50/40 border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-slate-700" />
                      <span>Bank CBS Master Record</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        selectedRecord.verificationSource === 'bank_verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedRecord.verificationSource === 'discrepancy_flagged'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {selectedRecord.verificationSource === 'bank_verified'
                        ? 'Confirmed'
                        : selectedRecord.verificationSource === 'discrepancy_flagged'
                        ? 'Discrepant'
                        : 'Awaiting Query'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Bank Confirmed Amount</span>
                      <span className="font-bold text-slate-900 text-sm tabular-nums">
                        {selectedRecord.bankVerifiedAmount !== undefined
                          ? formatINR(selectedRecord.bankVerifiedAmount)
                          : '—'}
                      </span>
                      {selectedRecord.bankVerifiedAmount !== undefined &&
                        selectedRecord.bankVerifiedAmount !== selectedRecord.fdrAmount && (
                          <span className="block text-rose-700 font-bold text-[10px]">
                            Mismatch: Differs by {formatINR(Math.abs(selectedRecord.fdrAmount - selectedRecord.bankVerifiedAmount))}
                          </span>
                        )}
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Bank Confirmation Ref</span>
                      <span className="font-mono text-slate-800">
                        {selectedRecord.bankConfirmationRef || 'Pending API ping'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Confirmation Timestamp</span>
                      <span className="text-slate-800">
                        {selectedRecord.bankConfirmationDate || 'Not yet queried'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Bank CBS Lien Status</span>
                      <span
                        className={`font-semibold ${
                          selectedRecord.bankVerifiedLien ? 'text-emerald-700' : 'text-rose-700 font-bold'
                        }`}
                      >
                        {selectedRecord.bankVerifiedLien !== undefined
                          ? selectedRecord.bankVerifiedLien
                            ? 'Lien Endorsed to Member Secretary, AICTE'
                            : 'No Lien Found on Bank Account'
                          : 'Unconfirmed'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">CBS Maturity Date</span>
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {selectedRecord.bankVerifiedMaturity || selectedRecord.maturityDate}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Account Status</span>
                      <span className="font-semibold text-emerald-800">
                        Active Fixed Deposit (Under Custody)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discrepancy Findings Box */}
              {selectedRecord.discrepancyReasons && selectedRecord.discrepancyReasons.length > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-300 rounded-lg text-xs space-y-2">
                  <div className="font-bold text-rose-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Discrepancies Requiring Regulatory Intervention:</span>
                  </div>
                  <ul className="list-disc pl-5 text-rose-800 space-y-1">
                    {selectedRecord.discrepancyReasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleIssueDeficiencyMemo}
                    className="px-3.5 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Deficiency Notice</span>
                  </button>

                  <button
                    onClick={handleCertifyClearance}
                    className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 hover:border-slate-400 text-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mark As Scrutiny Cleared</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-500">
                  Last Audited: {selectedRecord.auditTrail[selectedRecord.auditTrail.length - 1]?.timestamp}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
