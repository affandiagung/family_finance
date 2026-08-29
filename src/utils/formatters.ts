export function formatIDR(amount: number, withPrefix = true): string {
  const rounded = Math.round(amount || 0);
  const formatted = new Intl.NumberFormat('id-ID').format(rounded);
  return withPrefix ? `Rp ${formatted}` : formatted;
}

export function formatCompactIDR(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
  }
  if (abs >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} jt`;
  }
  if (abs >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} rb`;
  }
  return formatIDR(amount);
}

export function formatDateIndonesian(dateStr: string, formatType: 'full' | 'short' | 'day-date' = 'short'): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;

  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthsFull = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const daysFull = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const day = date.getDate();
  const monthIdx = date.getMonth();
  const year = date.getFullYear();
  const dayName = daysFull[date.getDay()];

  if (formatType === 'full') {
    return `${dayName}, ${day} ${monthsFull[monthIdx]} ${year}`;
  }
  if (formatType === 'day-date') {
    return `${dayName}, ${day} ${monthsShort[monthIdx]}`;
  }
  return `${day} ${monthsShort[monthIdx]} ${year}`;
}

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
