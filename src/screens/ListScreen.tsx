import { useMemo, useState } from "react";
import { navigate } from "../router";
import { loadRecords } from "../storage";
import type { Category, Record } from "../types";
import { CATEGORY_LABEL } from "../types";
import { formatMoney, sortForDisplay } from "../utils";
import { RecordItem } from "../components/RecordItem";

type Filter = "all" | Category;

const FILTERS: [Filter, string][] = [
  ["all", "전체"],
  ["salary", CATEGORY_LABEL.salary],
  ["expense", CATEGORY_LABEL.expense],
  ["gift", CATEGORY_LABEL.gift],
  ["saving", CATEGORY_LABEL.saving],
];

function labelOf(f: Filter): string {
  return f === "all" ? "기록" : CATEGORY_LABEL[f];
}

interface ListProps {
  initialFilter?: Category;
}

export function ListScreen({ initialFilter }: ListProps) {
  const all = useMemo(() => loadRecords(), []);
  const [filter, setFilter] = useState<Filter>(initialFilter ?? "all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim();
    const list = all.filter((r) => {
      if (filter !== "all" && r.category !== filter) return false;
      if (q) {
        const hay = `${r.name} ${r.reason ?? ""} ${r.memo ?? ""}`;
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // 큰 수 → 작은 수 (+ 먼저, - 나중) 보기 편하게 정렬
    return sortForDisplay(list);
  }, [all, filter, query]);

  const total = useMemo(() => {
    let inn = 0; // 들어온 돈(급여·경조사 받음)
    let out = 0; // 나간 돈(고정지출·경조사 냄)
    let save = 0; // 모은 돈(저축·투자)
    for (const r of filtered) {
      if (r.flow === "in") inn += r.amount;
      else if (r.flow === "save") save += r.amount;
      else out += r.amount;
    }
    return { inn, out, save, count: filtered.length };
  }, [filtered]);

  // 저축·투자 필터에서는 '모은 돈'을, 그 외에는 나간/들어온 돈을 보여줘요
  const showSave = filter === "saving";

  return (
    <div className="page">
      <div className="page-header">
        <h1>내역</h1>
        <div className="sub">저장한 모든 기록을 한눈에 봐요</div>
      </div>

      <div className="page-body">
        {/* 카테고리 필터 (가로 스크롤) */}
        <div className="segment scroll-x">
          {FILTERS.map(([v, label]) => (
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

        {/* 합계 요약 (라벨을 붙여 이해하기 쉽게) */}
        <div className="list-summary2">
          <div className="ls2-item">
            <div className="ls2-k">총 기록</div>
            <div className="ls2-v">{total.count}건</div>
          </div>
          {showSave ? (
            <div className="ls2-item">
              <div className="ls2-k">모은 돈</div>
              <div className="ls2-v saved">+{formatMoney(total.save)}원</div>
            </div>
          ) : (
            <div className="ls2-item">
              <div className="ls2-k">나간 돈</div>
              <div className="ls2-v given">-{formatMoney(total.out)}원</div>
            </div>
          )}
          <div className="ls2-item">
            <div className="ls2-k">들어온 돈</div>
            <div className="ls2-v received">+{formatMoney(total.inn)}원</div>
          </div>
        </div>

        {/* 이 종류로 바로 추가 (예: 저축·투자 필터에서 모은 돈 한번에 입력) */}
        <button
          className="btn btn-primary btn-block add-in-list"
          onClick={() =>
            navigate({
              name: "add",
              category: filter === "all" ? undefined : filter,
            })
          }
        >
          {filter === "saving"
            ? "＋ 모은 돈 추가하기"
            : filter === "all"
              ? "＋ 기록 추가하기"
              : `＋ ${labelOf(filter)} 추가하기`}
        </button>

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
