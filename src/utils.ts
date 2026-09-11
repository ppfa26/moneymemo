// 공용 유틸 함수

/** 간단한 고유 id 생성 */
export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 금액을 한국식 콤마 표기로 (예: 50000 -> "50,000") */
export function formatMoney(amount: number): string {
  return amount.toLocaleString("ko-KR");
}

/** yyyy-mm-dd 문자열 반환 (기본: 오늘) */
export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** yyyy-mm (해당 월 키) */
export function yearMonth(dateISO: string): string {
  return dateISO.slice(0, 7);
}

/** 날짜 표시용 (예: "2026. 10. 15.") */
export function formatDate(dateISO: string): string {
  const [y, m, d] = dateISO.split("-");
  if (!y || !m || !d) return dateISO;
  return `${y}. ${Number(m)}. ${Number(d)}.`;
}

/** 이번 달 yyyy-mm */
export function currentYearMonth(): string {
  return todayISO().slice(0, 7);
}

/** 올해 yyyy */
export function currentYear(): string {
  return todayISO().slice(0, 4);
}

/** yyyy-mm 에서 n개월 이동 */
export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

/** yyyy 에서 n년 이동 */
export function shiftYear(y: string, delta: number): string {
  return String(Number(y) + delta);
}

/** 표시용: "2026년 9월" */
export function labelYearMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}년 ${Number(m)}월`;
}

/** 표시용: "2026년" */
export function labelYear(y: string): string {
  return `${y}년`;
}
