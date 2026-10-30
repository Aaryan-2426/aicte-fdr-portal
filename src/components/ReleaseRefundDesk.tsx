import React, { useState } from 'react';
import { FDRRecord } from '../types/fdr';
import { formatINR, evaluateReleaseEligibility } from '../utils/fdrEngine';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Download,
  AlertTriangle,
  Building,
  Landmark,
  Printer,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface ReleaseRefundDeskProps {
  records: FDRRecord[];
  onUpdateRecord: (updatedRecord: FDRRecord) => void;
  onSelectFDR: (record: FDRRecord) => void;
}

export const ReleaseRefundDesk: React.FC<ReleaseRefundDeskProps> = ({
  records,
  onUpdateRecord,
  onSelectFDR,
}) => {
  const currentDate = '2026-10-30';

  // Find records that either have release requests, are released, or are eligible (10 yrs completed)
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    records.find((r) => r.status === 'release_requested')?.id || records[0]?.id
  );

  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [certificateRecord, setCertificateRecord] = useState<FDRRecord | null>(null);

  const selectedRecord = records.find((r) => r.id === selectedRecordId) || records[0];

  // Evaluate tenure eligibility
  const tenureEval = selectedRecord
    ? evaluateReleaseEligibility(selectedRecord.issueDate, selectedRecord.lockInPeriodYears, currentDate)
    : null;

  // Multi-tier workflow handlers
  const handleScrutinySignOff = () => {
    if (!selectedRecord) return;
    const currentRelease = selectedRecord.releaseDetails || {
      requestId: `REL-${Date.now().toString().slice(-6)}`,
      requestDate: currentDate,
      requestedBy: 'Institute Head',
      applicantDesignation: 'Chairman, Board of Governors',
      reason: 'completion_of_tenure',
      lockInTenureMet: true,
      noVigilanceCase: true,
      noStudentDuesPending: true,
      eoaComplianceVerified: true,
      regionalOfficeNocIssued: false,
      status: 'submitted',
    };

    const updated: FDRRecord = {
      ...selectedRecord,
      status: 'release_requested',
      releaseDetails: {
        ...currentRelease,
        status: 'scrutiny_cleared',
        scrutinyOfficer: 'Smt. Scrutiny Officer (APH Bureau)',
        scrutinyDate: currentDate,
        scrutinyNotes: `Verified ${selectedRecord.lockInPeriodYears} years completed. No pending vigilance or student dispute records found.`,
      },
      auditTrail: [
        ...selectedRecord.auditTrail,
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          action: 'Scrutiny Officer Clearance Accorded',
          userRole: 'AICTE Scrutiny Officer',
          userName: 'APH Scrutiny Officer',
          details: 'Mandatory tenure and non-encashment compliance verified. Forwarded to Regional Officer.',
        },
      ],
    };
    onUpdateRecord(updated);
  };

  const handleRegionalOfficerRecommend = () => {
    if (!selectedRecord || !selectedRecord.releaseDetails) return;
    const updated: FDRRecord = {
      ...selectedRecord,
      releaseDetails: {
        ...selectedRecord.releaseDetails,
        status: 'ro_recommended',
        regionalOfficeNocIssued: true,
        roOfficer: 'Dr. Regional Officer (RO Office)',
        roDate: currentDate,
        roNotes: 'RO confirms satisfactory operation of technical campus. Recommended for full refund.',
      },
      auditTrail: [
        ...selectedRecord.auditTrail,
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          action: 'Regional Office NOC & Recommendation Issued',
          userRole: 'AICTE Regional Officer',
          userName: 'Regional Officer',
          details: 'NOC issued. Case escalated to Member Secretary / Regulation Bureau Director.',
        },
      ],
    };
    onUpdateRecord(updated);
  };

  const handleBureauDirectorApproveAndDischarge = () => {
    if (!selectedRecord || !selectedRecord.releaseDetails) return;
    const dischargeOrderNo = `AICTE/REG/FDR-REL/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`;

    const updated: FDRRecord = {
      ...selectedRecord,
      status: 'released',
      lienMarked: false, // Lien released!
      releaseDetails: {
        ...selectedRecord.releaseDetails,
        status: 'discharged',
        bureauOfficer: 'Prof. Member Secretary, AICTE New Delhi',
        bureauApprovalDate: currentDate,
        bureauNotes: 'Final approval accorded by Competent Authority. Electronic Discharge Certificate generated.',
        dischargeOrderNo,
        dischargedDate: currentDate,
      },
      auditTrail: [
        ...selectedRecord.auditTrail,
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          action: 'Official Discharge Order & Lien Revocation Executed',
          userRole: 'AICTE Central Director',
          userName: 'Member Secretary / Regulation Director',
          details: `Order #${dischargeOrderNo} executed. Lien on ${selectedRecord.bankName} revoked. Deposit cleared for refund to institution.`,
        },
      ],
    };

    onUpdateRecord(updated);
    setCertificateRecord(updated);
    setShowCertificateModal(true);
  };

  const handleOpenCertificate = (rec: FDRRecord) => {
    setCertificateRecord(rec);
    setShowCertificateModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span>Security Deposit Clearance Protocol</span>
              <span>·</span>
              <span>Statutory Refund & Lien Revocation</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Security Deposit Release & Refund Processing
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Strict multi-tier verification for releasing technical institution security deposits upon
              completion of the prescribed 8 or 10-year lock-in period, subject to vigilance clearance,
              student grievance checks, and authorization by the Competent Authority.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              APH Norm: Chapter 1 Lock-In Compliance
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Release Cases */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Release Cases & Candidates ({records.length})
            </div>
            <span className="text-[11px] text-slate-500">Select application</span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {records.map((rec) => {
              const isSelected = rec.id === selectedRecordId;
              const isDischarged = rec.status === 'released';
              const isInScrutiny = rec.status === 'release_requested';
              const tenure = evaluateReleaseEligibility(rec.issueDate, rec.lockInPeriodYears, currentDate);

              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecordId(rec.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-slate-900 bg-slate-50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-slate-900">{rec.fdrNumber}</span>
                    {isDischarged ? (
                      <span className="text-slate-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Discharged
                      </span>
                    ) : isInScrutiny ? (
                      <span className="text-blue-700 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        In Review
                      </span>
                    ) : tenure.isEligible ? (
                      <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">
                        10-Yr Eligible
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">
                        {tenure.yearsCompleted}/{tenure.yearsRequired} yrs
                      </span>
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

        {/* Right Column: Multi-Tier Clearance Dossier & Actions */}
        {selectedRecord && (
          <div className="lg:col-span-8 space-y-4">
            {/* Header info */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="text-xs font-semibold text-slate-500 font-mono">
                    PID: {selectedRecord.permanentInstituteId} · FDR #{selectedRecord.fdrNumber}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedRecord.instituteName}
                  </h3>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Deposit Amount:{' '}
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatINR(selectedRecord.fdrAmount)}
                    </span>{' '}
                    · {selectedRecord.bankName} ({selectedRecord.branchName})
                  </div>
                </div>

                {selectedRecord.status === 'released' && (
                  <button
                    onClick={() => handleOpenCertificate(selectedRecord)}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>View Discharge Certificate</span>
                  </button>
                )}
              </div>

              {/* 5-Point Statutory Pre-Requisite Checklist */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>APH Mandatory Pre-Requisite Verification Checklist</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Tenure: {tenureEval?.yearsCompleted} of {tenureEval?.yearsRequired} Years
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Point 1: Lock-in Tenure */}
                  <div className="flex items-start gap-2.5">
                    {tenureEval?.isEligible ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold text-slate-900">
                        1. Mandatory Lock-In Tenure Completion (8 or 10 Years):
                      </span>{' '}
                      <span
                        className={tenureEval?.isEligible ? 'text-emerald-800' : 'text-amber-800 font-semibold'}
                      >
                        {tenureEval?.isEligible
                          ? `Fulfilled. Completed ${tenureEval.yearsCompleted} years (Issued: ${selectedRecord.issueDate}).`
                          : `Under Lock-in. ${tenureEval?.remainingYears} years remaining until ${tenureEval?.completionDateStr}.`}
                      </span>
                    </div>
                  </div>

                  {/* Point 2: Vigilance */}
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900">
                        2. Vigilance & Legal Clearance:
                      </span>{' '}
                      <span className="text-slate-700">
                        No adverse vigilance inquiry, anti-ragging penalty, or pending High Court stay.
                      </span>
                    </div>
                  </div>

                  {/* Point 3: Student Grievances */}
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900">
                        3. Student Grievance & Fee Redressal:
                      </span>{' '}
                      <span className="text-slate-700">
                        Affidavit submitted confirming zero outstanding student caution money or faculty salary claims.
                      </span>
                    </div>
                  </div>

                  {/* Point 4: EoA Continuity */}
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900">
                        4. Continuous Extension of Approval (EoA):
                      </span>{' '}
                      <span className="text-slate-700">
                        Technical institute has maintained unbroken annual approval without punitive withdrawal.
                      </span>
                    </div>
                  </div>

                  {/* Point 5: Regional Office NOC */}
                  <div className="flex items-start gap-2.5">
                    {selectedRecord.releaseDetails?.regionalOfficeNocIssued ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold text-slate-900">
                        5. AICTE Regional Office (RO) Recommendation:
                      </span>{' '}
                      <span
                        className={
                          selectedRecord.releaseDetails?.regionalOfficeNocIssued
                            ? 'text-emerald-800'
                            : 'text-slate-600'
                        }
                      >
                        {selectedRecord.releaseDetails?.regionalOfficeNocIssued
                          ? `Endorsed by ${selectedRecord.region} Office.`
                          : 'Pending Regional Officer formal inspection sign-off.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4-Tier Approval Workflow Ladder */}
              <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Multi-Tier Authorization Ladder
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  {/* Stage 1: Application */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="font-semibold text-slate-700">1. Application</div>
                    <div className="text-emerald-700 font-bold text-[11px]">Submitted</div>
                    <div className="text-[10px] text-slate-500">
                      {selectedRecord.releaseDetails?.requestDate || 'Initiated'}
                    </div>
                  </div>

                  {/* Stage 2: Scrutiny Officer */}
                  <div
                    className={`p-3 rounded-lg border space-y-1 ${
                      selectedRecord.releaseDetails?.status === 'scrutiny_cleared' ||
                      selectedRecord.releaseDetails?.status === 'ro_recommended' ||
                      selectedRecord.releaseDetails?.status === 'discharged'
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="font-semibold text-slate-700">2. Scrutiny Desk</div>
                    <div
                      className={`font-bold text-[11px] ${
                        selectedRecord.releaseDetails?.status === 'scrutiny_cleared' ||
                        selectedRecord.releaseDetails?.status === 'ro_recommended' ||
                        selectedRecord.releaseDetails?.status === 'discharged'
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {selectedRecord.releaseDetails?.status === 'scrutiny_cleared' ||
                      selectedRecord.releaseDetails?.status === 'ro_recommended' ||
                      selectedRecord.releaseDetails?.status === 'discharged'
                        ? 'Passed'
                        : 'Pending'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {selectedRecord.releaseDetails?.scrutinyDate || 'Checklist check'}
                    </div>
                  </div>

                  {/* Stage 3: Regional Officer */}
                  <div
                    className={`p-3 rounded-lg border space-y-1 ${
                      selectedRecord.releaseDetails?.status === 'ro_recommended' ||
                      selectedRecord.releaseDetails?.status === 'discharged'
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="font-semibold text-slate-700">3. Regional Officer</div>
                    <div
                      className={`font-bold text-[11px] ${
                        selectedRecord.releaseDetails?.status === 'ro_recommended' ||
                        selectedRecord.releaseDetails?.status === 'discharged'
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {selectedRecord.releaseDetails?.status === 'ro_recommended' ||
                      selectedRecord.releaseDetails?.status === 'discharged'
                        ? 'Recommended'
                        : 'Awaiting'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {selectedRecord.releaseDetails?.roDate || 'RO Endorsement'}
                    </div>
                  </div>

                  {/* Stage 4: Central Director */}
                  <div
                    className={`p-3 rounded-lg border space-y-1 ${
                      selectedRecord.releaseDetails?.status === 'discharged'
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="font-semibold text-slate-700">4. Bureau Director</div>
                    <div
                      className={`font-bold text-[11px] ${
                        selectedRecord.releaseDetails?.status === 'discharged'
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {selectedRecord.releaseDetails?.status === 'discharged'
                        ? 'Discharged'
                        : 'Final Approval'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {selectedRecord.releaseDetails?.dischargedDate || 'Member Secretary'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons based on workflow stage */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {/* Scrutiny Button */}
                  {(!selectedRecord.releaseDetails ||
                    selectedRecord.releaseDetails.status === 'submitted') && (
                    <button
                      onClick={handleScrutinySignOff}
                      disabled={!tenureEval?.isEligible}
                      className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40"
                    >
                      Sign-Off Scrutiny Checklist
                    </button>
                  )}

                  {/* RO Recommendation Button */}
                  {selectedRecord.releaseDetails?.status === 'scrutiny_cleared' && (
                    <button
                      onClick={handleRegionalOfficerRecommend}
                      className="px-3.5 py-2 text-xs font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      Issue RO Recommendation & NOC
                    </button>
                  )}

                  {/* Final Approval & Discharge Button */}
                  {selectedRecord.releaseDetails?.status === 'ro_recommended' && (
                    <button
                      onClick={handleBureauDirectorApproveAndDischarge}
                      className="px-4 py-2 text-xs font-bold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors flex items-center gap-2 shadow-xs"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-200" />
                      <span>Execute Final Discharge & Revoke Bank Lien</span>
                    </button>
                  )}

                  {selectedRecord.status === 'released' && (
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>FDR Discharged & Bank Lien Revoked (Order #{selectedRecord.releaseDetails?.dischargeOrderNo})</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onSelectFDR(selectedRecord)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 rounded"
                >
                  Inspect Full File Dossier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DISCHARGE CERTIFICATE MODAL */}
      {showCertificateModal && certificateRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-3xl w-full p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Official Regulatory Document
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Official Certificate Layout */}
            <div className="p-8 border-2 border-slate-800 rounded-xl space-y-6 font-serif bg-amber-50/10 relative">
              {/* Top Council Crest Header */}
              <div className="text-center space-y-1">
                <div className="text-xs font-sans font-bold tracking-widest text-slate-600 uppercase">
                  अखिल भारतीय तकनीकी शिक्षा परिषद (भारत सरकार)
                </div>
                <div className="text-base font-bold tracking-wide text-slate-900 uppercase">
                  ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                </div>
                <div className="text-xs font-sans text-slate-500">
                  (A Statutory Body of the Ministry of Education, Government of India)
                </div>
                <div className="text-xs font-sans text-slate-500">
                  Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070
                </div>
              </div>

              <div className="h-0.5 bg-slate-900 w-full"></div>

              <div className="text-center space-y-1">
                <h4 className="text-base font-bold uppercase underline tracking-wider font-sans text-slate-900">
                  ORDER OF DISCHARGE & LIEN REVOCATION OF SECURITY DEPOSIT
                </h4>
                <div className="text-xs font-sans font-mono text-slate-700">
                  Order No: {certificateRecord.releaseDetails?.dischargeOrderNo || 'AICTE/REG/FDR-REL/2026/0882'}
                  {' · '}Date: {currentDate}
                </div>
              </div>

              <div className="text-xs leading-relaxed space-y-3 font-sans text-slate-800">
                <p>
                  WHEREAS, <strong>{certificateRecord.instituteName}</strong> (Permanent Institute ID:{' '}
                  <span className="font-mono">{certificateRecord.permanentInstituteId}</span>), located at{' '}
                  {certificateRecord.state}, had submitted and maintained a Fixed Deposit Receipt (FDR) bearing Number{' '}
                  <strong className="font-mono">{certificateRecord.fdrNumber}</strong> of amount{' '}
                  <strong>{formatINR(certificateRecord.fdrAmount)}</strong> issued by{' '}
                  <strong>{certificateRecord.bankName}</strong> ({certificateRecord.branchName}) in joint name with
                  AICTE, as a prescribed security deposit under the Approval Process Handbook;
                </p>

                <p>
                  AND WHEREAS, the institution has satisfactorily completed the mandatory regulatory lock-in period of{' '}
                  <strong>{certificateRecord.lockInPeriodYears} Years</strong>, and upon comprehensive scrutiny by the{' '}
                  {certificateRecord.region} Office and Central Regulation Bureau, it is verified that no vigilance cases,
                  anti-ragging complaints, faculty salary dues, or student caution fee disputes are pending against the said institution;
                </p>

                <p>
                  NOW THEREFORE, in exercise of powers vested under AICTE Regulations, the Member Secretary, All India
                  Council for Technical Education, hereby accords <strong>FINAL DISCHARGE</strong> and formal revocation
                  of lien on FDR No. <strong className="font-mono">{certificateRecord.fdrNumber}</strong>. The Branch Manager,{' '}
                  <strong>{certificateRecord.bankName}</strong> ({certificateRecord.branchName}) is hereby officially
                  authorized to release the principal deposit along with accrued interest to the registered account of the
                  Governing Trust / Society of the technical institution.
                </p>
              </div>

              {/* Signature block */}
              <div className="pt-8 flex items-end justify-between font-sans text-xs">
                <div>
                  <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-mono text-center p-1">
                    AICTE Digital Regulatory Seal
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="font-bold text-slate-900 text-sm">Prof. Rajive Kumar</div>
                  <div className="text-slate-600 font-medium">Member Secretary</div>
                  <div className="text-slate-500">All India Council for Technical Education</div>
                  <div className="text-[10px] text-emerald-800 font-mono">Digitally Signed & Certified</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
