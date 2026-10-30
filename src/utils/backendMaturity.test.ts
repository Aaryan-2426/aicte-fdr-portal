import test from 'node:test';
import assert from 'node:assert';

// Simulate backend validation logic for testing
function validateBackendMaturityPeriod(issueDateStr: string, maturityDateStr: string, requiredYears: number = 10) {
  if (!issueDateStr || !maturityDateStr) {
    return { isValid: false, error: 'Issue date and maturity date are required.' };
  }
  const issueDate = new Date(issueDateStr);
  const maturityDate = new Date(maturityDateStr);
  if (isNaN(issueDate.getTime()) || isNaN(maturityDate.getTime())) {
    return { isValid: false, error: 'Invalid date format.' };
  }
  const minMatDate = new Date(issueDate);
  minMatDate.setFullYear(minMatDate.getFullYear() + requiredYears);

  const matUtc = Date.UTC(maturityDate.getFullYear(), maturityDate.getMonth(), maturityDate.getDate());
  const minMatUtc = Date.UTC(minMatDate.getFullYear(), minMatDate.getMonth(), minMatDate.getDate());
  const minMatDateStr = minMatDate.toISOString().split('T')[0];

  if (matUtc < minMatUtc) {
    return {
      isValid: false,
      error: `Server Rejection: Maturity date (${maturityDateStr}) violates AICTE ${requiredYears}-year lock-in norm. Minimum permitted maturity date for issue date ${issueDateStr} is ${minMatDateStr}.`,
    };
  }
  return { isValid: true };
}

test('Backend FDR Maturity Validation Test Cases', () => {
  // Case 1: 15-10-2026 to 15-10-2036 -> Accept
  const res1 = validateBackendMaturityPeriod('2026-10-15', '2036-10-15', 10);
  assert.strictEqual(res1.isValid, true, 'Backend Case 1 should be accepted');

  // Case 2: 15-10-2026 to 15-10-2035 -> Reject (9 years)
  const res2 = validateBackendMaturityPeriod('2026-10-15', '2035-10-15', 10);
  assert.strictEqual(res2.isValid, false, 'Backend Case 2 (9 years) should be rejected');

  // Case 3: 15-10-2026 to 15-10-2030 -> Reject (4 years)
  const res3 = validateBackendMaturityPeriod('2026-10-15', '2030-10-15', 10);
  assert.strictEqual(res3.isValid, false, 'Backend Case 3 (4 years) should be rejected');

  // Case 4: 15-10-2026 to 14-10-2036 -> Reject (1 day short)
  const res4 = validateBackendMaturityPeriod('2026-10-15', '2036-10-14', 10);
  assert.strictEqual(res4.isValid, false, 'Backend Case 4 (1 day short) should be rejected');

  // Case 5: 15-10-2026 to 16-10-2036 -> Accept (10 years + 1 day)
  const res5 = validateBackendMaturityPeriod('2026-10-15', '2036-10-16', 10);
  assert.strictEqual(res5.isValid, true, 'Backend Case 5 (10 years + 1 day) should be accepted');
});
