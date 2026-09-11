// 전면광고를 "지금 띄워도 되는지" 판단하는 순수 함수.
//
// ★ 배치 방식(대표님 확정): 미니앱을 "실행할 때" 딱 1회만.
//   앱을 쓰는 도중에는 전면광고를 절대 띄우지 않아요 (편하게 사용).
//   - 가입 후 24시간은 스킵 (첫인상 보호)
//   - 마지막 노출 후 30분 쿨타임 (자주 켜도 광고 폭탄 방지)
//   - 세션당 1회 (같은 실행 중 재노출 방지)

import { AD_POLICY } from "./adConfig";

/** 이번 세션(=이번 실행)에 전면광고를 이미 띄웠는지 (메모리 - 새로고침 시 초기화) */
let shownThisSession = false;

export function markLaunchInterstitialShown(): void {
  shownThisSession = true;
}

interface LaunchInterstitialContext {
  now: number;
  firstLaunchAt: number;
  lastInterstitialAt: number;
}

export interface InterstitialDecision {
  allow: boolean;
  reason: string;
}

/**
 * 앱 실행 시 전면광고를 띄울지 결정해요.
 * 규칙:
 *  - 이번 실행에 이미 띄웠으면 스킵
 *  - 가입 후 24시간은 스킵 (첫인상 보호)
 *  - 마지막 노출 후 30분 쿨타임 미경과면 스킵
 */
export function decideLaunchInterstitial(
  ctx: LaunchInterstitialContext,
): InterstitialDecision {
  if (shownThisSession) {
    return { allow: false, reason: "이번 실행에 이미 노출" };
  }
  if (ctx.now - ctx.firstLaunchAt < AD_POLICY.NEW_USER_GRACE_MS) {
    return { allow: false, reason: "가입 후 24시간 - 첫인상 보호" };
  }
  if (ctx.now - ctx.lastInterstitialAt < AD_POLICY.INTERSTITIAL_COOLDOWN_MS) {
    return { allow: false, reason: "30분 쿨타임 미경과" };
  }
  return { allow: true, reason: "노출 허용" };
}
