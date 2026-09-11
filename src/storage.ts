// 로컬 저장소 레이어
// MVP: 브라우저 localStorage 사용 (서버비 0원, 디바이스 로컬 저장).
// 통합형: 고정지출/경조사비 두 종류를 하나의 리스트에 kind로 구분해 저장해요.

import type { Kind, Record } from "./types";

const RECORDS_KEY = "gjm.records.v1";
const META_KEY = "gjm.meta.v1";

interface AppMeta {
  /** 최초 실행 시각 (epoch ms) - 가입 후 24시간 전면광고 억제용 */
  firstLaunchAt: number;
  /** 마지막 전면광고 노출 시각 (epoch ms) - 쿨타임 계산용 */
  lastInterstitialAt: number;
  /** 알림 동의 여부 (앱 내 표시용 - 실제 발송은 콘솔 스마트발송) */
  notificationAgreed: boolean;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * 구버전(경조사비 전용) 데이터를 신버전 통합 스키마로 마이그레이션.
 * 구버전 필드: direction("received"|"given"), relation, eventType
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
    // 이미 신버전이면 그대로
    if (r.kind === "expense" || r.kind === "gift") {
      return r as Record;
    }
    // 구버전(경조사비 전용) → 경조사비(gift)로 변환
    const flow: "in" | "out" = r.direction === "received" ? "in" : "out";
    return {
      id: r.id,
      kind: "gift",
      flow,
      name: r.name,
      reason: r.eventType ? (reasonMap[r.eventType] ?? "기타") : "기타",
      amount: r.amount,
      date: r.date,
      memo: r.memo,
      photos: r.photos ?? [],
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---- 기록 CRUD ----

/** 전체 기록 로드 (최신순) */
export function loadRecords(): Record[] {
  const parsed = safeParse<unknown>(localStorage.getItem(RECORDS_KEY), []);
  const list = migrate(parsed);
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

/** 특정 종류(탭)의 기록만 로드 */
export function loadRecordsByKind(kind: Kind): Record[] {
  return loadRecords().filter((r) => r.kind === kind);
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
  if (idx >= 0) {
    list[idx] = record;
  } else {
    list.push(record);
  }
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
  };
  if (meta.firstLaunchAt == null) {
    saveMeta(normalized);
  }
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

export type { AppMeta };
