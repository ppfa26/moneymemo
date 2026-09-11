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

/**
 * Blob을 파일로 다운로드해요. (토스 웹뷰/모바일 브라우저 호환)
 * <a download> 앵커를 만들어 클릭 → 즉시 정리.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // 약간의 지연 후 정리 (일부 웹뷰에서 즉시 revoke 시 실패)
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);
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

  // writeFile 대신 바이너리 → Blob → 앵커 다운로드 (웹뷰 호환)
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, `경조사비_${fromISO}_${toISO}.xlsx`);
}

/**
 * PDF 내보내기 - 인쇄용 HTML을 숨김 iframe에 실어 인쇄(→ PDF 저장)로 처리.
 * 토스 웹뷰는 window.open(팝업)을 막기 때문에 iframe 방식을 사용하고,
 * iframe 인쇄가 불가능한 환경에서는 HTML 파일 다운로드로 폴백해요.
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
</body></html>`;

  // 1순위: 숨김 iframe에 인쇄용 HTML을 실어 인쇄 다이얼로그 호출 (웹뷰 호환)
  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      throw new Error("iframe document unavailable");
    }
    doc.open();
    doc.write(html);
    doc.close();

    const doPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        /* 인쇄 실패는 아래 setTimeout 정리에서 폴백 없이 무시 */
      }
      // 인쇄 다이얼로그가 뜬 뒤 iframe 정리
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 2000);
    };

    // 로드 완료 후 인쇄 (약간의 지연으로 폰트/렌더 안정화)
    iframe.onload = () => setTimeout(doPrint, 300);
    // 일부 웹뷰는 onload가 늦게/안 올 수 있어 안전망 타이머도 둠
    setTimeout(doPrint, 800);
    return true;
  } catch {
    // 2순위 폴백: HTML 파일로 다운로드 (사용자가 브라우저에서 열어 인쇄/PDF 저장)
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    downloadBlob(blob, `경조사비_${fromISO}_${toISO}.html`);
    return true;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
