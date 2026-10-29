import { formatDayLabel } from '../../../src/lib/format.ts';

describe('formatDayLabel', () => {
  it('formata o dia no calendário da cidade, sem deslocar o fuso', () => {
    expect(formatDayLabel('2026-10-29')).toBe('qui, 29/10');
    expect(formatDayLabel('2026-11-01')).toBe('dom, 01/11');
  });

  it('devolve a string original quando a data não é ISO', () => {
    expect(formatDayLabel('29/10/2026')).toBe('29/10/2026');
  });
});
