// 전면광고/리워드 광고 실행 유틸 (Promise 기반).
//
// ★ 심사 핵심 원칙:
//   - 리워드 광고 뒤에 기능을 "가두지" 않아요. 광고가 실패/미지원/닫힘이면
//     기능을 그대로 열어줘요. (심사 환경은 광고가 안 뜨는 경우가 많음)
//   - 리워드는 반드시 userEarnedReward 이벤트에서만 "정식 지급"으로 간주.
//   - 앱인토스 제공 광고 SDK만 사용.
//
// ★ 긴 플레이형(게임형) 광고 대응:
//   - 광고가 "표시되기 시작(show/impression)"하면 타임아웃을 완전히 해제해요.
//     → 몇 분짜리 플레이형 광고를 끝까지 봐도 절대 중간에 안 끊겨요.
//   - 타임아웃은 오직 "로드 자체가 시작도 안 되는 경우"에만 걸어요(짧게).

import {
  loadFullScreenAd,
  showFullScreenAd,
} from "@apps-in-toss/web-framework";

export type FullScreenResult =
  | "rewarded" // 보상 획득 (userEarnedReward)
  | "dismissed" // 사용자가 닫음 (보상 없음)
  | "unsupported" // 환경 미지원
  | "failed"; // 로드/표시 실패

// 로드 시작조차 안 될 때만 적용하는 짧은 대기(ms).
// 광고가 뜨기 시작하면 이 타이머는 해제돼서 긴 광고도 안 끊겨요.
const LOAD_TIMEOUT_MS = 15000;

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
    let loadTimer: ReturnType<typeof setTimeout> | null = null;
    let cleanupLoad: (() => void) | null = null;
    let cleanupShow: (() => void) | null = null;

    const clearTimer = () => {
      if (loadTimer != null) {
        clearTimeout(loadTimer);
        loadTimer = null;
      }
    };

    const done = (r: FullScreenResult) => {
      if (settled) return;
      settled = true;
      clearTimer();
      try {
        cleanupShow?.();
        cleanupLoad?.();
      } catch {
        /* noop */
      }
      resolve(r);
    };

    // 로드가 아예 시작/완료되지 않는 경우에만 실패 처리.
    loadTimer = setTimeout(() => done("failed"), LOAD_TIMEOUT_MS);

    cleanupLoad = loadFullScreenAd({
      options: { adGroupId },
      onEvent: (event: { type: string }) => {
        if (event.type !== "loaded") return;

        // 로드 완료 → 표시 시작. 이제 사용자가 광고를 보는 단계라
        // 로드 타임아웃은 즉시 해제해요(긴 광고 대비).
        clearTimer();

        cleanupShow = showFullScreenAd({
          options: { adGroupId },
          onEvent: (e: { type: string }) => {
            switch (e.type) {
              case "show":
              case "impression":
                // 광고가 실제 화면에 떴어요. 남아있을 수 있는 타이머 재확인 해제.
                clearTimer();
                break;
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
  });
}

/**
 * 전면광고 표시 (기록 저장 후 등). 성공/실패와 무관하게 곧바로 흐름을 이어가요.
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
 */
export async function showRewarded(
  adGroupId: string,
): Promise<FullScreenResult> {
  return runFullScreenAd(adGroupId);
}
