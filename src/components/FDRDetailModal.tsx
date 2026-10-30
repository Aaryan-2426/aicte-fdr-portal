import React, { useState } from 'react';
import { FDRRecord } from '../types/fdr';
import { formatINR, calculateDaysRemaining } from '../utils/fdrEngine';
import {
  FileText,
  ShieldCheck,
  Landmark,
  Building,
  History,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  FileCheck,
  Eye,
  RotateCw,
} from 'lucide-react';

interface FDRDetailModalProps {
  record: FDRRecord;
  onClose: () => void;
  onRunBankVerify: (record: FDRRecord) => void;
}

export const FDRDetailModal: React.FC<FDRDetailModalProps> = ({
  record,
  onClose,
  onRunBankVerify,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'bank_status' | 'renewals' | 'audit'>('overview');
  const [selectedDocId, setSelectedDocId] = useState<string>(record.supportingDocuments[0]?.id || '');

  const currentDate = '2026-10-30';
  const daysLeft = calculateDaysRemaining(record.maturityDate, currentDate);
  const selectedDoc = record.supportingDocuments.find((d) => d.id === selectedDocId) || record.supportingDocuments[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-500">
              <span>PID: {record.permanentInstituteId}</span>
              <span>·</span>
              <span>App: {record.aicteApplicationNo}</span>
              <span>·</span>
              <span className="text-slate-700">{record.region}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{record.instituteName}</h3>
            <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
              <span className="font-semibold text-slate-800">{record.category}</span>
              <span>·</span>
              <span className="font-mono font-bold text-slate-900">{record.fdrNumber}</span>
              <span>·</span>
              <span className="font-bold text-slate-900 tabular-nums">{formatINR(record.fdrAmount)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300"
              title="Print Dossier"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 font-bold text-xl px-2.5 py-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Nav Tabs */}
        <div className="flex space-x-1 border-b border-slate-200 px-5 bg-white text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Dossier Overview
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Digital Documents</span>
            <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded font-mono">
              {record.supportingDocuments.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('bank_status')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'bank_status'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Bank API Scrutiny
          </button>
          <button
            onClick={() => setActiveTab('renewals')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'renewals'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Renewal Chain ({record.renewalHistory?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit Log ({record.auditTrail.length})
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Financial Instrument Metadata Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-slate-400 text-[11px] block font-semibold uppercase">
                    Deposit Amount
                  </span>
                  <span className="font-bold text-slate-900 text-base tabular-nums">
                    {formatINR(record.fdrAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block font-semibold uppercase">
                    Annual Interest Rate
                  </span>
                  <span className="font-bold text-slate-900 text-base tabular-nums">
                    {record.interestRate}% p.a.
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block font-semibold uppercase">
                    Issue Date
                  </span>
                  <span className="font-semibold text-slate-900 text-sm tabular-nums">
                    {record.issueDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block font-semibold uppercase">
                    Maturity Date
                  </span>
                  <span className="font-semibold text-slate-900 text-sm tabular-nums">
                    {record.maturityDate}
                  </span>
                </div>
              </div>

              {/* Status and Lien Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl space-y-2">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-slate-700" />
                    <span>Issuing Bank & Branch Information</span>
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <div>
                      <span className="text-slate-500">Bank:</span>{' '}
                      <span className="font-semibold text-slate-900">{record.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Branch:</span> {record.branchName}
                    </div>
                    <div>
                      <span className="text-slate-500">IFSC Code:</span>{' '}
                      <span className="font-mono font-bold text-slate-800">{record.ifscCode}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Auto-Renewal Flag:</span>{' '}
                      <span>{record.autoRenewal ? 'Enabled' : 'Disabled (Requires manual replacement)'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-xl space-y-2">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-slate-700" />
                    <span>Joint Ownership & Lien Marking</span>
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <div>
                      <span className="text-slate-500">Joint Name:</span>{' '}
                      <span className="font-semibold text-slate-900">{record.jointName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Lien Endorsed to AICTE:</span>{' '}
                      <span
                        className={`font-semibold ${
                          record.lienMarked ? 'text-emerald-700' : 'text-rose-700 font-bold'
                        }`}
                      >
                        {record.lienMarked
                          ? 'Duly Marked & Restricted from Encashment'
                          : 'NOT Marked - Discrepancy Action Required'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Lock-in Period:</span>{' '}
                      <span className="font-semibold">{record.lockInPeriodYears} Years Mandatory</span>
                    </div>
                    <div>
                      <span className="text-slate-500">APH Clause:</span>{' '}
                      <span className="text-slate-800">{record.aphClause}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Maturity Countdown Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  daysLeft < 0
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : daysLeft <= 30
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}
              >
                <div>
                  <div className="font-bold text-sm">
                    {daysLeft < 0
                      ? `Matured & Overdue (${Math.abs(daysLeft)} Days Past Maturity)`
                      : daysLeft <= 30
                      ? `Expiring Soon: ${daysLeft} Days Remaining`
                      : `Active Custody: ${daysLeft} Days Remaining Until Maturity`}
                  </div>
                  <div className="text-[11px] mt-0.5">
                    {daysLeft < 0
                      ? 'Statutory renewal notice has been served. Bank has been notified to prevent unilateral release.'
                      : daysLeft <= 30
                      ? 'Pre-maturity intimation dispatched to Principal. Submit replacement FDR to avoid show-cause.'
                      : 'Instrument is valid and in good standing.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIGITAL SUPPORTING DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Doc List */}
              <div className="md:col-span-4 space-y-2 border-r border-slate-200 pr-3">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Prescribed Regulatory Documents
                </div>
                {record.supportingDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedDoc?.id === doc.id
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                      <div className="font-semibold text-slate-900 truncate">{doc.title}</div>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>{doc.fileSize}</span>
                      {doc.verified ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold">Under Scrutiny</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Doc Viewer Preview */}
              {selectedDoc && (
                <div className="md:col-span-8 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{selectedDoc.title}</h4>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {selectedDoc.fileName} · Uploaded: {selectedDoc.uploadedAt}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-slate-700 bg-slate-100 rounded border border-slate-200 font-semibold text-[11px]">
                      Digital Seal Verified
                    </span>
                  </div>

                  {/* Document Simulated Canvas */}
                  <div className="border-2 border-slate-300 bg-slate-50/80 rounded-xl p-6 min-h-[300px] flex flex-col justify-between relative shadow-inner">
                    <div className="space-y-3 font-serif">
                      <div className="text-center border-b border-slate-300 pb-3">
                        <div className="font-bold text-slate-900 uppercase tracking-widest text-xs">
                          {record.bankName.toUpperCase()}
                        </div>
                        <div className="text-[11px] font-sans text-slate-500">
                          {record.branchName} · IFSC: {record.ifscCode}
                        </div>
                        <div className="font-bold text-xs uppercase underline mt-2 text-slate-800">
                          {selectedDoc.title.toUpperCase()}
                        </div>
                      </div>

                      <div className="text-xs space-y-2 font-sans text-slate-700 pt-2 leading-relaxed">
                        <p>
                          This document certifies that Fixed Deposit Receipt Number{' '}
                          <strong className="font-mono">{record.fdrNumber}</strong> has been issued for the
                          principal amount of <strong>{formatINR(record.fdrAmount)}</strong> in favour of{' '}
                          <strong>{record.jointName}</strong>.
                        </p>
                        <p>
                          Lien has been endorsed in favour of Member Secretary, AICTE, New Delhi. This deposit
                          shall remain under lien till {record.maturityDate} and will not be encashed or released
                          without explicit authorization from AICTE.
                        </p>
                      </div>
                    </div>

                    {/* Verification Watermark */}
                    <div className="pt-6 border-t border-slate-300 flex items-center justify-between font-sans text-[11px] text-slate-500">
                      <div>
                        Digital Verification Hash: <span className="font-mono">SHA-256: 7f8a9e0...b21</span>
                      </div>
                      <div className="text-right text-emerald-800 font-bold">
                        ✓ AICTE Scrutiny Seal Applied
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BANK API SCRUTINY */}
          {activeTab === 'bank_status' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-slate-700" />
                    <span>Independent Core Banking System (CBS) Query Results</span>
                  </div>
                  <button
                    onClick={() => onRunBankVerify(record)}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Re-Probe Bank API</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Bank Confirmation Ref:</span>
                    <div className="font-mono font-bold text-slate-900">
                      {record.bankConfirmationRef || 'Pending live query'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">CBS Verified Amount:</span>
                    <div className="font-bold text-slate-900 tabular-nums">
                      {record.bankVerifiedAmount !== undefined ? formatINR(record.bankVerifiedAmount) : '—'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">CBS Lien Record:</span>
                    <div className="font-semibold text-emerald-700">
                      {record.bankVerifiedLien ? 'Confirmed Held' : 'Unconfirmed / Missing'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Verification Source:</span>
                    <div className="font-semibold text-slate-800 uppercase text-[11px]">
                      {record.verificationSource}
                    </div>
                  </div>
                </div>

                {record.discrepancyReasons && record.discrepancyReasons.length > 0 && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Active Discrepancies:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-rose-800">
                      {record.discrepancyReasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RENEWALS */}
          {activeTab === 'renewals' && (
            <div className="space-y-4">
              {record.renewalHistory && record.renewalHistory.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {record.renewalHistory.map((item) => (
                    <div key={item.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">
                          Replacement FDR #{item.newFdrNumber}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          Renewed: {item.renewedDate}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-600 text-[11px]">
                        <div>
                          Prior FDR No: <span className="font-mono font-semibold">{item.previousFdrNumber}</span>
                        </div>
                        <div>
                          Amount: <span className="font-bold text-slate-900">{formatINR(item.amount)}</span>
                        </div>
                        <div>
                          Old Maturity: <span className="tabular-nums">{item.oldMaturityDate}</span>
                        </div>
                        <div>
                          New Maturity: <span className="tabular-nums font-semibold">{item.newMaturityDate}</span>
                        </div>
                      </div>
                      <p className="text-slate-700 bg-slate-50 p-2 rounded text-[11px]">
                        {item.remarks}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                  No prior replacements recorded. This is the original initial instrument under custody.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {record.auditTrail.map((entry) => (
                  <div key={entry.id} className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{entry.action}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{entry.timestamp}</span>
                    </div>
                    <div className="text-slate-600">{entry.details}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      By: {entry.userName} ({entry.userRole})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            AICTE Security Deposit Vault · Encrypted Ledger
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
