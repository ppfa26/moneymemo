import { useMemo, useState } from "react";
import { navigate } from "../router";
import { clearAllData, loadRecords } from "../storage";
import type { InvestType, Record } from "../types";
import { INVEST_TYPE_EMOJI, INVEST_TYPE_LABEL } from "../types";
import { formatMoney, sortForDisplay, todayISO } from "../utils";
import { RecordItem } from "../components/RecordItem";

type Mode = "month" | "year";

export function HomeScreen() {
  const records = useMemo(() => loadRecords(), []);
  const today = todayISO();
  const curYear = Number(today.slice(0, 4));
  const curMonth = Number(today.slice(5, 7));

  const [mode, setMode] = useState<Mode>("month");
  const [year, setYear] = useState(curYear);
  const [month, setMonth] = useState(curMonth);

  // 선택 기간 기록
  const filtered = useMemo(() => {
    const yStr = String(year);
    const mStr = String(month).padStart(2, "0");
    return records.filter((r) => {
      if (mode === "year") return r.date.slice(0, 4) === yStr;
      return r.date.slice(0, 7) === `${yStr}-${mStr}`;
    });
  }, [records, mode, year, month]);

  // 기간 내 카테고리별 합계
  const sums = useMemo(() => {
    let expense = 0;
    let giftOut = 0;
    let giftIn = 0;
    let saving = 0;
    let salaryRecords = 0;
    for (const r of filtered) {
      switch (r.category) {
        case "expense":
          expense += r.amount;
          break;
        case "saving":
          saving += r.amount;
          break;
        case "salary":
          salaryRecords += r.amount;
          break;
        case "gift":
          if (r.flow === "in") giftIn += r.amount;
          else giftOut += r.amount;
          break;
      }
    }
    return { expense, giftOut, giftIn, saving, salaryRecords };
  }, [filtered]);

  // ★ 저축 누적액: 전체 기간 동안 저축·투자에 넣은 총액 (보람!)
  const totalSaved = useMemo(
    () =>
      records
        .filter((r) => r.category === "saving")
        .reduce((sum, r) => sum + r.amount, 0),
    [records],
  );

  // ★ 투자 자산: 저축·투자 기록을 종류별(예금/주식/부동산/코인/기타)로 누적 합산
  const investByType = useMemo(() => {
    const map = new Map<InvestType, number>();
    records
      .filter((r) => r.category === "saving")
      .forEach((r) => {
        const t: InvestType = r.investType ?? "deposit";
        map.set(t, (map.get(t) ?? 0) + r.amount);
      });
    // 금액 큰 순으로 정렬
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [records]);

  // ★ 급여: 고객이 실제 작성한 급여 기록만 합산해요.
  //   (월×12 같은 임의 추정 없음 → 월별이든 연도별이든 '적은 것만' 정확히 보여줘요.
  //    매달 다르게 벌면 매달 급여를 직접 넣고, 9월에 시작했으면 1~8월도 직접 넣어요)
  const earned = sums.salaryRecords + sums.giftIn; // 번 돈(급여 기록+경조사 받음)
  const spent = sums.expense + sums.giftOut; // 쓴 돈(고정지출+경조사 냄)
  const saved = sums.saving; // 이 기간 모은 돈(저축·투자)
  // ★ 쓰고 남은 돈 = 번 돈 − 쓴 돈 − 모은 돈.
  //   이 기간에 실제로 벌어서 쓰고 모으고 '통장에 남은' 여윳돈이에요.
  //   (모은 돈은 이 기간에 실제 넣은 금액만 차감 → 과거 목돈과 무관)
  const leftover = earned - spent - saved; // 쓰고 남은 돈

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
  const hasRecords = filtered.length > 0;

  function handleReset() {
    const ok = window.confirm(
      "모든 기록과 설정을 지우고 처음부터 다시 시작할까요?\n지운 내용은 되돌릴 수 없어요.",
    );
    if (!ok) return;
    clearAllData();
    // 홈부터 새로 시작 (localStorage 비워진 상태 반영)
    window.location.href = window.location.pathname;
  }

  return (
    <div className="page home-page">
      <div className="page-header home-header">
        <h1>머니메모</h1>
        <div className="header-actions">
          <button
            className="settings-btn"
            onClick={handleReset}
            aria-label="초기화"
            title="초기화"
          >
            🗑️
          </button>
          <button
            className="settings-btn"
            onClick={() => navigate({ name: "settings" })}
            aria-label="설정"
          >
            ⚙️
          </button>
        </div>
      </div>

      <div className="page-body home-body">
        {/* 월/연도 전환 */}
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

        {/* 남은 돈 히어로 카드 */}
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
            <div className="net-label">
              {mode === "year" ? `${year}년` : `${month}월`} 이렇게 관리했어요
            </div>
          </div>

          {/* 벌고 · 쓰고 · 모으고 (흐름 요약) */}
          <div className="calc-rows">
            <div className="calc-row">
              <span className="ck">💰 벌었어요</span>
              <span className="cv">+{formatMoney(earned)}원</span>
            </div>
            <div className="calc-row">
              <span className="ck">💳 썼어요</span>
              <span className="cv">-{formatMoney(spent)}원</span>
            </div>
            <div className="calc-row">
              <span className="ck">🏦 모았어요</span>
              <span className="cv">+{formatMoney(saved)}원</span>
            </div>
          </div>

          {/* 쓰고 남은 돈 (강조) — 마이너스면 '모으기에 집중한 달'로 응원 */}
          {leftover >= 0 ? (
            <div className="calc-total">
              <span className="ct-k">👍 쓰고 남은 돈</span>
              <span className="ct-v">+{formatMoney(leftover)}원</span>
            </div>
          ) : (
            <div className="calc-total encourage">
              <span className="ct-k">💪 모으기에 집중했어요</span>
            </div>
          )}
        </div>

        {/* ① 번 돈 (실제 작성한 급여만) - 눌러서 급여 내역/추가 */}
        <button
          className="stat-row tappable"
          onClick={() => navigate({ name: "list", filter: "salary" })}
        >
          <span className="sk">
            💰 {mode === "year" ? "올해" : "이달"} 번 돈
          </span>
          <span className="sv-wrap">
            <span className="sv received">
              {formatMoney(sums.salaryRecords)}원
            </span>
            <span className="stat-arrow">›</span>
          </span>
        </button>

        {/* ② 이 기간 고정지출 - 눌러서 내역 보기 */}
        <button
          className="stat-row tappable"
          onClick={() => navigate({ name: "list", filter: "expense" })}
        >
          <span className="sk">
            💳 {mode === "year" ? "올해" : "이달"} 고정지출
          </span>
          <span className="sv-wrap">
            <span className="sv given">{formatMoney(sums.expense)}원</span>
            <span className="stat-arrow">›</span>
          </span>
        </button>

        {/* ③ 지금까지 모은 돈 (저축 누적) - 눌러서 내역 보기 */}
        <button
          className="stat-row tappable"
          onClick={() => navigate({ name: "list", filter: "saving" })}
        >
          <span className="sk">🏦 지금까지 모은 돈</span>
          <span className="sv-wrap">
            <span className="sv saved-hl">{formatMoney(totalSaved)}원</span>
            <span className="stat-arrow">›</span>
          </span>
        </button>

        {/* ④ 투자 자산 (종류별) */}
        {investByType.length > 0 && (
          <div className="invest-card">
            <div className="invest-head">📊 내 투자 자산</div>
            {investByType.map(([t, amt]) => (
              <div key={t} className="invest-row">
                <span className="ik">
                  {INVEST_TYPE_EMOJI[t as InvestType]}{" "}
                  {INVEST_TYPE_LABEL[t as InvestType]}
                </span>
                <span className="iv">{formatMoney(amt)}원</span>
              </div>
            ))}
          </div>
        )}

        {/* 기록 목록 or 초보자 안내 */}
        <div className="home-list">
          {hasRecords ? (
            <RecordList records={filtered} />
          ) : (
            <div className="home-guide">
              <div className="guide-emoji">👋</div>
              <div className="guide-title">이렇게 시작해요</div>
              <p className="guide-desc">
                아래 <b>＋ 내 돈 기록하기</b> 버튼을 눌러 급여·고정지출·경조사비·
                저축을 하나씩 적어보세요. 적은 만큼 자동으로 정리돼요.
              </p>
            </div>
          )}
        </div>

        {/* 기록 추가 버튼 (스크롤 콘텐츠 내부) */}
        <button
          className="btn btn-primary btn-block btn-lg"
          style={{ marginTop: 16 }}
          onClick={() => navigate({ name: "add" })}
        >
          ＋ 내 돈 기록하기
        </button>
      </div>
    </div>
  );
}

function RecordList({ records }: { records: Record[] }) {
  const sorted = sortForDisplay(records);
  return (
    <div className="card list-card">
      {sorted.map((r) => (
        <RecordItem
          key={r.id}
          record={r}
          onClick={(id) => navigate({ name: "detail", id })}
        />
      ))}
    </div>
  );
}
