// 전면광고를 "지금 띄워도 되는지" 판단하는 순수 함수 모음.
// 대표님의 이탈 방지 안전장치를 코드로 강제해요.

import type { EventType } from "../types";
import { AD_POLICY } from "./adConfig";

/** 세션당 전면광고 노출 횟수 (메모리 - 새로고침 시 초기화) */
let sessionInterstitialCount = 0;

export function resetSessionCount(): void {
  sessionInterstitialCount = 0;
}

export function getSessionCount(): number {
  return sessionInterstitialCount;
}

export function incrementSessionCount(): void {
  sessionInterstitialCount += 1;
}

interface InterstitialContext {
  now: number;
  firstLaunchAt: number;
  lastInterstitialAt: number;
  /** 방금 저장한 기록의 경조사 종류 (장례면 스킵) */
  eventType?: EventType;
}

export interface InterstitialDecision {
  allow: boolean;
  reason: string;
}

/**
 * 기록 저장 완료 직후 전면광고를 띄울지 결정해요.
 * 규칙:
 *  - 가입 후 24시간은 무조건 스킵 (첫인상 보호)
 *  - 세션당 최대 1회
 *  - 마지막 노출 후 5분 쿨타임
 *  - ★ 장례(부조금) 기록 저장 후엔 스킵 (맥락 배려)
 */
export function decideInterstitialAfterSave(
  ctx: InterstitialContext,
): InterstitialDecision {
  if (ctx.eventType === "funeral") {
    return { allow: false, reason: "장례 기록 - 맥락 배려로 전면광고 스킵" };
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
