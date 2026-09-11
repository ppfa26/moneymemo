// 엑셀(.xlsx) / PDF 내보내기 유틸.
// 탭(kind)에 따라 컬럼이 달라져요.
//  - 고정지출: 시작일 / 항목 / 결제방법 / 결제일 / 구분(지출·저축투자) / 금액
//  - 경조사비: 날짜 / 이름 / 사유 / 구분(받음·냄) / 금액

import * as XLSX from "xlsx";
import type { Kind, Record } from "../types";
import { KIND_LABEL, PAY_METHOD_LABEL } from "../types";
import { formatDate, formatMoney } from "../utils";

/** 기간(inclusive) + 종류(kind)로 기록 필터 + 날짜 오름차순 정렬 */
export function filterByPeriod(
  records: Record[],
  kind: Kind,
  fromISO: string,
  toISO: string,
): Record[] {
  return records
    .filter((r) => r.kind === kind && r.date >= fromISO && r.date <= toISO)
    .sort((a, b) => a.date.localeCompare(b.date));
}

interface Summary {
  inn: number; // 들어오는 돈(저축·투자 / 받음)
  out: number; // 나가는 돈(지출 / 냄)
  net: number; // inn - out
  count: number;
}

export function summarize(records: Record[]): Summary {
  let inn = 0;
  let out = 0;
  for (const r of records) {
    if (r.flow === "in") inn += r.amount;
    else out += r.amount;
  }
  return { inn, out, net: inn - out, count: records.length };
}

function flowText(kind: Kind, r: Record): string {
  if (kind === "expense") return r.flow === "in" ? "저축·투자" : "지출";
  return r.flow === "in" ? "받음" : "냄";
}

/** 엑셀 헤더 (탭별) */
function headerFor(kind: Kind): string[] {
  return kind === "expense"
    ? ["시작일", "항목", "결제방법", "결제일", "구분", "금액(원)"]
    : ["날짜", "이름", "사유", "구분", "금액(원)"];
}

/** 엑셀 데이터 행 (탭별) */
function rowsFor(kind: Kind, records: Record[]): (string | number)[][] {
  return records.map((r) => {
    if (r.kind === "expense") {
      return [
        r.date,
        r.name,
        PAY_METHOD_LABEL[r.payMethod],
        `매달 ${r.payDay}일`,
        flowText(kind, r),
        r.amount,
      ];
    }
    return [r.date, r.name, r.reason, flowText(kind, r), r.amount];
  });
}

/**
 * Blob을 파일로 다운로드해요. (토스 웹뷰/모바일 브라우저 호환)
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
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);
}

/** 엑셀 파일 다운로드 */
export function exportExcel(
  kind: Kind,
  records: Record[],
  fromISO: string,
  toISO: string,
): void {
  const header = headerFor(kind);
  const s = summarize(records);
  const label = KIND_LABEL[kind];

  const inLabel = kind === "expense" ? "저축·투자 합계" : "받은 돈 합계";
  const outLabel = kind === "expense" ? "지출 합계" : "낸 돈 합계";

  const aoa: (string | number)[][] = [
    [`머니메모 - ${label} 내역`],
    [`기간: ${fromISO} ~ ${toISO}`],
    [`${outLabel}: ${s.out}원  /  ${inLabel}: ${s.inn}원  /  순액: ${s.net}원`],
    [],
    header,
    ...rowsFor(kind, records),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] =
    kind === "expense"
      ? [{ wch: 12 }, { wch: 14 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 12 }]
      : [{ wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 7 }, { wch: 12 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, label);

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, `머니메모_${label}_${fromISO}_${toISO}.xlsx`);
}

/**
 * PDF 내보내기 - 인쇄용 HTML을 숨김 iframe에 실어 인쇄(→ PDF 저장)로 처리.
 * 토스 웹뷰는 window.open(팝업)을 막기 때문에 iframe 방식을 사용하고,
 * iframe 인쇄가 불가능한 환경에서는 HTML 파일 다운로드로 폴백해요.
 */
export function exportPDF(
  kind: Kind,
  records: Record[],
  fromISO: string,
  toISO: string,
): boolean {
  const s = summarize(records);
  const label = KIND_LABEL[kind];
  const isExpense = kind === "expense";

  const headCells = isExpense
    ? `<th>시작일</th><th>항목</th><th>결제방법</th><th>결제일</th><th>구분</th><th class="num">금액</th>`
    : `<th>날짜</th><th>이름</th><th>사유</th><th>구분</th><th class="num">금액</th>`;

  const rows = records
    .map((r) => {
      const sign = r.flow === "in" ? "+" : "-";
      const amtCell = `<td class="num">${sign}${formatMoney(r.amount)}</td>`;
      if (r.kind === "expense") {
        return `<tr>
          <td>${formatDate(r.date)}</td>
          <td>${escapeHtml(r.name)}</td>
          <td>${PAY_METHOD_LABEL[r.payMethod]}</td>
          <td>매달 ${r.payDay}일</td>
          <td>${flowText(kind, r)}</td>
          ${amtCell}
        </tr>`;
      }
      return `<tr>
        <td>${formatDate(r.date)}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>${escapeHtml(r.reason)}</td>
        <td>${flowText(kind, r)}</td>
        ${amtCell}
      </tr>`;
    })
    .join("");

  const inLabel = isExpense ? "저축·투자" : "받은 돈";
  const outLabel = isExpense ? "지출" : "낸 돈";

  const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8" />
<title>머니메모 ${label} ${fromISO}~${toISO}</title>
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
  <h1>머니메모 · ${label} 내역</h1>
  <div class="period">기간: ${fromISO} ~ ${toISO} · 총 ${s.count}건</div>
  <div class="summary">
    <div>${outLabel} <b>${formatMoney(s.out)}원</b></div>
    <div>${inLabel} <b>${formatMoney(s.inn)}원</b></div>
    <div>순액 <b>${s.net >= 0 ? "+" : ""}${formatMoney(s.net)}원</b></div>
  </div>
  <table>
    <thead><tr>${headCells}</tr></thead>
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
        /* noop */
      }
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 2000);
    };

    iframe.onload = () => setTimeout(doPrint, 300);
    setTimeout(doPrint, 800);
    return true;
  } catch {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    downloadBlob(blob, `머니메모_${label}_${fromISO}_${toISO}.html`);
    return true;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
