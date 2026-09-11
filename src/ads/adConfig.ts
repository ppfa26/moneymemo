// 광고 그룹 ID 및 정책 상수
//
// ★ 개발/심사 전에는 아래 테스트 ID를 사용하고,
//   출시 전 대표님이 토스 콘솔에서 발급받은 실제 광고 그룹 ID로 교체해요.
//   (콘솔 → 광고 → 배너/전면/리워드 슬롯 각각 발급)
//
// ★ 인앱 광고 2.0 (앱인토스 제공 광고) SDK만 사용해요. 외부 광고 SDK 금지.

export const AD_GROUP_IDS = {
  bannerHome: "ait-ad-test-banner-id",
  bannerList: "ait-ad-test-banner-id",
  interstitial: "ait-ad-test-interstitial-id",
  rewarded: "ait-ad-test-rewarded-id",
} as const;

// ---- 전면광고 이탈 방지 정책 (대표님 설계 반영) ----
export const AD_POLICY = {
  /** 가입 후 이 시간(ms) 동안은 전면광고 0회 (첫인상 보호) */
  NEW_USER_GRACE_MS: 24 * 60 * 60 * 1000, // 24시간
  /** 전면광고 최소 쿨타임 (ms) */
  INTERSTITIAL_COOLDOWN_MS: 5 * 60 * 1000, // 5분
} as const;
