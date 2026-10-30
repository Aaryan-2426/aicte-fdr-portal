/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { useAuth } from './context/AuthContext';
import { FDRRecord, NotificationAlert, UserRole } from './types/fdr';
import { INITIAL_FDR_RECORDS, INITIAL_NOTIFICATIONS } from './data/seedFDRs';
import { Header } from './components/Header';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { FDRRepository } from './components/FDRRepository';
import { FDRSubmissionDesk } from './components/FDRSubmissionDesk';
import { BankVerificationDesk } from './components/BankVerificationDesk';
import { MaturityRenewalDesk } from './components/MaturityRenewalDesk';
import { ReleaseRefundDesk } from './components/ReleaseRefundDesk';
import { APHCalculatorDesk } from './components/APHCalculatorDesk';
import { AuditNotificationDesk } from './components/AuditNotificationDesk';
import { LandingPage } from './components/LandingPage';
import { AIAssistantDesk } from './components/AIAssistantDesk';
import { FDRDetailModal } from './components/FDRDetailModal';
import { BankApiProberModal } from './components/BankApiProberModal';
import { AlertCircle, CheckCircle2, Cloud } from 'lucide-react';

export default function App() {
  const { user, userProfile, authError, clearAuthError, updateUserRole } = useAuth();
  const [records, setRecords] = useState<FDRRecord[]>(INITIAL_FDR_RECORDS);
  const [notifications, setNotifications] = useState<NotificationAlert[]>(INITIAL_NOTIFICATIONS);
  const [currentRole, setCurrentRole] = useState<UserRole>('central_director');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [repositoryFilter, setRepositoryFilter] = useState<string>('all');
  const [isFirestoreSynced, setIsFirestoreSynced] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'landing' | 'portal'>('landing');

  // Sync role with userProfile if authenticated
  useEffect(() => {
    if (userProfile?.role) {
      setCurrentRole(userProfile.role);
    }
  }, [userProfile]);

  // Firestore real-time sync: merge Firestore records with INITIAL_FDR_RECORDS (preserving seed/duplicate data)
  useEffect(() => {
    if (!user) return;
    try {
      const recordsCol = collection(db, 'fdrRecords');
      const unsubscribe = onSnapshot(
        recordsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreRecords: FDRRecord[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as FDRRecord;
              firestoreRecords.push(data);
            });

            // Merge Firestore records with initial seed records
            // Firestore data takes precedence, but initial seed records remain intact
            const recordMap = new Map<string, FDRRecord>();
            // Add initial seed records first
            INITIAL_FDR_RECORDS.forEach((r) => recordMap.set(r.id, r));
            // Layer Firestore user submissions/updates over seed data
            firestoreRecords.forEach((r) => recordMap.set(r.id, r));

            setRecords(Array.from(recordMap.values()));
            setIsFirestoreSynced(true);
          } else {
            setIsFirestoreSynced(true);
          }
        },
        (error) => {
          if (!error.message.includes('Missing or insufficient permissions')) {
            console.warn('Firestore real-time sync notification:', error.message);
          }
          // Fall back gracefully to local state
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore subscription initialized in offline mode:', err);
    }
  }, [user]);

  // Modal inspection states
  const [inspectedFDR, setInspectedFDR] = useState<FDRRecord | null>(null);
  const [bankProberFDR, setBankProberFDR] = useState<FDRRecord | null>(null);

  // New record submission handler
  const handleAddNewFDR = async (newRecord: FDRRecord) => {
    // If authenticated user created this, tag with author info
    const recordToSave: FDRRecord = {
      ...newRecord,
      submittedBy: user?.displayName || user?.email || newRecord.submittedBy,
    };

    // Update local state immediately
    setRecords((prev) => [recordToSave, ...prev.filter((r) => r.id !== recordToSave.id)]);

    // Persist to Firestore
    try {
      await setDoc(doc(db, 'fdrRecords', recordToSave.id), recordToSave);
      console.log('Successfully saved FDR record to Firestore:', recordToSave.id);
    } catch (err) {
      console.warn('Local write succeeded; Firestore async push note:', err);
    }

    // Add notification alert
    const newAlert: NotificationAlert = {
      id: `notif-${Date.now()}`,
      fdrId: recordToSave.id,
      fdrNumber: recordToSave.fdrNumber,
      instituteName: recordToSave.instituteName,
      type: recordToSave.status === 'discrepant' ? 'discrepancy_alert' : 'maturity_warning',
      severity: recordToSave.status === 'discrepant' ? 'critical' : 'info',
      title: 'New FDR Security Deposit Submitted',
      message: `Deposit of ${recordToSave.fdrNumber} submitted for ${recordToSave.instituteName} by ${recordToSave.submittedBy}. Queued for statutory scrutiny.`,
      dispatchedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      recipientEmail: 'scrutiny@aicte-india.org',
      recipientPhone: '+91 11 2958 1000',
      acknowledged: false,
    };
    setNotifications((prev) => [newAlert, ...prev]);

    // Also persist alert to notifications collection
    try {
      await setDoc(doc(db, 'notifications', newAlert.id), newAlert);
    } catch {
      // safe fallback
    }
  };

  // Update existing record
  const handleUpdateFDR = async (updated: FDRRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (inspectedFDR && inspectedFDR.id === updated.id) {
      setInspectedFDR(updated);
    }
    if (bankProberFDR && bankProberFDR.id === updated.id) {
      setBankProberFDR(updated);
    }

    // Persist update to Firestore
    try {
      await setDoc(doc(db, 'fdrRecords', updated.id), updated, { merge: true });
    } catch (err) {
      console.warn('Firestore update note:', err);
    }
  };

  // Notification acknowledgement
  const handleAcknowledgeNotification = async (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, acknowledged: true } : n))
    );
    try {
      await setDoc(doc(db, 'notifications', notifId), { acknowledged: true }, { merge: true });
    } catch {
      // safe fallback
    }
  };

  // Dispatch test alert
  const handleDispatchAlert = (alert: NotificationAlert) => {
    setNotifications((prev) => [alert, ...prev]);
  };

  // Quick navigation helper from dashboard
  const handleNavigateTab = (tab: string, filter?: string) => {
    setActiveTab(tab);
    if (filter) {
      setRepositoryFilter(filter);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (user) {
      updateUserRole(role).catch((err) => console.warn('Role update notice:', err));
    }
  };

  const handleLoginSuccess = (role: UserRole, targetTab?: string) => {
    setCurrentRole(role);
    if (targetTab) {
      setActiveTab(targetTab);
    } else {
      if (role === 'bank_officer') setActiveTab('verification');
      else if (role === 'institute_head') setActiveTab('submission');
      else if (role === 'regional_officer') setActiveTab('repository');
      else setActiveTab('dashboard');
    }
    setCurrentView('portal');
  };

  const handleExploreNorms = () => {
    setActiveTab('aph_calculator');
    setCurrentView('portal');
  };

  const unreadAlertCount = notifications.filter((n) => !n.acknowledged).length;

  // 1. Initial State: Landing Page
  if (currentView === 'landing') {
    return (
      <LandingPage
        records={records}
        onLoginSuccess={handleLoginSuccess}
        onExplorePublicNorms={handleExploreNorms}
      />
    );
  }

  // 2. Authenticated Management Portal
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Official Government / AICTE Top Bar */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        unreadAlertCount={unreadAlertCount}
        onOpenNotifications={() => setActiveTab('audit_trail')}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onExitToLanding={() => setCurrentView('landing')}
      />

      {/* Auth error notification banner if present */}
      {authError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Notice: {authError}</span>
          </div>
          <button
            onClick={clearAuthError}
            className="text-amber-700 hover:text-amber-950 font-bold px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <ExecutiveDashboard
            records={records}
            onSelectFDR={(rec) => setInspectedFDR(rec)}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {activeTab === 'repository' && (
          <FDRRepository
            records={records}
            onSelectFDR={(rec) => setInspectedFDR(rec)}
            onInitiateRenewal={(rec) => {
              setActiveTab('maturity');
            }}
            onInitiateBankVerify={(rec) => setBankProberFDR(rec)}
            initialFilter={repositoryFilter}
          />
        )}

        {activeTab === 'submission' && (
          <FDRSubmissionDesk
            onSubmitFDR={handleAddNewFDR}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'verification' && (
          <BankVerificationDesk
            records={records}
            onUpdateRecord={handleUpdateFDR}
            onSelectFDR={(rec) => setInspectedFDR(rec)}
          />
        )}

        {activeTab === 'maturity' && (
          <MaturityRenewalDesk
            records={records}
            onUpdateRecord={handleUpdateFDR}
            onSelectFDR={(rec) => setInspectedFDR(rec)}
          />
        )}

        {activeTab === 'release' && (
          <ReleaseRefundDesk
            records={records}
            onUpdateRecord={handleUpdateFDR}
            onSelectFDR={(rec) => setInspectedFDR(rec)}
          />
        )}

        {activeTab === 'ai_assistant' && <AIAssistantDesk />}

        {activeTab === 'aph_calculator' && <APHCalculatorDesk />}

        {activeTab === 'audit_trail' && (
          <AuditNotificationDesk
            records={records}
            notifications={notifications}
            onAcknowledgeNotification={handleAcknowledgeNotification}
            onDispatchTestAlert={handleDispatchAlert}
          />
        )}
      </main>

      {/* Full FDR Dossier Detail Modal */}
      {inspectedFDR && (
        <FDRDetailModal
          record={inspectedFDR}
          onClose={() => setInspectedFDR(null)}
          onRunBankVerify={(rec) => {
            setBankProberFDR(rec);
          }}
        />
      )}

      {/* Bank CBS API Live Query Modal */}
      {bankProberFDR && (
        <BankApiProberModal
          record={bankProberFDR}
          onClose={() => setBankProberFDR(null)}
          onUpdateRecord={handleUpdateFDR}
        />
      )}

      {/* Official Government Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-center md:text-left">
            <div className="font-semibold text-slate-800">
              All India Council for Technical Education (AICTE) · Regulation Bureau
            </div>
            <div className="text-[11px] text-slate-500">
              Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070 · National Security Deposit & FDR Repository
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>APH Regulations 2024-27</span>
            <span>·</span>
            <span>Finacle / BaNCS Core Banking Integration</span>
            <span>·</span>
            <span>NIC e-Governance Standard</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
