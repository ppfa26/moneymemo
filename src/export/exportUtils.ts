// 엑셀(.xlsx) / PDF 내보내기 유틸 (통합 카테고리 버전).
// 컬럼: 날짜 / 종류 / 이름 / 상세 / 구분 / 금액

import * as XLSX from "xlsx";
import type { Record } from "../types";
import { CATEGORY_LABEL, PAY_METHOD_LABEL } from "../types";
import { formatDate, formatMoney } from "../utils";

interface Summary {
  inn: number;
  out: number;
  net: number;
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

/** 각 기록의 '상세' 텍스트 (카테고리별) */
function detailText(r: Record): string {
  if (r.category === "gift") return r.reason ?? "";
  if (r.payDay) {
    const pm = r.payMethod ? PAY_METHOD_LABEL[r.payMethod] : "";
    return `${pm} 매달 ${r.payDay}일`.trim();
  }
  return r.payMethod ? PAY_METHOD_LABEL[r.payMethod] : "";
}

/** 구분(방향) 텍스트 */
function flowText(r: Record): string {
  if (r.flow === "in") return "수입";
  if (r.flow === "save") return "저축·투자";
  return "지출";
}

function rowsFor(records: Record[]): (string | number)[][] {
  return records.map((r) => [
    r.date,
    CATEGORY_LABEL[r.category],
    r.name,
    detailText(r),
    flowText(r),
    r.amount,
  ]);
}

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
  records: Record[],
  fromISO: string,
  toISO: string,
): void {
  const header = ["날짜", "종류", "이름", "상세", "구분", "금액(원)"];
  const s = summarize(records);

  const aoa: (string | number)[][] = [
    ["머니메모 - 내역"],
    [`기간: ${fromISO} ~ ${toISO}`],
    [`나간 돈: ${s.out}원  /  들어온 돈: ${s.inn}원  /  합계: ${s.net}원`],
    [],
    header,
    ...rowsFor(records),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [
    { wch: 12 },
    { wch: 9 },
    { wch: 14 },
    { wch: 14 },
    { wch: 9 },
    { wch: 12 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "머니메모");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, `머니메모_${fromISO}_${toISO}.xlsx`);
}

/**
 * PDF 내보내기 - 인쇄용 HTML을 숨김 iframe에 실어 인쇄(→ PDF 저장)로 처리.
 * 토스 웹뷰는 window.open(팝업)을 막기 때문에 iframe 방식 + HTML 다운로드 폴백.
 */
export function exportPDF(
  records: Record[],
  fromISO: string,
  toISO: string,
): boolean {
  const s = summarize(records);

  const rows = records
    .map((r) => {
      const sign = r.flow === "out" ? "-" : "+";
      return `<tr>
        <td>${formatDate(r.date)}</td>
        <td>${CATEGORY_LABEL[r.category]}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>${escapeHtml(detailText(r))}</td>
        <td>${flowText(r)}</td>
        <td class="num">${sign}${formatMoney(r.amount)}</td>
      </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8" />
<title>머니메모 내역 ${fromISO}~${toISO}</title>
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
  <h1>머니메모 · 내역</h1>
  <div class="period">기간: ${fromISO} ~ ${toISO} · 총 ${s.count}건</div>
  <div class="summary">
    <div>나간 돈 <b>${formatMoney(s.out)}원</b></div>
    <div>들어온 돈 <b>${formatMoney(s.inn)}원</b></div>
    <div>합계 <b>${s.net >= 0 ? "+" : ""}${formatMoney(s.net)}원</b></div>
  </div>
  <table>
    <thead><tr>
      <th>날짜</th><th>종류</th><th>이름</th><th>상세</th><th>구분</th><th class="num">금액</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body></html>`;

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
    downloadBlob(blob, `머니메모_${fromISO}_${toISO}.html`);
    return true;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
