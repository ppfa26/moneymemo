// 월간/연간 "관리 리포트" 상세 화면.
//
// ★ 리워드 광고 연결 지점: 홈 요약에서 "관리 리포트 자세히 보기"를 누르면
//   리워드 광고를 본 뒤 이 화면으로 들어와요 (사용자가 '깊은 분석'이라는 이득을 얻는 순간).
//   - 광고 실패/미지원이어도 리포트는 그대로 열려요 (기능 미차단, 심사 안전).
//
// ★ 커스텀 뒤로가기 버튼 없음 (토스 상단바가 back 제공).

import { useMemo, useState } from "react";
import { loadRecords } from "../storage";
import type { InvestType, Record } from "../types";
import { INVEST_TYPE_EMOJI, INVEST_TYPE_LABEL } from "../types";
import { formatMoney, todayISO } from "../utils";

type Mode = "month" | "year";

interface Props {
  initialMode?: Mode;
  initialYear?: number;
  initialMonth?: number;
}

interface Sums {
  earned: number; // 번 돈 (급여 + 경조사 받음)
  spent: number; // 쓴 돈 (고정지출 + 경조사 냄)
  saved: number; // 모은 돈 (저축·투자)
  salary: number;
  giftIn: number;
  giftOut: number;
  expense: number;
}

function sumPeriod(records: Record[]): Sums {
  let salary = 0,
    giftIn = 0,
    giftOut = 0,
    expense = 0,
    saved = 0;
  for (const r of records) {
    switch (r.category) {
      case "salary":
        salary += r.amount;
        break;
      case "expense":
        expense += r.amount;
        break;
      case "saving":
        saved += r.amount;
        break;
      case "gift":
        if (r.flow === "in") giftIn += r.amount;
        else giftOut += r.amount;
        break;
    }
  }
  return {
    salary,
    giftIn,
    giftOut,
    expense,
    saved,
    earned: salary + giftIn,
    spent: expense + giftOut,
  };
}

