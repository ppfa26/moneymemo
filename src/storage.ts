// 로컬 저장소 레이어
// MVP: 브라우저 localStorage 사용 (서버비 0원, 디바이스 로컬 저장).
// 사진은 base64 data URL로 함께 저장해요. (연락처 연동 없이 수기 입력 → 개인정보 리스크 최소화)

import type { Record } from "./types";

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

// ---- 기록 CRUD ----

export function loadRecords(): Record[] {
  const list = safeParse<Record[]>(localStorage.getItem(RECORDS_KEY), []);
  // 최신순 정렬 (메모리 정렬 - 인덱스 이슈 없음)
  return list.sort((a, b) => b.createdAt - a.createdAt);
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
  // 최초 실행 시각이 없었으면 지금 기록
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
