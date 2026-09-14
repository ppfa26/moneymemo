import { useMemo, useState } from "react";
import { navigate } from "../router";
import { getMonthlySalary, loadRecords, setMonthlySalary } from "../storage";
import type { InvestType, Record } from "../types";
import { INVEST_TYPE_EMOJI, INVEST_TYPE_LABEL } from "../types";
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

  const [salary, setSalary] = useState<number>(() => getMonthlySalary());
  const [editingSalary, setEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState<string>("");

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

  // ★ 매월 고정지출 합계: 등록된 고정지출 항목들의 월 합계 (매달 반복 나가는 돈)
  //   중복 방지를 위해 같은 항목명은 한 번만 (가장 최근 금액) 집계해요.
  const monthlyExpense = useMemo(() => {
    const latest = new Map<string, number>();
    records
      .filter((r) => r.category === "expense")
      .sort((a, b) => b.createdAt - a.createdAt)
      .forEach((r) => {
        if (!latest.has(r.name)) latest.set(r.name, r.amount);
      });
    let sum = 0;
    latest.forEach((v) => (sum += v));
    return sum;
  }, [records]);

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

  // 급여: 월별=설정값, 연도별=×12 + 직접입력 급여 기록
  const salaryBase = mode === "year" ? salary * 12 : salary;
  const earned = salaryBase + sums.salaryRecords + sums.giftIn; // 번 돈
  const spent = sums.expense + sums.giftOut; // 쓴 돈
  const saved = sums.saving; // 이 기간 모은 돈
  const remaining = earned - spent - saved; // 남은 돈

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

  function startEditSalary() {
    setSalaryInput(salary ? String(salary) : "");
    setEditingSalary(true);
  }
  function saveSalary() {
    const v = Number(salaryInput.replace(/[^0-9]/g, "")) || 0;
    setMonthlySalary(v);
    setSalary(v);
    setEditingSalary(false);
  }

  const periodLabel = mode === "year" ? `${year}년` : `${year}년 ${month}월`;
  const salaryInputNum = Number(salaryInput.replace(/[^0-9]/g, "")) || 0;
  const hasRecords = filtered.length > 0;

  return (
    <div className="page home-page">
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
            <div className="net-label">이만큼 쓸 수 있어요</div>
            <div className="net-value">
              {remaining >= 0 ? "" : "-"}
              {formatMoney(Math.abs(remaining))}원
            </div>
          </div>

          {/* 벌고 · 쓰고 · 모으고 (초보자용 직관 요약) */}
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
              <span className="cv">-{formatMoney(saved)}원</span>
            </div>
          </div>
        </div>

        {/* ① 매달 버는 돈 (편집 가능) */}
        <div className="salary-card">
          {editingSalary ? (
            <div className="salary-edit">
              <div className="amount-input">
                <input
                  inputMode="numeric"
                  autoFocus
                  placeholder="0"
                  value={salaryInput ? formatMoney(salaryInputNum) : ""}
                  onChange={(e) => setSalaryInput(e.target.value)}
                />
                <span className="won">원</span>
              </div>
              <button className="btn btn-primary" onClick={saveSalary}>
                저장
              </button>
            </div>
          ) : (
            <button className="salary-row" onClick={startEditSalary}>
              <span className="sk">💰 매달 버는 돈</span>
              <span className="sv">
                {salary > 0 ? `${formatMoney(salary)}원` : "입력하기"}
                <span className="edit-hint"> ✎</span>
              </span>
            </button>
          )}
        </div>

        {/* ② 매월 고정지출 (자동 합계) - 눌러서 내역 보기 */}
        <button
          className="stat-row tappable"
          onClick={() => navigate({ name: "list", filter: "expense" })}
        >
          <span className="sk">💳 매월 고정지출</span>
          <span className="sv-wrap">
            <span className="sv given">{formatMoney(monthlyExpense)}원</span>
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

        {/* 배너 광고 */}
        <AdBanner />

        {/* 기록 목록 or 초보자 안내 */}
        <div className="home-list">
          {hasRecords ? (
            <RecordList records={filtered} />
          ) : (
            <div className="home-guide">
              <div className="guide-emoji">👋</div>
              <div className="guide-title">이렇게 시작해요</div>
              <ol className="guide-steps">
                <li>💰 위에서 <b>매달 버는 돈</b>을 입력해요</li>
                <li>💳 <b>기록 추가하기</b>로 고정지출·저축을 넣어요</li>
                <li>✅ 그러면 <b>쓸 수 있는 돈</b>이 자동으로 계산돼요</li>
              </ol>
            </div>
          )}
        </div>
      </div>

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
