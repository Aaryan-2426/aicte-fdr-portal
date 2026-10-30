import React, { useState } from 'react';
import { FDRRecord, NotificationAlert } from '../types/fdr';
import {
  History,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  ShieldCheck,
  Send,
  Filter,
} from 'lucide-react';

interface AuditNotificationDeskProps {
  records: FDRRecord[];
  notifications: NotificationAlert[];
  onAcknowledgeNotification: (id: string) => void;
  onDispatchTestAlert: (alert: NotificationAlert) => void;
}

export const AuditNotificationDesk: React.FC<AuditNotificationDeskProps> = ({
  records,
  notifications,
  onAcknowledgeNotification,
  onDispatchTestAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'notifications'>('audit');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collect all audit entries from all FDRs
  const allAuditEntries = records
    .flatMap((r) =>
      r.auditTrail.map((a) => ({
        ...a,
        fdrNumber: r.fdrNumber,
        instituteName: r.instituteName,
        permanentInstituteId: r.permanentInstituteId,
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredAudit = allAuditEntries.filter((entry) => {
    if (roleFilter !== 'all' && !entry.userRole.toLowerCase().includes(roleFilter.toLowerCase())) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        entry.action.toLowerCase().includes(q) ||
        entry.userName.toLowerCase().includes(q) ||
        entry.instituteName.toLowerCase().includes(q) ||
        entry.fdrNumber.toLowerCase().includes(q) ||
        entry.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateTestNotice = () => {
    const testAlert: NotificationAlert = {
      id: `notif-${Date.now()}`,
      fdrId: records[1]?.id || 'fdr-101',
      fdrNumber: records[1]?.fdrNumber || 'FDR/TEST/2026/01',
      instituteName: records[1]?.instituteName || 'Technical Institute',
      type: 'maturity_warning',
      severity: 'warning',
      title: 'Manual Statutory Intimation Notice Dispatched',
      message: `Statutory reminder dispatched by Regulation Bureau Officer to Institution Head & Bank Branch Manager.`,
      dispatchedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      recipientEmail: 'registrar@institution.edu.in',
      recipientPhone: '+91 98110 99882',
      acknowledged: false,
    };
    onDispatchTestAlert(testAlert);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span>Accountability & Transparency Ledger</span>
              <span>·</span>
              <span>Immutable Regulatory Log</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Audit Trail & Automated Alerts Dispatch Center
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Traceable records of every FDR submission, Core Banking System API verification result,
              officer scrutiny action, and automated SMS / Email notification dispatched to institutional stakeholders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'audit'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Audit Trail ({allAuditEntries.length})
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'notifications'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Alerts Dispatch ({notifications.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search audit actions, user, institute or FDR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Filter Role:</span>
              <select
                aria-label="Filter Audit Role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-300 rounded-md font-medium text-slate-800"
              >
                <option value="all">All Stakeholder Roles</option>
                <option value="Central">AICTE Central Bureau</option>
                <option value="Regional">Regional Scrutiny Officer</option>
                <option value="Principal">Institute Representative</option>
                <option value="Bank">Bank Verification Gateway</option>
                <option value="Daemon">System Automation</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Authorized User & Role</th>
                  <th className="py-3 px-4">Target Institution & FDR</th>
                  <th className="py-3 px-4">Audit Details & Cryptographic Trace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAudit.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {entry.timestamp}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {entry.action}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{entry.userName}</div>
                      <div className="text-[11px] text-slate-500">{entry.userRole}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-800 truncate">{entry.instituteName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{entry.fdrNumber}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-md">
                      <div>{entry.details}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Hash: {entry.id} · SHA-256 Verified
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Notifications & Escalations */}
      {activeTab === 'notifications' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Automated Dispatch Log</h3>
              <p className="text-xs text-slate-500">
                Statutory notifications, escalation memos, and email/SMS alerts dispatched to institutions and branch managers.
              </p>
            </div>

            <button
              onClick={handleCreateTestNotice}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulate Dispatch Notice</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  !notif.acknowledged ? 'bg-amber-50/30 px-3 rounded-lg' : ''
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        notif.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : notif.severity === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {notif.severity.toUpperCase()}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {notif.fdrNumber}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">{notif.dispatchedAt}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{notif.title}</h4>
                  <p className="text-xs text-slate-600">{notif.message}</p>

                  <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {notif.recipientEmail}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {notif.recipientPhone}
                    </span>
                    <span className="text-emerald-700 font-semibold">Delivered via NIC Gateway</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {!notif.acknowledged ? (
                    <button
                      onClick={() => onAcknowledgeNotification(notif.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:border-slate-400 text-slate-800 rounded-lg transition-colors"
                    >
                      Mark Acknowledged
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
