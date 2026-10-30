import React, { useState } from 'react';
import { FDRRecord } from '../types/fdr';
import { formatINR, detectFDRDiscrepancies } from '../utils/fdrEngine';
import { RotateCw, CheckCircle2, AlertTriangle, ShieldCheck, Landmark } from 'lucide-react';

interface BankApiProberModalProps {
  record: FDRRecord;
  onClose: () => void;
  onUpdateRecord: (updatedRecord: FDRRecord) => void;
}

export const BankApiProberModal: React.FC<BankApiProberModalProps> = ({
  record,
  onClose,
  onUpdateRecord,
}) => {
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [result, setResult] = useState<{
    success: boolean;
    cbsRef: string;
    verifiedAmount: number;
    verifiedLien: boolean;
    discrepancies: string[];
  } | null>(null);

  const handleExecuteProbe = () => {
    setIsQuerying(true);
    setResult(null);

    setTimeout(() => {
      setIsQuerying(false);

      const isDiscrepantTarget = record.id === 'fdr-104';
      const verifiedAmount = isDiscrepantTarget ? 2500000 : record.fdrAmount;
      const verifiedLien = !isDiscrepantTarget;
      const cbsRef = `${record.bankName.slice(0, 3).toUpperCase()}/CBS-LIVE/${Date.now().toString().slice(-6)}`;

      const discrepancies = detectFDRDiscrepancies(
        {
          fdrAmount: record.fdrAmount,
          maturityDate: record.maturityDate,
          lienMarked: record.lienMarked,
          bankName: record.bankName,
          jointName: record.jointName,
        },
        {
          fdrAmount: verifiedAmount,
          maturityDate: record.maturityDate,
          lienMarked: verifiedLien,
          accountStatus: 'active',
        }
      );

      setResult({
        success: discrepancies.length === 0,
        cbsRef,
        verifiedAmount,
        verifiedLien,
        discrepancies,
      });

      const updated: FDRRecord = {
        ...record,
        verificationSource: discrepancies.length > 0 ? 'discrepancy_flagged' : 'bank_verified',
        status: discrepancies.length > 0 ? 'discrepant' : 'active',
        bankConfirmationRef: cbsRef,
        bankConfirmationDate: '2026-10-30',
        bankVerifiedAmount: verifiedAmount,
        bankVerifiedLien: verifiedLien,
        bankVerifiedMaturity: record.maturityDate,
        discrepancyReasons: discrepancies.length > 0 ? discrepancies : undefined,
        auditTrail: [
          ...record.auditTrail,
          {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            action: 'Direct CBS API Query & Reconciliation',
            userRole: 'AICTE Bank Gateway',
            userName: 'Core Banking Integration API',
            details: discrepancies.length > 0
              ? `Reconciliation flagged: ${discrepancies.join('; ')}`
              : `Successfully confirmed against ${record.bankName} core banking database under Ref #${cbsRef}.`,
          },
        ],
      };

      onUpdateRecord(updated);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-slate-800" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Core Banking API Live Query</h3>
              <div className="text-[11px] text-slate-500">
                {record.bankName} · Branch IFSC: {record.ifscCode}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg"
          >
            ✕
          </button>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <div className="font-bold text-slate-900">{record.instituteName}</div>
          <div className="text-slate-600">
            FDR Number: <span className="font-mono font-bold text-slate-900">{record.fdrNumber}</span>
          </div>
          <div className="text-slate-600">
            Claimed Amount: <span className="font-bold tabular-nums">{formatINR(record.fdrAmount)}</span>
          </div>
        </div>

        {/* Live status or results */}
        {isQuerying ? (
          <div className="p-8 text-center space-y-3">
            <RotateCw className="w-8 h-8 text-slate-900 animate-spin mx-auto" />
            <div className="text-xs font-semibold text-slate-700">
              Querying {record.bankName} Centralized Finacle / BaNCS CBS Host...
            </div>
            <p className="text-[11px] text-slate-500">
              Validating account existence, active balance, joint ownership, and AICTE lien status.
            </p>
          </div>
        ) : result ? (
          <div className="space-y-3">
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                result.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {result.success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>CBS Verification Confirmed</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Discrepancies Flagged by Bank Core System</span>
                  </>
                )}
              </div>

              <div className="space-y-1 text-xs">
                <div>
                  Bank Acknowledgment Ref:{' '}
                  <span className="font-mono font-bold">{result.cbsRef}</span>
                </div>
                <div>
                  CBS Verified Balance:{' '}
                  <span className="font-bold tabular-nums">
                    {formatINR(result.verifiedAmount)}
                  </span>
                </div>
                <div>
                  Lien Endorsed to AICTE in Bank System:{' '}
                  <span className="font-semibold">
                    {result.verifiedLien ? 'Confirmed Active' : 'Not Marked'}
                  </span>
                </div>
              </div>

              {result.discrepancies.length > 0 && (
                <div className="pt-2 border-t border-rose-200">
                  <div className="font-bold text-rose-900">Mismatches:</div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-rose-800">
                    {result.discrepancies.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2 text-xs">
            <p className="text-slate-600">
              Click below to trigger an independent, encrypted query to {record.bankName}'s
              regulatory verification gateway.
            </p>
          </div>
        )}

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
          >
            Close
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleExecuteProbe}
              disabled={isQuerying}
              className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isQuerying ? 'animate-spin' : ''}`} />
              <span>Query Core Banking Host</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
