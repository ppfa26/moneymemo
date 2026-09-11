// 엑셀(.xlsx) / PDF 내보내기 유틸.
// 컬럼: 날짜 / 이름 / 관계 / 종류 / 방향 / 금액  (사업자 경비처리용 양식 고려)

import * as XLSX from "xlsx";
import type { Record } from "../types";
import {
  DIRECTION_LABEL,
  EVENT_LABEL,
  RELATION_LABEL,
} from "../types";
import { formatDate, formatMoney } from "../utils";

/** 기간(inclusive)으로 기록 필터 + 날짜 오름차순 정렬 */
export function filterByPeriod(
  records: Record[],
  fromISO: string,
  toISO: string,
): Record[] {
  return records
    .filter((r) => r.date >= fromISO && r.date <= toISO)
    .sort((a, b) => a.date.localeCompare(b.date));
}

interface Summary {
  received: number;
  given: number;
  net: number;
  count: number;
}

export function summarize(records: Record[]): Summary {
  let received = 0;
  let given = 0;
  for (const r of records) {
    if (r.direction === "received") received += r.amount;
    else given += r.amount;
  }
  return { received, given, net: received - given, count: records.length };
}

function rowsFor(records: Record[]): (string | number)[][] {
  return records.map((r) => [
    r.date,
    r.name,
    RELATION_LABEL[r.relation],
    EVENT_LABEL[r.eventType],
    DIRECTION_LABEL[r.direction],
    r.amount,
  ]);
}

/** 엑셀 파일 다운로드 */
export function exportExcel(
  records: Record[],
  fromISO: string,
  toISO: string,
): void {
  const header = ["날짜", "이름", "관계", "종류", "방향", "금액(원)"];
  const s = summarize(records);

  const aoa: (string | number)[][] = [
    ["경조사비 메모장 - 내역"],
    [`기간: ${fromISO} ~ ${toISO}`],
    [
      `받은 돈 합계: ${s.received}원  /  낸 돈 합계: ${s.given}원  /  순액: ${s.net}원`,
    ],
    [],
    header,
    ...rowsFor(records),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 8 },
    { wch: 8 },
    { wch: 7 },
    { wch: 12 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "경조사비");
  XLSX.writeFile(wb, `경조사비_${fromISO}_${toISO}.xlsx`);
}

/**
 * PDF 내보내기 - 인쇄용 HTML을 새 창에 열어 브라우저 인쇄(→ PDF 저장)로 처리.
 * (외부 PDF 라이브러리 없이 가볍게 처리)
 */
export function exportPDF(
  records: Record[],
  fromISO: string,
  toISO: string,
): boolean {
  const s = summarize(records);
  const rows = records
    .map(
      (r) => `
      <tr>
        <td>${formatDate(r.date)}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>${RELATION_LABEL[r.relation]}</td>
        <td>${EVENT_LABEL[r.eventType]}</td>
        <td>${DIRECTION_LABEL[r.direction]}</td>
        <td class="num">${r.direction === "given" ? "-" : "+"}${formatMoney(r.amount)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8" />
<title>경조사비 내역 ${fromISO}~${toISO}</title>
<style>
  * { font-family: -apple-system, "Malgun Gothic", sans-serif; }
  body { padding: 28px; color: #191f28; }
  h1 { font-size: 20px; color: #ff6f0f; margin-bottom: 4px; }
  .period { color: #6b7684; font-size: 13px; margin-bottom: 16px; }
  .summary { display: flex; gap: 20px; margin-bottom: 18px; font-size: 13px; }
  .summary b { color: #191f28; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border-bottom: 1px solid #e8ebee; padding: 9px 6px; text-align: left; }
  th { background: #f2f4f6; color: #6b7684; font-weight: 700; }
  td.num, th.num { text-align: right; }
  @media print { body { padding: 0; } }
</style></head>
<body>
  <h1>경조사비 메모장 · 내역</h1>
  <div class="period">기간: ${fromISO} ~ ${toISO} · 총 ${s.count}건</div>
  <div class="summary">
    <div>받은 돈 <b>${formatMoney(s.received)}원</b></div>
    <div>낸 돈 <b>${formatMoney(s.given)}원</b></div>
    <div>순액 <b>${s.net >= 0 ? "+" : ""}${formatMoney(s.net)}원</b></div>
  </div>
  <table>
    <thead><tr>
      <th>날짜</th><th>이름</th><th>관계</th><th>종류</th><th>방향</th><th class="num">금액</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
