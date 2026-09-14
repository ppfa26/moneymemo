// 광고 그룹 ID 및 정책 상수
//
// ★ 토스 콘솔에서 발급받은 실제 광고 그룹 ID (2026.09.14 발급, 구글 반영 완료).
//   - 배너(문구 강조): ait.v2.live.76d5e9b68c1940ab
//   - 전면:            ait.v2.live.36749b17be9e4872
//   - 리워드(내보내기,1): ait.v2.live.e656a908b09e4a15
//   배너는 홈/내역/내보내기 3곳에서 같은 배너 ID 하나를 공유해요.
//
// ★ 인앱 광고 2.0 (앱인토스 제공 광고) SDK만 사용해요. 외부 광고 SDK 금지.

export const AD_GROUP_IDS = {
  bannerHome: "ait.v2.live.76d5e9b68c1940ab",
  bannerList: "ait.v2.live.76d5e9b68c1940ab",
  bannerExport: "ait.v2.live.76d5e9b68c1940ab",
  interstitial: "ait.v2.live.36749b17be9e4872",
  rewarded: "ait.v2.live.e656a908b09e4a15",
} as const;

// ---- 전면광고 이탈 방지 정책 (대표님 설계 반영) ----
// 방식: 미니앱 실행 시 1회만 전면광고. 사용 중에는 절대 안 띄워요.
export const AD_POLICY = {
  /** 가입 후 이 시간(ms) 동안은 전면광고 0회 (첫인상 보호) */
  NEW_USER_GRACE_MS: 24 * 60 * 60 * 1000, // 24시간
  /** 실행 시 전면광고 쿨타임 (ms) - 마지막 노출 후 이 시간이 지나야 다시 노출 */
  INTERSTITIAL_COOLDOWN_MS: 30 * 60 * 1000, // 30분
} as const;
