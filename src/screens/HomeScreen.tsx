import { useMemo, useState } from "react";
import { navigate } from "../router";
import { loadRecords } from "../storage";
import type { Record } from "../types";
import { formatMoney, todayISO } from "../utils";
import { RecordItem } from "../components/RecordItem";
import { AdBanner } from "../components/AdBanner";

type Mode = "month" | "year";

export function HomeScreen() {
  const records = useMemo(() => loadRecords(), []);
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

  const { received, given } = useMemo(() => {
    let received = 0;
    let given = 0;
    for (const r of filtered) {
      if (r.direction === "received") received += r.amount;
      else given += r.amount;
    }
    return { received, given };
  }, [filtered]);

  const net = received - given;

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

  return (
    <div className="page home-page">
      {/* 헤더 */}
      <div className="page-header home-header">
        <h1>경조사비 메모장</h1>
        <button
          className="settings-btn"
          onClick={() => navigate({ name: "settings" })}
          aria-label="설정"
        >
          ⚙️
        </button>
      </div>

      <div className="page-body home-body">
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
            <div className="net-label">순액</div>
            <div className="net-value">
              {net >= 0 ? "+" : ""}
              {formatMoney(net)}원
            </div>
          </div>
          <div className="summary-row">
            <div className="summary-item">
              <div className="label">받았어요</div>
              <div className="value received">{formatMoney(received)}원</div>
            </div>
            <div className="summary-item">
              <div className="label">냈어요</div>
              <div className="value given">{formatMoney(given)}원</div>
            </div>
          </div>
        </div>

        {/* 해당 기간 기록 목록 */}
        <div className="section-title">
          <h2>{mode === "year" ? "올해 기록" : "이번 기록"}</h2>
          <span className="count-badge">{filtered.length}건</span>
        </div>

        <div className="home-list">
          {filtered.length === 0 ? (
            <div className="empty">
              <div className="emoji">📝</div>
              <div className="msg">이 기간엔 기록이 없어요</div>
            </div>
          ) : (
            <RecordList records={filtered} />
          )}
        </div>
      </div>

      {/* 하단 배너 + 새 기록 버튼 */}
      <AdBanner />
      <div className="fixed-bottom">
        <button
          className="btn btn-primary btn-block btn-lg"
          onClick={() => navigate({ name: "add" })}
        >
          기록 추가하기
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