export function ReportScreen({
  initialMode = "month",
  initialYear,
  initialMonth,
}: Props) {
  const records = useMemo(() => loadRecords(), []);
  const today = todayISO();
  const curYear = Number(today.slice(0, 4));
  const curMonth = Number(today.slice(5, 7));

  const [mode] = useState<Mode>(initialMode);
  const [year] = useState(initialYear ?? curYear);
  const [month] = useState(initialMonth ?? curMonth);

  // 이번 기간 / 지난 기간 키
  const curKey = useMemo(() => {
    if (mode === "year") return String(year);
    return `${year}-${String(month).padStart(2, "0")}`;
  }, [mode, year, month]);

  const prevKey = useMemo(() => {
    if (mode === "year") return String(year - 1);
    let m = month - 1;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    return `${y}-${String(m).padStart(2, "0")}`;
  }, [mode, year, month]);

  const matchKey = (r: Record, key: string) =>
    mode === "year" ? r.date.slice(0, 4) === key : r.date.slice(0, 7) === key;

  const cur = useMemo(
    () => sumPeriod(records.filter((r) => matchKey(r, curKey))),
    [records, curKey, mode],
  );
  const prev = useMemo(
    () => sumPeriod(records.filter((r) => matchKey(r, prevKey))),
    [records, prevKey, mode],
  );

  const leftover = cur.earned - cur.spent - cur.saved;

  // 저축률 = 모은 돈 / 번 돈, 소비율 = 쓴 돈 / 번 돈
  // ★ 이번 기간에 번 돈보다 저축/소비가 클 수 있어요(과거 목돈 저축, 목돈 지출 등).
  //   이때 1000% 같은 비현실적 숫자 대신 100%로 표기하고 별도 안내해요.
  const savingRateRaw =
    cur.earned > 0 ? Math.round((cur.saved / cur.earned) * 100) : 0;
  const spendRateRaw =
    cur.earned > 0 ? Math.round((cur.spent / cur.earned) * 100) : 0;
  const savingRate = Math.min(savingRateRaw, 100);
  const spendRate = Math.min(spendRateRaw, 100);
  const savingOver = savingRateRaw > 100; // 번 돈보다 많이 모음
  const spendOver = spendRateRaw > 100; // 번 돈보다 많이 씀

  // 돈이 나간 곳 비중 (고정지출 / 경조사 냄 / 저축)
  const outParts = useMemo(() => {
    const parts: { key: string; label: string; emoji: string; amount: number }[] =
      [
        { key: "expense", label: "고정지출", emoji: "💳", amount: cur.expense },
        { key: "giftOut", label: "경조사비", emoji: "🎁", amount: cur.giftOut },
        { key: "saved", label: "저축·투자", emoji: "🏦", amount: cur.saved },
      ];
    const total = parts.reduce((s, p) => s + p.amount, 0);
    return parts
      .filter((p) => p.amount > 0)
      .map((p) => ({
        ...p,
        pct: total > 0 ? Math.round((p.amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [cur]);

  // 지난 기간 대비 증감
  const diff = {
    earned: cur.earned - prev.earned,
    spent: cur.spent - prev.spent,
    saved: cur.saved - prev.saved,
  };
  const hasPrev = prev.earned + prev.spent + prev.saved > 0;

  // 투자 자산 구성 (전체 기간 누적)
  const investByType = useMemo(() => {
    const map = new Map<InvestType, number>();
    records
      .filter((r) => r.category === "saving")
      .forEach((r) => {
        const t: InvestType = r.investType ?? "deposit";
        map.set(t, (map.get(t) ?? 0) + r.amount);
      });
    const total = [...map.values()].reduce((s, v) => s + v, 0);
    return {
      total,
      list: [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([t, amt]) => ({
          type: t,
          amount: amt,
          pct: total > 0 ? Math.round((amt / total) * 100) : 0,
        })),
    };
  }, [records]);

  const periodLabel = mode === "year" ? `${year}년` : `${year}년 ${month}월`;
  const prevLabel = mode === "year" ? "작년" : "지난달";
  const hasAny = cur.earned + cur.spent + cur.saved > 0;

  function diffText(v: number): { text: string; cls: string } {
    if (v === 0) return { text: "변화 없음", cls: "flat" };
    if (v > 0) return { text: `+${formatMoney(v)}원`, cls: "up" };
    return { text: `-${formatMoney(Math.abs(v))}원`, cls: "down" };
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>관리 리포트</h1>
        <div className="sub">{periodLabel} 나의 돈 관리 분석</div>
      </div>

      <div className="page-body report-body">
        {!hasAny ? (
          <div className="report-empty">
            <div className="guide-emoji">📊</div>
            <p className="guide-desc">
              이 기간엔 아직 기록이 없어요. 홈에서 먼저 기록해보세요.
            </p>
          </div>
        ) : (
          <>
            {/* 핵심 요약 히어로 */}
            <div className="report-hero">
              <div className="rh-title">{periodLabel} 한눈에 보기</div>
              <div className="rh-main">
                <span className="rh-k">쓰고 남은 돈</span>
                <span className={`rh-v ${leftover < 0 ? "minus" : ""}`}>
                  {leftover >= 0 ? "+" : "-"}
                  {formatMoney(Math.abs(leftover))}원
                </span>
              </div>
              <div className="rh-grid">
                <div className="rh-cell">
                  <span className="c-k">💰 벌었어요</span>
                  <span className="c-v">{formatMoney(cur.earned)}원</span>
                </div>
                <div className="rh-cell">
                  <span className="c-k">💳 썼어요</span>
                  <span className="c-v">{formatMoney(cur.spent)}원</span>
                </div>
                <div className="rh-cell">
                  <span className="c-k">🏦 모았어요</span>
                  <span className="c-v">{formatMoney(cur.saved)}원</span>
                </div>
              </div>
            </div>

            {/* 저축률 / 소비율 게이지 (이번 기간 번 돈 기준) */}
            <div className="report-card">
              <div className="rc-title">📈 이번에 번 돈은 이렇게 나눴어요</div>
              <div className="gauge-row">
                <div className="gauge-label">
                  <span>🏦 저축률</span>
                  <b>{savingOver ? "100%+" : `${savingRate}%`}</b>
                </div>
                <div className="gauge-bar">
                  <div
                    className="gauge-fill save"
                    style={{ width: `${savingRate}%` }}
                  />
                </div>
              </div>
              <div className="gauge-row">
                <div className="gauge-label">
                  <span>💳 소비율</span>
                  <b>{spendOver ? "100%+" : `${spendRate}%`}</b>
                </div>
                <div className="gauge-bar">
                  <div
                    className="gauge-fill spend"
                    style={{ width: `${spendRate}%` }}
                  />
                </div>
              </div>
              {(savingOver || spendOver) && (
                <p className="gauge-note">
                  이번 기간 번 돈보다 {savingOver ? "모은 돈" : "쓴 돈"}이 커요.
                  과거 목돈이나 큰 지출이 포함된 것 같아요.
                </p>
              )}
            </div>

            {/* 돈이 나간 곳 비중 */}
            {outParts.length > 0 && (
              <div className="report-card">
                <div className="rc-title">🍩 돈은 어디로 갔을까요</div>
                {outParts.map((p) => (
                  <div key={p.key} className="part-row">
                    <div className="part-head">
                      <span className="part-name">
                        {p.emoji} {p.label}
                      </span>
                      <span className="part-amt">
                        {formatMoney(p.amount)}원
                        <em className="part-pct"> · {p.pct}%</em>
                      </span>
                    </div>
                    <div className="part-bar">
                      <div
                        className="part-fill"
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 지난 기간 대비 */}
            {hasPrev && (
              <div className="report-card">
                <div className="rc-title">🔁 {prevLabel}보다 어땠을까요</div>
                {(
                  [
                    ["💰 번 돈", diff.earned],
                    ["💳 쓴 돈", diff.spent],
                    ["🏦 모은 돈", diff.saved],
                  ] as [string, number][]
                ).map(([label, v]) => {
                  const d = diffText(v);
                  return (
                    <div key={label} className="compare-row">
                      <span className="cmp-k">{label}</span>
                      <span className={`cmp-v ${d.cls}`}>{d.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 투자 자산 구성 (전체 누적) */}
            {investByType.total > 0 && (
              <div className="report-card">
                <div className="rc-title">💼 지금까지 모은 자산 구성</div>
                <div className="asset-total">
                  전체 기간 누적 · 총 {formatMoney(investByType.total)}원
                </div>
                {investByType.list.map((a) => (
                  <div key={a.type} className="part-row">
                    <div className="part-head">
                      <span className="part-name">
                        {INVEST_TYPE_EMOJI[a.type]} {INVEST_TYPE_LABEL[a.type]}
                      </span>
                      <span className="part-amt">
                        {formatMoney(a.amount)}원
                        <em className="part-pct"> · {a.pct}%</em>
                      </span>
                    </div>
                    <div className="part-bar">
                      <div
                        className="part-fill asset"
                        style={{ width: `${a.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
