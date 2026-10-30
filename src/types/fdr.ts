/**
 * AICTE Security Deposit & FDR Management Portal
 * Regulatory Data Structures & Type Definitions
 */

export type InstituteCategory =
  | 'Engineering & Technology'
  | 'Management (PGDM/MBA)'
  | 'Pharmacy'
  | 'Architecture & Planning'
  | 'Hotel Management & Catering'
  | 'Applied Arts & Crafts';

export type AICTERegion =
  | 'Northern (Kanpur)'
  | 'North-Western (Chandigarh)'
  | 'Central (Bhopal)'
  | 'Western (Mumbai)'
  | 'South-Western (Bengaluru)'
  | 'Southern (Chennai)'
  | 'Eastern (Kolkata)';

export type FDRStatus =
  | 'active'
  | 'expiring_soon'
  | 'matured_unrenewed'
  | 'renewed'
  | 'under_scrutiny'
  | 'release_requested'
  | 'released'
  | 'discrepant';

export type VerificationSource =
  | 'institution_submitted'
  | 'bank_verified'
  | 'discrepancy_flagged';

export type UserRole =
  | 'central_director' // AICTE HQ New Delhi Regulation Bureau
  | 'regional_officer' // AICTE Regional Office Scrutiny
  | 'institute_head'   // Technical Institute Principal / Director
  | 'bank_officer';    // Scheduled Commercial Bank Verifier

export interface FDRSupportingDoc {
  id: string;
  title: string;
  type: 'fdr_certificate' | 'bank_confirmation' | 'lien_endorsement' | 'board_resolution' | 'noc_eoa';
  fileName: string;
  uploadedAt: string;
  fileSize: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  docUrl?: string;
}

export interface FDRRenewalEvent {
  id: string;
  previousFdrNumber: string;
  newFdrNumber: string;
  renewedDate: string;
  oldMaturityDate: string;
  newMaturityDate: string;
  amount: number;
  bankName: string;
  remarks: string;
  approvedBy: string;
}

export interface ReleaseWorkflow {
  requestId: string;
  requestDate: string;
  requestedBy: string;
  applicantDesignation: string;
  reason: 'completion_of_tenure' | 'closure_of_institution' | 'reduction_in_intake' | 'surrender_of_course';
  lockInTenureMet: boolean;
  noVigilanceCase: boolean;
  noStudentDuesPending: boolean;
  eoaComplianceVerified: boolean;
  regionalOfficeNocIssued: boolean;
  status: 'submitted' | 'scrutiny_cleared' | 'ro_recommended' | 'bureau_approved' | 'discharged';
  scrutinyNotes?: string;
  scrutinyOfficer?: string;
  scrutinyDate?: string;
  roNotes?: string;
  roOfficer?: string;
  roDate?: string;
  bureauNotes?: string;
  bureauOfficer?: string;
  bureauApprovalDate?: string;
  dischargeOrderNo?: string;
  dischargedDate?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  userRole: string;
  userName: string;
  details: string;
  ipAddress?: string;
}

export interface FDRRecord {
  id: string;
  aicteApplicationNo: string;
  permanentInstituteId: string;
  instituteName: string;
  category: InstituteCategory;
  state: string;
  region: AICTERegion;
  
  // Instrument Details
  fdrNumber: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
  fdrAmount: number; // in INR
  interestRate: number; // %
  issueDate: string; // YYYY-MM-DD
  maturityDate: string; // YYYY-MM-DD
  tenureMonths: number;
  lockInPeriodYears: number; // usually 8 or 10 years
  jointName: string; // "Chairman/Secretary of Trust & Regional Officer/Member Secretary, AICTE"
  lienMarked: boolean; // Mandatorily True
  autoRenewal: boolean;
  
  // Regulatory Classification
  purpose:
    | 'Establishment of New Technical Institution'
    | 'Introduction of New Course / Program'
    | 'Increase in Approved Intake'
    | 'Change of Site / Location'
    | 'Extension of Approval (EoA) Compliance';
  aphClause: string;
  
  // Verification and Status
  status: FDRStatus;
  verificationSource: VerificationSource;
  bankConfirmationRef?: string;
  bankConfirmationDate?: string;
  bankVerifiedAmount?: number;
  bankVerifiedLien?: boolean;
  bankVerifiedMaturity?: string;
  discrepancyReasons?: string[];
  
  // Documents & Workflows
  supportingDocuments: FDRSupportingDoc[];
  renewalHistory?: FDRRenewalEvent[];
  releaseDetails?: ReleaseWorkflow;
  auditTrail: AuditLogEntry[];
  submittedBy?: string;
  submittedByUid?: string;
}

export interface NotificationAlert {
  id: string;
  fdrId: string;
  fdrNumber: string;
  instituteName: string;
  type: 'maturity_warning' | 'overdue_unrenewed' | 'discrepancy_alert' | 'release_action' | 'bank_api_mismatch';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  dispatchedAt: string;
  recipientEmail: string;
  recipientPhone: string;
  acknowledged: boolean;
}
