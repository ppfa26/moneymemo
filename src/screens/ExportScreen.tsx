import { useMemo, useState } from "react";
import { loadRecords } from "../storage";
import {
  getFreeExportUsage,
  incrementFreeExportUsage,
} from "../storage";
import {
  currentYear,
  currentYearMonth,
  formatMoney,
  todayISO,
} from "../utils";
import {
  exportExcel,
  exportPDF,
  filterByPeriod,
  summarize,
} from "../export/exportUtils";
import { AD_GROUP_IDS, AD_POLICY } from "../ads/adConfig";
import { showRewarded } from "../ads/fullScreenAd";

type Format = "excel" | "pdf";
type Preset = "thisMonth" | "thisYear" | "all" | "custom";

interface Props {
  onToast: (msg: string) => void;
}

export function ExportScreen({ onToast }: Props) {
  const all = useMemo(() => loadRecords(), []);
  const [preset, setPreset] = useState<Preset>("thisMonth");
  const [from, setFrom] = useState(currentYearMonth() + "-01");
  const [to, setTo] = useState(todayISO());
  const [format, setFormat] = useState<Format>("excel");
  const [busy, setBusy] = useState(false);

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

  const ym = currentYearMonth();
  const used = getFreeExportUsage(ym);
  const freeLeft = Math.max(0, AD_POLICY.FREE_EXPORT_PER_MONTH - used);
  const needReward = freeLeft <= 0;

  async function handleExport() {
    if (records.length === 0) {
      onToast("내보낼 기록이 없어요");
      return;
    }
    setBusy(true);

    // 월 무료 횟수 초과 시에만 리워드 광고. 실패해도 기능은 열어줌.
    if (needReward) {
      const result = await showRewarded(AD_GROUP_IDS.rewarded);
      if (result === "rewarded") {
        onToast("광고 시청 완료! 내보내기를 시작해요");
      }
      // dismissed/unsupported/failed 여도 계속 진행 (기능 안 가둠)
    } else {
      incrementFreeExportUsage(ym);
    }

    try {
      if (format === "excel") {
        exportExcel(records, fromISO, toISO);
        onToast("엑셀 파일을 저장했어요");
      } else {
        const ok = exportPDF(records, fromISO, toISO);
        onToast(ok ? "PDF 인쇄 창을 열었어요" : "팝업이 차단되었어요");
      }
    } catch {
      onToast("내보내기에 실패했어요");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>내보내기</h1>
        <div className="sub">엑셀 · PDF로 정리해요</div>
      </div>

      <div className="page-body">
        {/* 기간 선택 */}
        <div className="field">
          <label>기간</label>
          <div className="segment">
            {(
              [
                ["thisMonth", "이번 달"],
                ["thisYear", "올해"],
                ["all", "전체"],
                ["custom", "직접 선택"],
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
            <label>시작 ~ 종료</label>
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
        <div className="card">
          <div className="info-row">
            <span className="k">포함 건수</span>
            <span className="v">{s.count}건</span>
          </div>
          <div className="info-row">
            <span className="k">받은 돈</span>
            <span className="v" style={{ color: "var(--received)" }}>
              {formatMoney(s.received)}원
            </span>
          </div>
          <div className="info-row">
            <span className="k">낸 돈</span>
            <span className="v" style={{ color: "var(--given)" }}>
              {formatMoney(s.given)}원
            </span>
          </div>
          <div className="info-row">
            <span className="k">순액</span>
            <span className="v">
              {s.net >= 0 ? "+" : ""}
              {formatMoney(s.net)}원
            </span>
          </div>
        </div>

        {/* 형식 선택 */}
        <div className="field" style={{ marginTop: 18 }}>
          <label>형식</label>
          <div className="segment two">
            <button
              className={`seg ${format === "excel" ? "active" : ""}`}
              onClick={() => setFormat("excel")}
            >
              📊 엑셀 (.xlsx)
            </button>
            <button
              className={`seg ${format === "pdf" ? "active" : ""}`}
              onClick={() => setFormat("pdf")}
            >
              📄 PDF
            </button>
          </div>
        </div>

        <div className="notice">
          {needReward
            ? "이번 달 무료 내보내기를 모두 사용했어요. 짧은 광고를 보면 계속 내보낼 수 있어요."
            : `이번 달 무료 내보내기 ${freeLeft}회 남았어요. (매월 ${AD_POLICY.FREE_EXPORT_PER_MONTH}회 무료)`}
        </div>
      </div>

      <div className="fixed-bottom">
        <button
          className="btn btn-primary btn-block btn-lg"
          disabled={busy}
          onClick={handleExport}
        >
          {busy
            ? "준비 중…"
            : needReward
              ? "광고 보고 내보내기"
              : "내보내기"}
        </button>
      </div>
    </div>
  );
}
