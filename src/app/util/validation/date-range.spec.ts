import { describe, expect, it } from 'vitest';
import { dueDateError, periodError } from './date-range';

describe('date-range', () => {
  it('rejects end before start', () => {
    expect(periodError('2026-05-01', '2026-04-01')).not.toBeNull();
    expect(periodError('2026-05-01', '2026-05-01')).toBeNull();
  });

  it('keeps milestones inside the project period', () => {
    expect(dueDateError('2026-07-01', '2026-01-01', '2026-06-30')).toContain('30.06.2026');
    expect(dueDateError('2025-12-31', '2026-01-01', '2026-06-30')).toContain('01.01.2026');
    expect(dueDateError('2026-03-01', '2026-01-01', '2026-06-30')).toBeNull();
    expect(dueDateError('2026-03-01', undefined, undefined)).toBeNull();
  });
});
