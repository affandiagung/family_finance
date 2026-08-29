import { BudgetCycle, CycleSummary, Transaction } from '../types';
import { formatDateIndonesian } from './formatters';

/**
 * Calculates the start and end dates of a budget cycle based on start day and optional month offset
 * @param startDay Day of month the cycle begins (1-31). e.g., 25 or 1
 * @param offsetMonths 0 = current active cycle, -1 = previous cycle, +1 = next cycle
 * @param referenceDate Base date for calculation (defaults to today)
 */
export function getBudgetCycle(
  startDay: number = 25,
  offsetMonths: number = 0,
  referenceDate: Date = new Date()
): BudgetCycle {
  // Clamp start day between 1 and 31
  const safeStartDay = Math.max(1, Math.min(31, Math.floor(startDay)));
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11
  const currentDay = today.getDate();

  // Determine base month/year for the current cycle
  let baseYear = currentYear;
  let baseMonth = currentMonth;

  if (safeStartDay > 1) {
    if (currentDay < safeStartDay) {
      // We are in the cycle that started last month
      baseMonth = currentMonth - 1;
      if (baseMonth < 0) {
        baseMonth = 11;
        baseYear -= 1;
      }
    }
  }

  // Apply offset
  const targetDate = new Date(baseYear, baseMonth + offsetMonths, 1);
  const cycleYear = targetDate.getFullYear();
  const cycleMonth = targetDate.getMonth();

  let startDate: Date;
  let endDate: Date;

  if (safeStartDay === 1) {
    // 1st to end of the month
    startDate = new Date(cycleYear, cycleMonth, 1);
    // last day of cycleMonth
    endDate = new Date(cycleYear, cycleMonth + 1, 0);
  } else {
    // Starts on safeStartDay of cycleMonth
    const daysInStartMonth = new Date(cycleYear, cycleMonth + 1, 0).getDate();
    const effectiveStartDay = Math.min(safeStartDay, daysInStartMonth);
    startDate = new Date(cycleYear, cycleMonth, effectiveStartDay);

    // Ends on (safeStartDay - 1) of cycleMonth + 1
    const nextMonthDays = new Date(cycleYear, cycleMonth + 2, 0).getDate();
    const effectiveEndDay = Math.min(safeStartDay - 1, nextMonthDays);
    endDate = new Date(cycleYear, cycleMonth + 1, effectiveEndDay);
  }

  // Format to YYYY-MM-DD
  const formatISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const startIso = formatISO(startDate);
  const endIso = formatISO(endDate);

  const monthsFull = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Month label: either "Agustus 2026" or "Agu - Sep 2026"
  const monthName = safeStartDay === 1
    ? `${monthsFull[cycleMonth]} ${cycleYear}`
    : `${formatDateIndonesian(startIso, 'short')} - ${formatDateIndonesian(endIso, 'short')}`;

  const diffTime = endDate.getTime() - startDate.getTime();
  const daysTotal = Math.round(diffTime / (1000 * 3600 * 24)) + 1;

  // Day current
  const isCurrentCycle = offsetMonths === 0;
  let dayCurrent = 1;

  if (today >= startDate && today <= endDate) {
    const elapsed = today.getTime() - startDate.getTime();
    dayCurrent = Math.min(daysTotal, Math.max(1, Math.round(elapsed / (1000 * 3600 * 24)) + 1));
  } else if (today > endDate) {
    dayCurrent = daysTotal;
  } else {
    dayCurrent = 0;
  }

  return {
    startDate: startIso,
    endDate: endIso,
    label: `Siklus ${formatDateIndonesian(startIso, 'short')} - ${formatDateIndonesian(endIso, 'short')}`,
    monthName,
    year: cycleYear,
    month: cycleMonth + 1,
    daysTotal,
    dayCurrent,
    isCurrentCycle,
  };
}

export function computeCycleSummary(
  transactions: Transaction[],
  cycle: BudgetCycle,
  monthlyBudget: number = 8500000
): CycleSummary {
  const filtered = transactions.filter((t) => {
    return t.date >= cycle.startDate && t.date <= cycle.endDate;
  });

  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of filtered) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
    }
  }

  const netSavings = totalIncome - totalExpense;
  const budget = monthlyBudget > 0 ? monthlyBudget : totalIncome;
  const budgetRemaining = budget - totalExpense;
  const budgetUsagePercent = budget > 0 ? Math.min(1000, (totalExpense / budget) * 100) : 0;

  const daysElapsed = Math.max(1, cycle.dayCurrent);
  const dailyAverageExpense = totalExpense / daysElapsed;

  const daysRemaining = Math.max(0, cycle.daysTotal - cycle.dayCurrent);
  const dailyBudgetRemaining = daysRemaining > 0 ? Math.max(0, budgetRemaining) / daysRemaining : 0;

  return {
    cycle,
    totalIncome,
    totalExpense,
    netSavings,
    budget,
    budgetRemaining,
    budgetUsagePercent,
    dailyAverageExpense,
    dailyBudgetRemaining,
    transactionCount: filtered.length,
  };
}
