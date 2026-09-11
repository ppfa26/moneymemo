import { useMemo, useState } from "react";
import { navigate } from "../router";
import { loadRecordsByKind } from "../storage";
import type { Kind, Record } from "../types";
import { KIND_LABEL } from "../types";
import { formatMoney, todayISO } from "../utils";
import { RecordItem } from "../components/RecordItem";
import { AdBanner } from "../components/AdBanner";

type Mode = "month" | "year";

interface Props {
  kind: Kind;
  onKindChange: (k: Kind) => void;
}

export function HomeScreen({ kind, onKindChange }: Props) {
  const records = useMemo(() => loadRecordsByKind(kind), [kind]);
  const today = todayISO();
  const curYear = Number(today.slice(0, 4));
  const curMonth = Number(today.slice(5, 7));

  const [mode, setMode] = useState<Mode>("month");
  const [year, setYear] = useState(curYear);
  const [month, setMonth] = useState(curMonth);

  // 선택 기간에 해당하는 기록
  const filtered = useMemo(() => {
    const yStr = String(year);
    const mStr = String(month).padStart(2, "0");
    return records.filter((r) => {
      if (mode === "year") return r.date.slice(0, 4) === yStr;
      return r.date.slice(0, 7) === `${yStr}-${mStr}`;
    });
  }, [records, mode, year, month]);

  // flow: out(나가는 돈) / in(들어오는·모이는 돈)
  const { out, inn } = useMemo(() => {
    let out = 0;
    let inn = 0;
    for (const r of filtered) {
      if (r.flow === "in") inn += r.amount;
      else out += r.amount;
    }
    return { out, inn };
  }, [filtered]);

  function shift(dir: -1 | 1) {
    if (mode === "year") {
      setYear((y) => y + dir);
      return;
    }
    let m = month + dir;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  const periodLabel = mode === "year" ? `${year}년` : `${year}년 ${month}월`;
  const isExpense = kind === "expense";

  // 탭별 문구
  const outLabel = isExpense ? "지출" : "냈어요";
  const inLabel = isExpense ? "저축·투자" : "받았어요";
  const heroLabel = "합계";
  const heroValue = isExpense ? out : inn - out;
  const heroPrefix = isExpense ? "" : heroValue >= 0 ? "+" : "";

  return (
    <div className="page home-page">
      {/* 헤더 */}
      <div className="page-header home-header">
        <h1>머니메모</h1>
        <button
          className="settings-btn"
          onClick={() => navigate({ name: "settings" })}
          aria-label="설정"
        >
          ⚙️
        </button>
      </div>

      <div className="page-body home-body">
        {/* 고정지출 / 경조사비 탭 전환 */}
        <div className="kind-tabs">
          {(["expense", "gift"] as Kind[]).map((k) => (
            <button
              key={k}
              className={`kind-tab ${kind === k ? "active" : ""}`}
              onClick={() => onKindChange(k)}
            >
              {k === "expense" ? "💳 " : "🎁 "}
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>

        {/* 월/연도 전환 토글 */}
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === "month" ? "active" : ""}`}
            onClick={() => setMode("month")}
          >
            월별
          </button>
          <button
            className={`mode-btn ${mode === "year" ? "active" : ""}`}
            onClick={() => setMode("year")}
          >
            연도별
          </button>
        </div>

        {/* 요약 히어로 카드 (기간 이동 화살표 포함) */}
        <div className="summary">
          <div className="summary-period">
            <button className="period-arrow" onClick={() => shift(-1)} aria-label="이전">
              ‹
            </button>
            <span className="period-label">{periodLabel}</span>
            <button className="period-arrow" onClick={() => shift(1)} aria-label="다음">
              ›
            </button>
          </div>
          <div className="summary-net">
            <div className="net-label">{heroLabel}</div>
            <div className="net-value">
              {heroPrefix}
              {formatMoney(heroValue)}원
            </div>
          </div>
          <div className="summary-row">
            <div className="summary-item">
              <div className="label">{outLabel}</div>
              <div className="value given">{formatMoney(out)}원</div>
            </div>
            <div className="summary-item">
              <div className="label">{inLabel}</div>
              <div className="value received">{formatMoney(inn)}원</div>
            </div>
          </div>
        </div>

        {/* 섹션 타이틀 자리에 배너 광고 (요약 카드와 목록 사이) */}
        <AdBanner />

        <div className="home-list">
          {filtered.length === 0 ? (
            <div className="empty">
              <div className="emoji">{isExpense ? "💳" : "📝"}</div>
              <div className="msg">이 기간엔 기록이 없어요</div>
            </div>
          ) : (
            <RecordList records={filtered} />
          )}
        </div>
      </div>

      {/* 새 기록 버튼 */}
      <div className="fixed-bottom">
        <button
          className="btn btn-primary btn-block btn-lg"
          onClick={() => navigate({ name: "add", kind })}
        >
          {isExpense ? "고정지출 추가하기" : "경조사비 추가하기"}
        </button>
      </div>
    </div>
  );
}

// 목록(스크롤 영역) - 많으면 스크롤, 적으면 그대로
function RecordList({ records }: { records: Record[] }) {
  return (
    <div className="card list-card">
      {records.map((r) => (
        <RecordItem
          key={r.id}
          record={r}
          onClick={(id) => navigate({ name: "detail", id })}
        />
      ))}
    </div>
  );
}
