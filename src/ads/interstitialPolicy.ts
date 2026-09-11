// 전면광고를 "지금 띄워도 되는지" 판단하는 순수 함수.
// 대표님의 이탈 방지 안전장치를 코드로 강제해요.
//
// ★ 배치 위치: 상세 화면을 "보고 나서 뒤로 나갈 때"만.
//   (기록 저장 같은 핵심 액션 직후에는 절대 넣지 않아요 → 이탈 방지)

import { AD_POLICY } from "./adConfig";

/** 세션당 전면광고 노출 횟수 (메모리 - 새로고침 시 초기화) */
let sessionInterstitialCount = 0;

/** 이번 세션에 상세를 본 적 있는지 (콘텐츠 소비 여부) */
let viewedDetailThisSession = false;
/** 마지막으로 본 상세가 '민감 맥락'인지 (예: 장례 부조금 → 광고 스킵) */
let lastViewedSensitive = false;

export function getSessionCount(): number {
  return sessionInterstitialCount;
}

export function incrementSessionCount(): void {
  sessionInterstitialCount += 1;
}

/** 상세를 봤다고 표시. sensitive=true면 장례 등 민감 맥락(광고 스킵) */
export function markDetailViewed(sensitive = false): void {
  viewedDetailThisSession = true;
  lastViewedSensitive = sensitive;
}

export function hasViewedDetail(): boolean {
  return viewedDetailThisSession;
}

export function getLastViewedSensitive(): boolean {
  return lastViewedSensitive;
}

/** 홈 복귀 시 다음 노출 사이클을 위해 소비 플래그 리셋 */
export function resetDetailViewed(): void {
  viewedDetailThisSession = false;
  lastViewedSensitive = false;
}

interface InterstitialContext {
  now: number;
  firstLaunchAt: number;
  lastInterstitialAt: number;
  /** 보고 나가는 기록이 민감 맥락(장례 부조금 등)이면 스킵 */
  sensitive?: boolean;
}

export interface InterstitialDecision {
  allow: boolean;
  reason: string;
}

/**
 * 전면광고를 띄울지 결정해요.
 * 규칙:
 *  - ★ 장례(부조금) 등 민감 맥락에서는 스킵 (맥락 배려)
 *  - 가입 후 24시간은 무조건 스킵 (첫인상 보호)
 *  - 세션당 최대 1회
 *  - 마지막 노출 후 5분 쿨타임
 */
export function decideInterstitial(
  ctx: InterstitialContext,
): InterstitialDecision {
  if (ctx.sensitive) {
    return { allow: false, reason: "민감 맥락(장례 등) - 전면광고 스킵" };
  }
  if (ctx.now - ctx.firstLaunchAt < AD_POLICY.NEW_USER_GRACE_MS) {
    return { allow: false, reason: "가입 후 24시간 - 첫인상 보호" };
  }
  if (sessionInterstitialCount >= 1) {
    return { allow: false, reason: "세션당 1회 캡 도달" };
  }
  if (ctx.now - ctx.lastInterstitialAt < AD_POLICY.INTERSTITIAL_COOLDOWN_MS) {
    return { allow: false, reason: "5분 쿨타임 미경과" };
  }
  return { allow: true, reason: "노출 허용" };
}
