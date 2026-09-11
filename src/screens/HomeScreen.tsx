import { useMemo } from "react";
import { navigate } from "../router";
import { loadRecords } from "../storage";
import { currentYearMonth, formatMoney, yearMonth } from "../utils";
import { RecordItem } from "../components/RecordItem";
import { AdBanner } from "../components/AdBanner";

export function HomeScreen() {
  const records = useMemo(() => loadRecords(), []);
  const ym = currentYearMonth();
  const month = Number(ym.slice(5));

  const { received, given } = useMemo(() => {
    let received = 0;
    let given = 0;
    for (const r of records) {
      if (yearMonth(r.date) !== ym) continue;
      if (r.direction === "received") received += r.amount;
      else given += r.amount;
    }
    return { received, given };
  }, [records, ym]);

  const net = received - given;
  const recent = records.slice(0, 3);

  return (
    <div className="page">
      <div className="page-header">
        <h1>경조사비 메모장</h1>
        <div className="sub">주고받은 마음을 기록해요</div>
      </div>

      <div className="page-body">
        {/* 이번 달 요약 - 순액 크게 강조 */}
        <div className="summary">
          <div className="summary-title">{month}월 한눈에 보기</div>
          <div className="summary-net">
            <div className="net-label">이번 달 순액</div>
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

        {/* 최근 기록 */}
        <div className="section-title">
          <h2>최근 기록</h2>
          {records.length > 0 && (
            <button className="more" onClick={() => navigate({ name: "list" })}>
              전체 보기
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="card empty">
            <div className="emoji">📝</div>
            <div className="msg">
              아직 기록이 없어요.
              <br />
              아래 버튼으로 첫 기록을 남겨볼까요?
            </div>
          </div>
        ) : (
          <div className="card">
            {recent.map((r) => (
              <RecordItem
                key={r.id}
                record={r}
                onClick={(id) => navigate({ name: "detail", id })}
              />
            ))}
          </div>
        )}
      </div>

      {/* 홈 하단 배너 (상시) */}
      <AdBanner slot="home" />

      {/* 새 기록 버튼 */}
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
