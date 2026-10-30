import React, { useState } from 'react';
import { FDRRecord } from '../types/fdr';
import { formatINR, calculateDaysRemaining, evaluateMaturity } from '../utils/fdrEngine';
import {
  Clock,
  AlertTriangle,
  RefreshCw,
  Send,
  Calendar,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';

interface MaturityRenewalDeskProps {
  records: FDRRecord[];
  onUpdateRecord: (updatedRecord: FDRRecord) => void;
  onSelectFDR: (record: FDRRecord) => void;
}

export const MaturityRenewalDesk: React.FC<MaturityRenewalDeskProps> = ({
  records,
  onUpdateRecord,
  onSelectFDR,
}) => {
  const currentDate = '2026-10-30';

  const [activeFilter, setActiveFilter] = useState<'all' | 'overdue' | 'critical' | 'warning' | 'safe'>('all');
  const [selectedForRenewal, setSelectedForRenewal] = useState<FDRRecord | null>(null);

  // Renewal Form state
  const [newFdrNumber, setNewFdrNumber] = useState('');
  const [newMaturityDate, setNewMaturityDate] = useState('2034-10-30');
  const [renewalAmount, setRenewalAmount] = useState<number>(3500000);
  const [renewalBank, setRenewalBank] = useState('');
  const [renewalRemarks, setRenewalRemarks] = useState('');

  // Dispatch reminder notification feedback state
  const [dispatchAlertMsg, setDispatchAlertMsg] = useState<string | null>(null);

  // Filter records
  const evaluatedRecords = records
    .filter((r) => r.status !== 'released')
    .map((r) => {
      const evaluation = evaluateMaturity(r.maturityDate, currentDate);
      return { record: r, evaluation };
    });

  const filtered = evaluatedRecords.filter(({ evaluation }) => {
    if (activeFilter === 'overdue') return evaluation.isOverdue;
    if (activeFilter === 'critical') return evaluation.urgency === 'urgent_15' || evaluation.urgency === 'critical_30';
    if (activeFilter === 'warning') return evaluation.urgency === 'warning_60' || evaluation.urgency === 'notice_90';
    if (activeFilter === 'safe') return evaluation.urgency === 'normal';
    return true;
  });

  const handleOpenRenewalModal = (rec: FDRRecord) => {
    setSelectedForRenewal(rec);
    setNewFdrNumber(`FDR/${rec.bankName.slice(0, 3).toUpperCase()}/REN/${Date.now().toString().slice(-6)}`);
    setRenewalAmount(rec.fdrAmount);
    setRenewalBank(rec.bankName);
    setRenewalRemarks(`Renewed following maturity of prior instrument #${rec.fdrNumber} with continuous AICTE lien.`);
  };

  const handleExecuteRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForRenewal) return;

    const priorHistory = selectedForRenewal.renewalHistory || [];
    const newHistoryEvent = {
      id: `ren-${Date.now()}`,
      previousFdrNumber: selectedForRenewal.fdrNumber,
      newFdrNumber,
      renewedDate: currentDate,
      oldMaturityDate: selectedForRenewal.maturityDate,
      newMaturityDate,
      amount: renewalAmount,
      bankName: renewalBank,
      remarks: renewalRemarks,
      approvedBy: 'AICTE Regulation Bureau',
    };

    const updated: FDRRecord = {
      ...selectedForRenewal,
      fdrNumber: newFdrNumber,
      fdrAmount: renewalAmount,
      issueDate: currentDate,
      maturityDate: newMaturityDate,
      status: 'renewed',
      verificationSource: 'bank_verified',
      renewalHistory: [...priorHistory, newHistoryEvent],
      auditTrail: [
        ...selectedForRenewal.auditTrail,
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          action: 'FDR Renewal & Lien Continuity Endorsed',
          userRole: 'AICTE Central Director',
          userName: 'Regulation Bureau Officer',
          details: `Replaced matured instrument ${selectedForRenewal.fdrNumber} with new ${newFdrNumber} valid till ${newMaturityDate}.`,
        },
      ],
    };

    onUpdateRecord(updated);
    setSelectedForRenewal(null);
    setDispatchAlertMsg(`Successfully processed renewal for ${updated.instituteName}. New FDR #${newFdrNumber} active.`);
    setTimeout(() => setDispatchAlertMsg(null), 5000);
  };

  const handleDispatchReminder = (rec: FDRRecord, urgencyText: string) => {
    const updated: FDRRecord = {
      ...rec,
      auditTrail: [
        ...rec.auditTrail,
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          action: `Automated Regulatory ${urgencyText} Intimation Dispatched`,
          userRole: 'Notification Daemon',
          userName: 'AICTE Alert System',
          details: `Formal renewal advisory notice dispatched to Institution Principal & ${rec.bankName} Branch Manager.`,
        },
      ],
    };
    onUpdateRecord(updated);
    setDispatchAlertMsg(`Statutory ${urgencyText} Intimation sent to ${rec.instituteName} & ${rec.bankName} manager.`);
    setTimeout(() => setDispatchAlertMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span>Time-Sensitive Compliance Monitoring</span>
              <span>·</span>
              <span>Regulatory Custody Watchdog</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Maturity Tracking & Renewal Radar
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Real-time monitoring of security deposit maturity schedules. Enforces mandatory lock-in
              continuity, triggers automated 90, 60, and 30-day renewal notices, and prevents premature
              or unauthorized encashment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
              Reference Date: {currentDate}
            </span>
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex flex-wrap gap-2 mt-5 pt-3 border-t border-slate-100 text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Instruments ({evaluatedRecords.length})
          </button>
          <button
            onClick={() => setActiveFilter('overdue')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeFilter === 'overdue'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Overdue / Matured Unrenewed</span>
          </button>
          <button
            onClick={() => setActiveFilter('critical')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeFilter === 'critical'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Expiring Soon (≤30 Days)</span>
          </button>
          <button
            onClick={() => setActiveFilter('warning')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors ${
              activeFilter === 'warning'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Advance Notice (31-90 Days)
          </button>
          <button
            onClick={() => setActiveFilter('safe')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors ${
              activeFilter === 'safe'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Safe Horizon (&gt;90 Days)
          </button>
        </div>
      </div>

      {/* Success/Alert notification banner */}
      {dispatchAlertMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{dispatchAlertMsg}</span>
          </div>
          <button
            onClick={() => setDispatchAlertMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid of Monitored Instruments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(({ record, evaluation }) => {
          const isOverdue = evaluation.isOverdue;
          const isCritical = evaluation.urgency === 'urgent_15' || evaluation.urgency === 'critical_30';
          const isNotice = evaluation.urgency === 'warning_60' || evaluation.urgency === 'notice_90';

          return (
            <div
              key={record.id}
              className={`bg-white border rounded-xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                isOverdue
                  ? 'border-rose-300 hover:border-rose-400'
                  : isCritical
                  ? 'border-amber-300 hover:border-amber-400'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                {/* Header Tag Bar */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-900">{record.fdrNumber}</span>
                  {isOverdue ? (
                    <span className="text-rose-700 font-bold text-[11px] flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                      {Math.abs(evaluation.daysLeft)} Days Overdue
                    </span>
                  ) : isCritical ? (
                    <span className="text-amber-700 font-bold text-[11px] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {evaluation.daysLeft} Days Left
                    </span>
                  ) : isNotice ? (
                    <span className="text-slate-600 font-semibold text-[11px]">
                      {evaluation.daysLeft} Days to Maturity
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Valid Custody
                    </span>
                  )}
                </div>

                {/* Institute & Discipline */}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">
                    {record.instituteName}
                  </h4>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    PID: {record.permanentInstituteId} · {record.region}
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-semibold">
                      Deposit Amount
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatINR(record.fdrAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-semibold">
                      Maturity Date
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {record.maturityDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-semibold">
                      Issuing Bank
                    </span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {record.bankName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-semibold">
                      AICTE Lien
                    </span>
                    <span className="font-semibold text-emerald-700">Held</span>
                  </div>
                </div>

                {/* Statutory Action Note */}
                <div className="text-[11px] text-slate-600 bg-slate-50/50 p-2 rounded border border-slate-100">
                  <span className="font-semibold text-slate-800">Action: </span>
                  {evaluation.actionRequired}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectFDR(record)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                >
                  View Dossier
                </button>

                <div className="flex items-center gap-1.5">
                  {(isOverdue || isCritical) && (
                    <button
                      onClick={() => handleDispatchReminder(record, isOverdue ? 'Overdue Urgency' : '30-Day Expiry')}
                      className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded border border-rose-200 transition-colors flex items-center gap-1"
                      title="Dispatch SMS & Email notice to Institution & Bank"
                    >
                      <Send className="w-3 h-3" />
                      <span>Intimate</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenRenewalModal(record)}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Renew / Replace</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* RENEWAL MODAL */}
      {selectedForRenewal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Continuous Lien Endorsement
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Record Replacement / Renewal FDR
                </h3>
              </div>
              <button
                onClick={() => setSelectedForRenewal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="font-bold text-slate-900">{selectedForRenewal.instituteName}</div>
              <div className="text-slate-500">
                Prior FDR: <span className="font-mono font-bold text-slate-800">{selectedForRenewal.fdrNumber}</span> · Current Amount: {formatINR(selectedForRenewal.fdrAmount)}
              </div>
              <div className="text-slate-500">
                Original Maturity Date: <span className="font-bold text-slate-800">{selectedForRenewal.maturityDate}</span>
              </div>
            </div>

            <form onSubmit={handleExecuteRenewal} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Replacement FDR Instrument Number *
                </label>
                <input
                  type="text"
                  required
                  value={newFdrNumber}
                  onChange={(e) => setNewFdrNumber(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Renewal Amount (INR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={renewalAmount}
                    onChange={(e) => setRenewalAmount(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-bold text-slate-900 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    New Maturity Date (Min 8-10 Yrs) *
                  </label>
                  <input
                    type="date"
                    required
                    value={newMaturityDate}
                    onChange={(e) => setNewMaturityDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Issuing Scheduled Bank *
                </label>
                <input
                  type="text"
                  required
                  value={renewalBank}
                  onChange={(e) => setRenewalBank(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Renewal Audit & Scrutiny Remarks *
                </label>
                <textarea
                  required
                  rows={2}
                  value={renewalRemarks}
                  onChange={(e) => setRenewalRemarks(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
                />
              </div>

              {/* Statutory affirmation */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-semibold text-xs">
                Certified that the replacement FDR carries an unbroken, continuous lien in favour of
                Member Secretary, AICTE, and the bank has confirmed non-release without written Council authorization.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedForRenewal(null)}
                  className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Execute Renewal & Archive Old FDR</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
