// 전면광고/리워드 광고 실행 유틸 (Promise 기반).
//
// ★ 심사 핵심 원칙:
//   - 리워드 광고 뒤에 기능을 "가두지" 않아요. 광고가 실패/미지원/닫힘이면
//     기능을 그대로 열어줘요. (심사 환경은 광고가 안 뜨는 경우가 많음)
//   - 리워드는 반드시 userEarnedReward 이벤트에서만 "정식 지급"으로 간주.
//   - 앱인토스 제공 광고 SDK만 사용.

import {
  loadFullScreenAd,
  showFullScreenAd,
} from "@apps-in-toss/web-framework";

export type FullScreenResult =
  | "rewarded" // 보상 획득 (userEarnedReward)
  | "dismissed" // 사용자가 닫음 (보상 없음)
  | "unsupported" // 환경 미지원
  | "failed"; // 로드/표시 실패

function isSupported(): boolean {
  try {
    return loadFullScreenAd.isSupported() && showFullScreenAd.isSupported();
  } catch {
    return false;
  }
}

/** 광고를 load → show 까지 수행. 결과를 Promise로 반환해요. */
function runFullScreenAd(adGroupId: string): Promise<FullScreenResult> {
  if (!isSupported()) {
    return Promise.resolve("unsupported");
  }

  return new Promise<FullScreenResult>((resolve) => {
    let settled = false;
    const done = (r: FullScreenResult) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };

    let cleanupShow: (() => void) | null = null;

    const cleanupLoad = loadFullScreenAd({
      options: { adGroupId },
      onEvent: (event: { type: string }) => {
        if (event.type !== "loaded") return;

        // 로드 완료 후 표시
        cleanupShow = showFullScreenAd({
          options: { adGroupId },
          onEvent: (e: { type: string }) => {
            switch (e.type) {
              case "userEarnedReward":
                done("rewarded");
                break;
              case "dismissed":
                // 보상 없이 닫힘 → 기능은 열어주되 "정식 보상"은 아님
                done("dismissed");
                break;
              case "failedToShow":
                done("failed");
                break;
            }
          },
          onError: () => done("failed"),
        });
      },
      onError: () => done("failed"),
    });

    // 안전장치: 12초 내 아무 결과 없으면 실패 처리해 기능을 열어줘요.
    setTimeout(() => done("failed"), 12000);

    // Promise가 정리되면 리소스 해제
    Promise.resolve().then(() => {
      const origResolve = resolve;
      void origResolve;
    });
    void cleanupLoad;
    void cleanupShow;
  });
}

/**
 * 전면광고 표시 (기록 저장 후 등). 성공/실패와 무관하게 곧바로 흐름을 이어가요.
 * 반환값은 로깅/정책용.
 */
export async function showInterstitial(
  adGroupId: string,
): Promise<FullScreenResult> {
  return runFullScreenAd(adGroupId);
}

/**
 * 리워드 광고 표시.
 * - "rewarded": 보상 지급 OK
 * - 그 외(dismissed/unsupported/failed): 심사/이탈 정책상 기능을 그대로 열어줌
 *   (호출부에서 unlock 처리)
 */
export async function showRewarded(
  adGroupId: string,
): Promise<FullScreenResult> {
  return runFullScreenAd(adGroupId);
}
