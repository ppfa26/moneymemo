import { useEffect, useMemo, useRef, useState } from "react";
import { navigate } from "../router";
import { loadRecords } from "../storage";
import type { Direction, EventType } from "../types";
import { EVENT_LABEL } from "../types";
import { currentYear } from "../utils";
import { RecordItem } from "../components/RecordItem";
import { AdBanner } from "../components/AdBanner";

const PAGE_SIZE = 20;

type DirFilter = "all" | Direction;
type EventFilter = "all" | EventType;

export function ListScreen() {
  const all = useMemo(() => loadRecords(), []);

  const [query, setQuery] = useState("");
  const [dirFilter, setDirFilter] = useState<DirFilter>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const years = useMemo(() => {
    const set = new Set(all.map((r) => r.date.slice(0, 4)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [all]);

  const filtered = useMemo(() => {
    const q = query.trim();
    return all.filter((r) => {
      if (q && !r.name.includes(q)) return false;
      if (dirFilter !== "all" && r.direction !== dirFilter) return false;
      if (yearFilter !== "all" && r.date.slice(0, 4) !== yearFilter)
        return false;
      if (eventFilter !== "all" && r.eventType !== eventFilter) return false;
      return true;
    });
  }, [all, query, dirFilter, yearFilter, eventFilter]);

  // 필터 바뀌면 페이지 초기화
  useEffect(() => setVisible(PAGE_SIZE), [query, dirFilter, yearFilter, eventFilter]);

  // 무한스크롤
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length));
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  const shown = filtered.slice(0, visible);
  const thisYear = currentYear();

  return (
    <div className="page">
      <div className="page-header">
        <h1>전체 기록</h1>
        <div className="sub">총 {filtered.length}건</div>
      </div>

      <div className="page-body">
        {/* 검색 */}
        <input
          className="search-input"
          placeholder="이름으로 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {/* 방향 필터 */}
        <div className="filter-row">
          {(
            [
              ["all", "전체"],
              ["received", "받음"],
              ["given", "줌"],
            ] as [DirFilter, string][]
          ).map(([v, label]) => (
            <button
              key={v}
              className={`filter-chip ${dirFilter === v ? "active" : ""}`}
              onClick={() => setDirFilter(v)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 종류 필터 */}
        <div className="filter-row">
          <button
            className={`filter-chip ${eventFilter === "all" ? "active" : ""}`}
            onClick={() => setEventFilter("all")}
          >
            종류 전체
          </button>
          {(["wedding", "funeral", "firstbirthday", "etc"] as EventType[]).map(
            (v) => (
              <button
                key={v}
                className={`filter-chip ${eventFilter === v ? "active" : ""}`}
                onClick={() => setEventFilter(v)}
              >
                {EVENT_LABEL[v]}
              </button>
            ),
          )}
        </div>

        {/* 연도 필터 */}
        {years.length > 0 && (
          <div className="filter-row">
            <button
              className={`filter-chip ${yearFilter === "all" ? "active" : ""}`}
              onClick={() => setYearFilter("all")}
            >
              전체 연도
            </button>
            {years.map((y) => (
              <button
                key={y}
                className={`filter-chip ${yearFilter === y ? "active" : ""}`}
                onClick={() => setYearFilter(y)}
              >
                {y === thisYear ? `올해(${y})` : `${y}년`}
              </button>
            ))}
          </div>
        )}

        {/* 목록 */}
        {shown.length === 0 ? (
          <div className="card empty" style={{ marginTop: 16 }}>
            <div className="emoji">🔍</div>
            <div className="msg">조건에 맞는 기록이 없어요.</div>
          </div>
        ) : (
          <div className="card" style={{ marginTop: 14 }}>
            {shown.map((r) => (
              <RecordItem
                key={r.id}
                record={r}
                onClick={(id) => navigate({ name: "detail", id })}
              />
            ))}
          </div>
        )}

        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>

      {/* 목록 하단 배너 (상시) */}
      <AdBanner slot="list" />
    </div>
  );
}
