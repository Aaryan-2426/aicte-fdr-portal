import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatINR,
  formatINRLakhsOrCrores,
  calculateDaysRemaining,
  evaluateMaturity,
  calculateAPHNormRequiredFDR,
  validateIFSCCode,
  detectFDRDiscrepancies,
  evaluateReleaseEligibility,
  calculateMaturityYield,
} from './fdrEngine.ts';

test('formatINR formats currency in Indian numbering system', () => {
  const formatted = formatINR(3500000);
  assert.ok(formatted.includes('35,00,000'));
});

test('formatINRLakhsOrCrores converts numbers to Crore and Lakh representations', () => {
  assert.equal(formatINRLakhsOrCrores(15000000), '₹1.50 Cr');
  assert.equal(formatINRLakhsOrCrores(3500000), '₹35.00 Lakhs');
});

test('calculateDaysRemaining computes exact day difference normalized to UTC', () => {
  const ref = '2026-10-30';
  const mat1 = '2026-11-14'; // 15 days away
  const mat2 = '2026-10-25'; // 5 days past
  assert.equal(calculateDaysRemaining(mat1, ref), 15);
  assert.equal(calculateDaysRemaining(mat2, ref), -5);
});

test('evaluateMaturity assigns correct urgency thresholds', () => {
  const ref = '2026-10-30';
  
  // Overdue
  const overdue = evaluateMaturity('2026-10-20', ref);
  assert.equal(overdue.urgency, 'expired');
  assert.equal(overdue.isOverdue, true);

  // Critical 15 days
  const critical = evaluateMaturity('2026-11-10', ref);
  assert.equal(critical.urgency, 'urgent_15');
  assert.equal(critical.isOverdue, false);

  // Critical 30 days
  const warning30 = evaluateMaturity('2026-11-25', ref);
  assert.equal(warning30.urgency, 'critical_30');

  // Normal safe
  const normal = evaluateMaturity('2027-10-30', ref);
  assert.equal(normal.urgency, 'normal');
});

test('calculateAPHNormRequiredFDR returns correct APH prescribed security amounts', () => {
  const engStandard = calculateAPHNormRequiredFDR(
    'Engineering & Technology',
    'Establishment of New Technical Institution',
    false
  );
  assert.equal(engStandard.requiredAmountINR, 3500000);
  assert.equal(engStandard.lockInYears, 10);

  const engConcession = calculateAPHNormRequiredFDR(
    'Engineering & Technology',
    'Establishment of New Technical Institution',
    true
  );
  assert.equal(engConcession.requiredAmountINR, 2800000);

  const management = calculateAPHNormRequiredFDR(
    'Management (PGDM/MBA)',
    'Establishment of New Technical Institution'
  );
  assert.equal(management.requiredAmountINR, 2500000);
  assert.equal(management.lockInYears, 8);

  const intake = calculateAPHNormRequiredFDR(
    'Engineering & Technology',
    'Increase in Approved Intake'
  );
  assert.equal(intake.requiredAmountINR, 500000);
});

test('validateIFSCCode checks RBI IFSC format standard', () => {
  assert.equal(validateIFSCCode('SBIN0001040'), true);
  assert.equal(validateIFSCCode('HDFC0000128'), true);
  assert.equal(validateIFSCCode('PUNB0123456'), true);
  assert.equal(validateIFSCCode('INVALID123'), false);
  assert.equal(validateIFSCCode('SBIN1000104'), false); // 5th char must be 0
});

test('detectFDRDiscrepancies flags missing lien and bank mismatch', () => {
  // Missing lien
  const res1 = detectFDRDiscrepancies({
    fdrAmount: 3500000,
    maturityDate: '2026-12-31',
    lienMarked: false,
    bankName: 'State Bank of India',
    jointName: 'Chairman & Member Secretary, AICTE',
  });
  assert.ok(res1.some(d => d.includes('CRITICAL: FDR instrument does not bear lien marking')));

  // Bank mismatch
  const res2 = detectFDRDiscrepancies(
    {
      fdrAmount: 3500000,
      maturityDate: '2026-12-31',
      lienMarked: true,
      bankName: 'State Bank of India',
      jointName: 'Chairman & Member Secretary, AICTE',
    },
    {
      fdrAmount: 3000000, // mismatch
      maturityDate: '2026-11-30', // mismatch
      lienMarked: false,
      accountStatus: 'active',
    }
  );
  assert.equal(res2.length, 3);
});

test('evaluateReleaseEligibility verifies lock-in tenure', () => {
  const ref = '2026-10-30';
  
  // 10 years completed from 2015
  const eligible = evaluateReleaseEligibility('2015-05-15', 10, ref);
  assert.equal(eligible.isEligible, true);
  assert.ok(eligible.yearsCompleted > 10);

  // Ineligible: only 4 years completed from 2022
  const ineligible = evaluateReleaseEligibility('2022-05-15', 10, ref);
  assert.equal(ineligible.isEligible, false);
  assert.ok(ineligible.remainingYears > 5);
});

test('calculateMaturityYield calculates quarterly compounding correctly', () => {
  const yieldResult = calculateMaturityYield(1000000, 7.0, 36); // ₹10L at 7% for 3 years
  // A = 1000000 * (1 + 0.07/4)^(12) = 1,231,439 approx
  assert.ok(yieldResult.maturityValue > 1230000 && yieldResult.maturityValue < 1235000);
  assert.equal(yieldResult.interestEarned, yieldResult.maturityValue - 1000000);
});
