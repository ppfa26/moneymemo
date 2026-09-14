// 로컬 저장소 레이어
// MVP: 브라우저 localStorage 사용 (서버비 0원, 디바이스 로컬 저장).
// 통합형: 급여/고정지출/경조사비/저축을 하나의 리스트에 category로 구분해 저장해요.

import type { Category, Record } from "./types";

const RECORDS_KEY = "gjm.records.v1";
const META_KEY = "gjm.meta.v1";

interface AppMeta {
  firstLaunchAt: number;
  lastInterstitialAt: number;
  notificationAgreed: boolean;
  /** 매달 급여(월수입). 0이면 미설정. 매달 자동 반영, 수정 가능. */
  monthlySalary: number;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 구버전 데이터를 신버전(category) 스키마로 마이그레이션.
 *  - v0(경조사비 전용): direction/eventType → gift
 *  - v1(kind: expense|gift): kind → category, flow(in/out) 유지, expense의 in은 saving으로
 */
function migrate(raw: unknown): Record[] {
  if (!Array.isArray(raw)) return [];
  const reasonMap: { [k: string]: string } = {
    wedding: "결혼",
    funeral: "장례",
    firstbirthday: "돌잔치",
    etc: "기타",
  };
  return raw.map((item): Record => {
    const r = item as any;

    // 이미 신버전(category)이면 그대로
    if (r.category) return r as Record;

    // v1: kind 기반
    if (r.kind === "expense" || r.kind === "gift") {
      if (r.kind === "expense") {
        // 고정지출의 in(저축·투자) → saving 카테고리로
        const isSave = r.flow === "in";
        return {
          id: r.id,
          category: isSave ? "saving" : "expense",
          flow: isSave ? "save" : "out",
          name: r.name,
          amount: r.amount,
          date: r.date,
          payMethod: r.payMethod,
          payDay: r.payDay,
          memo: r.memo,
          photos: r.photos ?? [],
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      }
      // gift
      return {
        id: r.id,
        category: "gift",
        flow: r.flow === "in" ? "in" : "out",
        name: r.name,
        amount: r.amount,
        date: r.date,
        reason: r.reason ?? "기타",
        memo: r.memo,
        photos: r.photos ?? [],
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    }

    // v0: 경조사비 전용
    const flow = r.direction === "received" ? "in" : "out";
    return {
      id: r.id,
      category: "gift",
      flow,
      name: r.name,
      amount: r.amount,
      date: r.date,
      reason: r.eventType ? (reasonMap[r.eventType] ?? "기타") : "기타",
      memo: r.memo,
      photos: r.photos ?? [],
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---- 기록 CRUD ----

export function loadRecords(): Record[] {
  const parsed = safeParse<unknown>(localStorage.getItem(RECORDS_KEY), []);
  const list = migrate(parsed);
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export function loadRecordsByCategory(category: Category): Record[] {
  return loadRecords().filter((r) => r.category === category);
}

export function saveRecords(records: Record[]): void {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function getRecord(id: string): Record | undefined {
  return loadRecords().find((r) => r.id === id);
}

export function upsertRecord(record: Record): void {
  const list = loadRecords();
  const idx = list.findIndex((r) => r.id === record.id);
  if (idx >= 0) list[idx] = record;
  else list.push(record);
  saveRecords(list);
}

export function deleteRecord(id: string): void {
  const list = loadRecords().filter((r) => r.id !== id);
  saveRecords(list);
}

// ---- 메타 정보 ----

export function loadMeta(): AppMeta {
  const meta = safeParse<Partial<AppMeta>>(localStorage.getItem(META_KEY), {});
  const now = Date.now();
  const normalized: AppMeta = {
    firstLaunchAt: meta.firstLaunchAt ?? now,
    lastInterstitialAt: meta.lastInterstitialAt ?? 0,
    notificationAgreed: meta.notificationAgreed ?? false,
    monthlySalary: meta.monthlySalary ?? 0,
  };
  if (meta.firstLaunchAt == null) saveMeta(normalized);
  return normalized;
}

export function saveMeta(meta: AppMeta): void {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function markInterstitialShown(): void {
  const meta = loadMeta();
  meta.lastInterstitialAt = Date.now();
  saveMeta(meta);
}

export function setNotificationAgreed(agreed: boolean): void {
  const meta = loadMeta();
  meta.notificationAgreed = agreed;
  saveMeta(meta);
}

/** 매달 급여 설정 (매달 자동 반영) */
export function setMonthlySalary(amount: number): void {
  const meta = loadMeta();
  meta.monthlySalary = Math.max(0, Math.floor(amount));
  saveMeta(meta);
}

export function getMonthlySalary(): number {
  return loadMeta().monthlySalary;
}

/** 모든 데이터 초기화 (기록 + 월급/설정). 되돌릴 수 없어요. */
export function clearAllData(): void {
  localStorage.removeItem(RECORDS_KEY);
  localStorage.removeItem(META_KEY);
}

export type { AppMeta };
