import { useMemo, useState } from "react";
import { loadRecords } from "../storage";
import { currentYear, currentYearMonth, formatMoney, todayISO } from "../utils";
import {
  exportExcel,
  exportPDF,
  filterByPeriod,
  summarize,
} from "../export/exportUtils";
import { AD_GROUP_IDS } from "../ads/adConfig";
import { showRewarded } from "../ads/fullScreenAd";

type Format = "excel" | "pdf";
type Preset = "thisMonth" | "thisYear" | "all" | "custom";

interface Props {
  onToast: (msg: string) => void;
}

export function ExportScreen({ onToast }: Props) {
  const all = useMemo(() => loadRecords(), []);
  const [preset, setPreset] = useState<Preset>("thisYear");
  const [from, setFrom] = useState(currentYear() + "-01-01");
  const [to, setTo] = useState(todayISO());
  const [busyFormat, setBusyFormat] = useState<Format | null>(null);

  const { fromISO, toISO } = useMemo(() => {
    const today = todayISO();
    if (preset === "thisMonth") {
      return { fromISO: currentYearMonth() + "-01", toISO: today };
    }
    if (preset === "thisYear") {
      return { fromISO: currentYear() + "-01-01", toISO: today };
    }
    if (preset === "all") {
      return { fromISO: "1900-01-01", toISO: "2999-12-31" };
    }
    return { fromISO: from, toISO: to };
  }, [preset, from, to]);

  const records = useMemo(
    () => filterByPeriod(all, fromISO, toISO),
    [all, fromISO, toISO],
  );
  const s = summarize(records);

  async function handleDownload(format: Format) {
    if (busyFormat) return;
    if (records.length === 0) {
      onToast("이 기간엔 기록이 없어요");
      return;
    }
    setBusyFormat(format);

    // ★ 다운로드할 때마다 짧은 광고를 보여줘요.
    //   단, 광고가 안 뜨거나 도중에 닫혀도 다운로드는 그대로 진행해요(기능 안 가둠).
    await showRewarded(AD_GROUP_IDS.rewarded);

    try {
      if (format === "excel") {
        exportExcel(records, fromISO, toISO);
        onToast("엑셀 파일을 저장했어요 📊");
      } else {
        const ok = exportPDF(records, fromISO, toISO);
        onToast(ok ? "PDF를 만들었어요 📄" : "팝업을 허용해 주세요");
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
            <span className="badge">{periodLabel}</span>
            <span className="count">{s.count}건</span>
          </div>
          <div className="export-preview-nums">
            <div>
              <div className="k">받은 돈</div>
              <div className="v received">{formatMoney(s.received)}원</div>
            </div>
            <div>
              <div className="k">낸 돈</div>
              <div className="v given">{formatMoney(s.given)}원</div>
            </div>
            <div>
              <div className="k">순액</div>
              <div className="v">
                {s.net >= 0 ? "+" : ""}
                {formatMoney(s.net)}원
              </div>
            </div>
          </div>
        </div>

        {/* 원탭 다운로드 버튼 2개 */}
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

        <p className="download-note">
          다운로드 전에 짧은 광고가 나와요. 광고 덕분에 계속 무료로 쓸 수
          있어요 🙂
        </p>
      </div>
    </div>
  );
}
