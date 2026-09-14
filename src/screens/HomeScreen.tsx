import { useMemo, useState } from "react";
import { navigate } from "../router";
import { getMonthlySalary, loadRecords, setMonthlySalary } from "../storage";
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

  // 급여 (매달 자동 반영). 편집 상태 관리.
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

  // 카테고리별 합계
  const sums = useMemo(() => {
    let expense = 0; // 고정지출
    let giftOut = 0; // 경조사비 냄
    let giftIn = 0; // 경조사비 받음
    let saving = 0; // 저축·투자
    let salaryRecords = 0; // 급여 카테고리로 직접 입력한 것
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

  // 급여는 월별이면 설정값 1회, 연도별이면 ×12 (직접 입력한 급여 기록도 합산)
  const salaryBase = mode === "year" ? salary * 12 : salary;
  const totalIncome = salaryBase + sums.salaryRecords + sums.giftIn;
  // 나가는 돈 = 고정지출 + 경조사비 냄  (저축은 '내 돈'이라 남은 돈에서 빼되 소비는 아님)
  const totalOut = sums.expense + sums.giftOut;
  const remaining = totalIncome - totalOut - sums.saving;

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
            <div className="net-label">남은 돈</div>
            <div className="net-value">
              {remaining >= 0 ? "" : "-"}
              {formatMoney(Math.abs(remaining))}원
            </div>
          </div>

          {/* 내역 브레이크다운 */}
          <div className="calc-rows">
            <div className="calc-row">
              <span className="ck">💰 급여{mode === "year" ? " (연)" : ""}</span>
              <span className="cv received">+{formatMoney(salaryBase + sums.salaryRecords)}</span>
            </div>
            {sums.giftIn > 0 && (
              <div className="calc-row">
                <span className="ck">🎁 경조사비 받음</span>
                <span className="cv received">+{formatMoney(sums.giftIn)}</span>
              </div>
            )}
            <div className="calc-row">
              <span className="ck">💳 고정지출</span>
              <span className="cv given">-{formatMoney(sums.expense)}</span>
            </div>
            {sums.giftOut > 0 && (
              <div className="calc-row">
                <span className="ck">🎁 경조사비 냄</span>
                <span className="cv given">-{formatMoney(sums.giftOut)}</span>
              </div>
            )}
            <div className="calc-row">
              <span className="ck">🏦 저축·투자</span>
              <span className="cv saving">-{formatMoney(sums.saving)}</span>
            </div>
          </div>
        </div>

        {/* 급여 설정 카드 */}
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
              <span className="sk">💰 매달 급여</span>
              <span className="sv">
                {salary > 0 ? `${formatMoney(salary)}원` : "입력하기"}
                <span className="edit-hint"> ✎</span>
              </span>
            </button>
          )}
        </div>

        {/* 배너 광고 */}
        <AdBanner />

        {/* 기록 목록 */}
        <div className="home-list">
          {filtered.length > 0 && <RecordList records={filtered} />}
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
