import { useMemo, useState } from "react";
import { navigate } from "../router";
import { loadRecords } from "../storage";
import type { Kind, Record } from "../types";
import { KIND_LABEL } from "../types";
import { formatMoney } from "../utils";
import { RecordItem } from "../components/RecordItem";
import { AdBanner } from "../components/AdBanner";

type Filter = "all" | Kind;

export function ListScreen() {
  const all = useMemo(() => loadRecords(), []);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim();
    return all.filter((r) => {
      if (filter !== "all" && r.kind !== filter) return false;
      if (q) {
        const hay =
          r.name +
          " " +
          (r.kind === "gift" ? r.reason : "") +
          " " +
          (r.memo ?? "");
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, filter, query]);

  // 부호 합산: in(+) / out(-)
  const total = useMemo(() => {
    let inn = 0;
    let out = 0;
    for (const r of filtered) {
      if (r.flow === "in") inn += r.amount;
      else out += r.amount;
    }
    return { inn, out, net: inn - out, count: filtered.length };
  }, [filtered]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>내역</h1>
        <div className="sub">저장한 모든 기록을 한눈에 봐요</div>
      </div>

      <div className="page-body">
        {/* 종류 필터 */}
        <div className="segment">
          {(
            [
              ["all", "전체"],
              ["expense", KIND_LABEL.expense],
              ["gift", KIND_LABEL.gift],
            ] as [Filter, string][]
          ).map(([v, label]) => (
            <button
              key={v}
              className={`seg ${filter === v ? "active" : ""}`}
              onClick={() => setFilter(v)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 검색 */}
        <div className="field" style={{ marginTop: 12 }}>
          <input
            className="text-input"
            placeholder="이름·사유·메모로 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* 합계 요약 바 */}
        <div className="list-summary">
          <span className="ls-count">{total.count}건</span>
          <span className="ls-nums">
            <span className="given">-{formatMoney(total.out)}</span>
            {" · "}
            <span className="received">+{formatMoney(total.inn)}</span>
          </span>
        </div>

        {/* 배너 광고 */}
        <AdBanner />

        {/* 목록 */}
        <div className="home-list">
          {filtered.length === 0 ? (
            <div className="empty">
              <div className="emoji">🔍</div>
              <div className="msg">기록이 없어요</div>
            </div>
          ) : (
            <RecordList records={filtered} />
          )}
        </div>
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
