/**
 * Pure regulatory and mathematical engine for AICTE FDR & Security Deposit Portal.
 * Decoupled from UI components for deterministic validation and unit testing.
 */

// Format numbers in Indian Rupee format (e.g., ₹35,00,000)
export function formatINR(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  });
  return formatter.format(amount);
}

// Convert rupees into Lakhs or Crores representation for high-level regulatory reporting
export function formatINRLakhsOrCrores(amount: number): string {
  if (amount >= 10000000) {
    const cr = (amount / 10000000).toFixed(2);
    return `₹${cr} Cr`;
  }
  const lakhs = (amount / 100000).toFixed(2);
  return `₹${lakhs} Lakhs`;
}

// Calculate days remaining until maturity
export function calculateDaysRemaining(maturityDateStr: string, referenceDateStr?: string): number {
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const matDate = new Date(maturityDateStr);
  
  // Normalize both dates to midnight UTC to prevent time zone drift
  const utcRef = Date.UTC(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const utcMat = Date.UTC(matDate.getFullYear(), matDate.getMonth(), matDate.getDate());
  
  const diffMs = utcMat - utcRef;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export type MaturityUrgency = 'normal' | 'notice_90' | 'warning_60' | 'critical_30' | 'urgent_15' | 'expired';

export interface MaturityEvaluation {
  daysLeft: number;
  urgency: MaturityUrgency;
  isOverdue: boolean;
  actionRequired: string;
}

export function evaluateMaturity(maturityDateStr: string, referenceDateStr?: string): MaturityEvaluation {
  const daysLeft = calculateDaysRemaining(maturityDateStr, referenceDateStr);
  
  if (daysLeft < 0) {
    return {
      daysLeft,
      urgency: 'expired',
      isOverdue: true,
      actionRequired: 'Matured & Overdue: Immediate Renewal or Encashment Notice to Institution and Bank',
    };
  }
  if (daysLeft <= 15) {
    return {
      daysLeft,
      urgency: 'urgent_15',
      isOverdue: false,
      actionRequired: 'Critical (≤15 days): Final reminder issued; initiate replacement FDR submission',
    };
  }
  if (daysLeft <= 30) {
    return {
      daysLeft,
      urgency: 'critical_30',
      isOverdue: false,
      actionRequired: 'Urgent (≤30 days): Advance notice to Institution Management & Regional Office',
    };
  }
  if (daysLeft <= 60) {
    return {
      daysLeft,
      urgency: 'warning_60',
      isOverdue: false,
      actionRequired: 'Warning (≤60 days): Automated 60-day renewal intimation sent',
    };
  }
  if (daysLeft <= 90) {
    return {
      daysLeft,
      urgency: 'notice_90',
      isOverdue: false,
      actionRequired: 'Notice (≤90 days): Pre-maturity advisory logged in regulatory calendar',
    };
  }
  return {
    daysLeft,
    urgency: 'normal',
    isOverdue: false,
    actionRequired: 'Instrument active and valid under regulatory custody',
  };
}

/**
 * AICTE Approval Process Handbook (APH) Minimum Security Deposit Calculation
 * Standard regulatory deposit rules as per AICTE APH Regulations:
 * - Technical Engineering (Degree): ₹35 Lakhs for New Institution, lock-in 10 years (₹28 Lakhs for Women/Minority/Divyang)
 * - Management (Standalone PGDM/MBA): ₹25 Lakhs, lock-in 8 years
 * - Pharmacy (Degree): ₹30 Lakhs, lock-in 8 years
 * - Architecture & Planning: ₹20 Lakhs, lock-in 8 years
 * - Hotel Management & Catering: ₹20 Lakhs, lock-in 8 years
 * - Applied Arts & Crafts: ₹15 Lakhs, lock-in 8 years
 * - Introduction of Additional Course: ₹10 Lakhs per program
 * - Increase in Intake: ₹5 Lakhs per 60 seat division
 */
export function calculateAPHNormRequiredFDR(
  category: string,
  purpose: string,
  isMinorityOrWomenOrDivyang: boolean = false
): {
  requiredAmountINR: number;
  requiredAmountLakhs: number;
  lockInYears: number;
  aphReference: string;
} {
  let baseAmount = 3500000; // Default ₹35 Lakhs
  let lockIn = 10;
  let clause = 'APH 2024-27 Norms Schedule 1';

  if (purpose.includes('Increase in Approved Intake')) {
    return {
      requiredAmountINR: 500000,
      requiredAmountLakhs: 5,
      lockInYears: 5,
      aphReference: 'APH 2024-27 Chapter II Clause 2.8 (Intake Expansion)',
    };
  }

  if (purpose.includes('Introduction of New Course')) {
    return {
      requiredAmountINR: 1000000,
      requiredAmountLakhs: 10,
      lockInYears: 5,
      aphReference: 'APH 2024-27 Chapter II Clause 2.4 (New Program Addition)',
    };
  }

  switch (category) {
    case 'Engineering & Technology':
      baseAmount = isMinorityOrWomenOrDivyang ? 2800000 : 3500000;
      lockIn = 10;
      clause = 'APH Chapter I Clause 1.4.1 (Degree Engineering Institutional Security)';
      break;
    case 'Management (PGDM/MBA)':
      baseAmount = isMinorityOrWomenOrDivyang ? 2000000 : 2500000;
      lockIn = 8;
      clause = 'APH Chapter I Clause 1.4.3 (Standalone Management Institute)';
      break;
    case 'Pharmacy':
      baseAmount = isMinorityOrWomenOrDivyang ? 2400000 : 3000000;
      lockIn = 8;
      clause = 'APH Chapter I Clause 1.4.4 (Technical Pharmacy Institute)';
      break;
    case 'Architecture & Planning':
      baseAmount = isMinorityOrWomenOrDivyang ? 1600000 : 2000000;
      lockIn = 8;
      clause = 'APH Chapter I Clause 1.4.5 (Architecture Institution)';
      break;
    case 'Hotel Management & Catering':
      baseAmount = isMinorityOrWomenOrDivyang ? 1600000 : 2000000;
      lockIn = 8;
      clause = 'APH Chapter I Clause 1.4.6 (HMCT Institute)';
      break;
    case 'Applied Arts & Crafts':
      baseAmount = isMinorityOrWomenOrDivyang ? 1200000 : 1500000;
      lockIn = 8;
      clause = 'APH Chapter I Clause 1.4.7 (Applied Arts Institution)';
      break;
    default:
      baseAmount = 2500000;
      lockIn = 8;
      clause = 'APH General Technical Regulations';
  }

  return {
    requiredAmountINR: baseAmount,
    requiredAmountLakhs: baseAmount / 100000,
    lockInYears: lockIn,
    aphReference: clause,
  };
}

/**
 * Validates Indian Financial System Code (IFSC) standard (4 letters, 0, 6 alpha-numeric)
 */
export function validateIFSCCode(ifsc: string): boolean {
  if (!ifsc) return false;
  const regex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return regex.test(ifsc.trim().toUpperCase());
}

/**
 * Detect discrepancies between institution-submitted FDR and independent bank API/master data
 */
export function detectFDRDiscrepancies(
  submitted: {
    fdrAmount: number;
    maturityDate: string;
    lienMarked: boolean;
    bankName: string;
    jointName?: string;
  },
  bankRecord?: {
    fdrAmount?: number;
    maturityDate?: string;
    lienMarked?: boolean;
    bankName?: string;
    accountStatus?: string;
  }
): string[] {
  const flags: string[] = [];

  // Check 1: Mandatory Lien Marking
  if (!submitted.lienMarked) {
    flags.push('CRITICAL: FDR instrument does not bear lien marking endorsement in favour of Member Secretary, AICTE');
  }

  // Check 2: Joint Name specification
  if (submitted.jointName && !submitted.jointName.toLowerCase().includes('aicte')) {
    flags.push('DISCREPANCY: Joint account name must include official designation of AICTE (Member Secretary / Regional Officer)');
  }

  // Check 3: Cross-verification with Bank API Record if available
  if (bankRecord) {
    if (bankRecord.fdrAmount !== undefined && Math.abs(bankRecord.fdrAmount - submitted.fdrAmount) > 1) {
      flags.push(
        `AMOUNT MISMATCH: Institution submitted ${formatINR(submitted.fdrAmount)}, but Bank API confirms ${formatINR(bankRecord.fdrAmount)}`
      );
    }

    if (bankRecord.maturityDate && bankRecord.maturityDate !== submitted.maturityDate) {
      flags.push(
        `MATURITY DATE MISMATCH: Institution claimed ${submitted.maturityDate}, but Core Banking confirms ${bankRecord.maturityDate}`
      );
    }

    if (bankRecord.lienMarked !== undefined && !bankRecord.lienMarked) {
      flags.push('BANK CONFIRMATION MISMATCH: Issuing Bank core system reports lien is NOT marked on this deposit');
    }

    if (bankRecord.accountStatus && bankRecord.accountStatus.toLowerCase() !== 'active') {
      flags.push(`BANK STATUS WARNING: Core banking reports deposit status as "${bankRecord.accountStatus}"`);
    }
  }

  return flags;
}

/**
 * Calculate lock-in tenure eligibility for release/refund
 */
export function evaluateReleaseEligibility(
  issueDateStr: string,
  lockInYears: number,
  referenceDateStr?: string
): {
  isEligible: boolean;
  yearsCompleted: number;
  yearsRequired: number;
  remainingYears: number;
  completionDateStr: string;
} {
  const issueDate = new Date(issueDateStr);
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();

  const completionDate = new Date(issueDate);
  completionDate.setFullYear(completionDate.getFullYear() + lockInYears);

  const diffMs = refDate.getTime() - issueDate.getTime();
  const yearsCompleted = parseFloat((diffMs / (1000 * 60 * 60 * 24 * 365.25)).toFixed(2));
  const remainingYears = parseFloat(Math.max(0, lockInYears - yearsCompleted).toFixed(2));

  return {
    isEligible: yearsCompleted >= lockInYears,
    yearsCompleted: Math.max(0, yearsCompleted),
    yearsRequired: lockInYears,
    remainingYears,
    completionDateStr: completionDate.toISOString().split('T')[0],
  };
}

/**
 * Compound Interest Yield calculation for Fixed Deposits
 * Compounded quarterly as per standard Indian Banking practices
 */
export function calculateMaturityYield(
  principal: number,
  annualRatePct: number,
  tenureMonths: number
): {
  maturityValue: number;
  interestEarned: number;
} {
  if (principal <= 0 || annualRatePct <= 0 || tenureMonths <= 0) {
    return { maturityValue: principal, interestEarned: 0 };
  }
  
  // Quarterly compounding: n = 4, t = tenureMonths / 12
  const r = annualRatePct / 100;
  const n = 4;
  const t = tenureMonths / 12;
  
  const maturityValue = Math.round(principal * Math.pow(1 + r / n, n * t));
  const interestEarned = Math.max(0, maturityValue - principal);
  
  return { maturityValue, interestEarned };
}
