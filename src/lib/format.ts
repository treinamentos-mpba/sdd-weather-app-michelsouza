/** Rótulo do dia no fuso da cidade, sem converter para o fuso do dispositivo. Ex.: "qui, 29/10". */
export function formatDayLabel(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return isoDate;
  }

  const [, year, month, day] = match;
  const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' })
    .format(utcDate)
    .replace('.', '')
    .toLowerCase();

  return `${weekday}, ${day}/${month}`;
}
