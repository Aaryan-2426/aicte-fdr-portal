import test from 'node:test';
import assert from 'node:assert';
import { validateMaturityPeriod } from './fdrEngine.js';

test('Mandatory FDR Maturity Period Test Cases (10-Year Lock-In)', () => {
  // Case 1: 15-10-2026 to 15-10-2036 -> Accept
  const res1 = validateMaturityPeriod('2026-10-15', '2036-10-15', 10);
  assert.strictEqual(res1.isValid, true, 'Case 1: 15-10-2026 to 15-10-2036 should be accepted');

  // Case 2: 15-10-2026 to 15-10-2035 -> Reject (9 years)
  const res2 = validateMaturityPeriod('2026-10-15', '2035-10-15', 10);
  assert.strictEqual(res2.isValid, false, 'Case 2: 15-10-2026 to 15-10-2035 should be rejected');

  // Case 3: 15-10-2026 to 15-10-2030 -> Reject (4 years)
  const res3 = validateMaturityPeriod('2026-10-15', '2030-10-15', 10);
  assert.strictEqual(res3.isValid, false, 'Case 3: 15-10-2026 to 15-10-2030 should be rejected');

  // Case 4: 15-10-2026 to 14-10-2036 -> Reject (1 day short of 10 years)
  const res4 = validateMaturityPeriod('2026-10-15', '2036-10-14', 10);
  assert.strictEqual(res4.isValid, false, 'Case 4: 15-10-2026 to 14-10-2036 should be rejected');

  // Case 5: 15-10-2026 to 16-10-2036 -> Accept (10 years + 1 day)
  const res5 = validateMaturityPeriod('2026-10-15', '2036-10-16', 10);
  assert.strictEqual(res5.isValid, true, 'Case 5: 15-10-2026 to 16-10-2036 should be accepted');
});

test('Leap year boundary test cases', () => {
  const resLeap = validateMaturityPeriod('2024-02-29', '2034-03-01', 10);
  assert.strictEqual(resLeap.isValid, true, 'Leap year 2024-02-29 to 2034-03-01 should be accepted');
});
