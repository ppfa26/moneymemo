import { useMemo, useState } from "react";
import { loadRecords } from "../storage";
import type { Category, Record } from "../types";
import { CATEGORY_LABEL } from "../types";
import { currentYear, currentYearMonth, formatMoney, todayISO } from "../utils";
import { exportExcel, exportPDF } from "../export/exportUtils";
import { AD_GROUP_IDS } from "../ads/adConfig";
import { showRewarded } from "../ads/fullScreenAd";

type Format = "excel" | "pdf";
type Preset = "thisMonth" | "thisYear" | "all" | "custom";
type CatFilter = "all" | Category;

interface Props {
  onToast: (msg: string) => void;
}

const CAT_FILTERS: [CatFilter, string][] = [
  ["all", "전체"],
  ["salary", CATEGORY_LABEL.salary],
  ["expense", CATEGORY_LABEL.expense],
  ["gift", CATEGORY_LABEL.gift],
  ["saving", CATEGORY_LABEL.saving],
];

export function ExportScreen({ onToast }: Props) {
  const all = useMemo(() => loadRecords(), []);
  const [cat, setCat] = useState<CatFilter>("all");
  const [preset, setPreset] = useState<Preset>("thisYear");
  const [from, setFrom] = useState(currentYear() + "-01-01");
  const [to, setTo] = useState(todayISO());
  const [busyFormat, setBusyFormat] = useState<Format | null>(null);

  const { fromISO, toISO } = useMemo(() => {
    const today = todayISO();
    if (preset === "thisMonth") return { fromISO: currentYearMonth() + "-01", toISO: today };
    if (preset === "thisYear") return { fromISO: currentYear() + "-01-01", toISO: today };
    if (preset === "all") return { fromISO: "1900-01-01", toISO: "2999-12-31" };
    return { fromISO: from, toISO: to };
  }, [preset, from, to]);

  const records: Record[] = useMemo(() => {
    return all
      .filter((r) => (cat === "all" ? true : r.category === cat))
      .filter((r) => r.date >= fromISO && r.date <= toISO)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [all, cat, fromISO, toISO]);

  const totals = useMemo(() => {
    let inn = 0; // 들어온 돈(급여·경조사 받음)
    let out = 0; // 나간 돈(고정지출·경조사 냄)
    let save = 0; // 모은 돈(저축·투자)
    for (const r of records) {
      if (r.flow === "in") inn += r.amount;
      else if (r.flow === "save") save += r.amount;
      else out += r.amount;
    }
    return { inn, out, save, count: records.length };
  }, [records]);

  async function handleDownload(format: Format) {
    if (busyFormat) return;
    if (records.length === 0) {
      onToast("이 기간엔 기록이 없어요");
      return;
    }
    setBusyFormat(format);
    await showRewarded(AD_GROUP_IDS.rewarded);
    try {
      if (format === "excel") {
        exportExcel(records, fromISO, toISO);
        onToast("엑셀 파일을 저장했어요 📊");
      } else {
        exportPDF(records, fromISO, toISO);
        onToast("PDF를 만들었어요 📄 (인쇄 → PDF로 저장)");
      }
    } catch {
      onToast("잠시 후 다시 시도해 주세요");
    } finally {
      setBusyFormat(null);
    }
  }

  const periodLabel =
    preset === "thisMonth"
      ? "이번 달"
      : preset === "thisYear"
        ? "올해"
        : preset === "all"
          ? "전체 기간"
          : "선택한 기간";

  return (
    <div className="page">
      <div className="page-header">
        <h1>내보내기</h1>
        <div className="sub">기록을 엑셀·PDF로 저장해요</div>
      </div>

      <div className="page-body">
        {/* 카테고리 필터 */}
        <div className="field">
          <label>어떤 종류를 저장할까요?</label>
          <div className="segment scroll-x">
            {CAT_FILTERS.map(([v, label]) => (
              <button
                key={v}
                className={`seg ${cat === v ? "active" : ""}`}
                onClick={() => setCat(v)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 기간 선택 */}
        <div className="field">
          <label>어떤 기간을 저장할까요?</label>
          <div className="segment">
            {(
              [
                ["thisMonth", "이번 달"],
                ["thisYear", "올해"],
                ["all", "전체"],
                ["custom", "직접 고르기"],
              ] as [Preset, string][]
            ).map(([v, label]) => (
              <button
                key={v}
                className={`seg ${preset === v ? "active" : ""}`}
                onClick={() => setPreset(v)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {preset === "custom" && (
          <div className="field">
            <label>시작일 ~ 종료일</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="date"
                className="text-input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <span style={{ color: "var(--text-sub)" }}>~</span>
              <input
                type="date"
                className="text-input"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* 미리보기 요약 */}
        <div className="export-preview">
          <div className="export-preview-top">
            <span className="badge">
              {cat === "all" ? "전체" : CATEGORY_LABEL[cat]} · {periodLabel}
            </span>
            <span className="count">{totals.count}건</span>
          </div>
          <div className="export-preview-nums grid4">
            <div>
              <div className="k">들어온 돈</div>
              <div className="v received">+{formatMoney(totals.inn)}원</div>
            </div>
            <div>
              <div className="k">나간 돈</div>
              <div className="v given">-{formatMoney(totals.out)}원</div>
            </div>
            <div>
              <div className="k">모은 돈</div>
              <div className="v saved">+{formatMoney(totals.save)}원</div>
            </div>
            <div>
              <div className="k">쓰고 남은 돈</div>
              <div className="v">
                {totals.inn - totals.out - totals.save >= 0 ? "+" : "-"}
                {formatMoney(Math.abs(totals.inn - totals.out - totals.save))}원
              </div>
            </div>
          </div>
        </div>

        {/* 광고 안내 (리워드) */}
        <div className="ad-hint-row">
          <span className="ad-hint-badge">AD</span>
          <span className="ad-hint-text">광고를 보면 무료로 저장할 수 있어요</span>
        </div>

        {/* 다운로드 버튼 */}
        <div className="download-cards">
          <button
            className="download-card"
            onClick={() => handleDownload("excel")}
            disabled={busyFormat !== null}
          >
            <span className="dc-emoji">📊</span>
            <span className="dc-title">
              {busyFormat === "excel" ? "준비 중…" : "엑셀로 받기"}
            </span>
            <span className="dc-sub">숫자 정리 · 경비처리용</span>
          </button>
          <button
            className="download-card"
            onClick={() => handleDownload("pdf")}
            disabled={busyFormat !== null}
          >
            <span className="dc-emoji">📄</span>
            <span className="dc-title">
              {busyFormat === "pdf" ? "준비 중…" : "PDF로 받기"}
            </span>
            <span className="dc-sub">한눈에 보기 · 인쇄용</span>
          </button>
        </div>
      </div>
    </div>
  );
}
