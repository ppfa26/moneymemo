// 전면광고/리워드 광고 실행 유틸 (Promise 기반).
//
// ★ 심사 핵심 원칙:
//   - 리워드 광고 뒤에 기능을 "가두지" 않아요. 광고가 실패/미지원/닫힘이면
//     기능을 그대로 열어줘요. (심사 환경은 광고가 안 뜨는 경우가 많음)
//   - 리워드는 반드시 userEarnedReward 이벤트에서만 "정식 지급"으로 간주.
//   - 앱인토스 제공 광고 SDK만 사용.
//
// ★ 긴 플레이형(게임형) 광고 대응 (대표님 요청):
//   - 광고는 load → show 두 단계인데, 어떤 단계든 "진행 신호"가 오면
//     타임아웃을 완전히 해제해요. → 몇 분짜리 게임을 끝까지 체험해도
//     절대 중간에 안 끊겨요.
//   - 타임아웃은 오직 "아무 신호도 없이 멈춘 경우"에만 걸어요.
//     한 번이라도 이벤트가 오면 '살아있는 광고'로 보고 무기한 대기.
//
// ★ 미리보기(브라우저): 실제 SDK가 없으니 짧은 안내 오버레이로
//   "여기서 광고가 재생돼요"를 예상할 수 있게 시뮬레이션해요.

import {
  loadFullScreenAd,
  showFullScreenAd,
} from "@apps-in-toss/web-framework";

export type FullScreenResult =
  | "rewarded" // 보상 획득 (userEarnedReward)
  | "dismissed" // 사용자가 닫음 (보상 없음)
  | "unsupported" // 환경 미지원
  | "failed"; // 로드/표시 실패

// "아무 신호도 없이 멈춘 경우"에만 적용하는 무응답 타임아웃(ms).
// 이벤트가 한 번이라도 오면 이 타이머는 해제돼서 긴 광고도 절대 안 끊겨요.
const IDLE_TIMEOUT_MS = 20000;

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
    // 미리보기(브라우저): 짧은 안내 오버레이로 시뮬레이션
    return simulateAdForPreview();
  }

  return new Promise<FullScreenResult>((resolve) => {
    let settled = false;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let cleanupLoad: (() => void) | null = null;
    let cleanupShow: (() => void) | null = null;

    const clearIdle = () => {
      if (idleTimer != null) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
    };

    // ★ 무응답 감시: 신호가 올 때마다 타이머를 리셋해요.
    //   "로드 중 → 게임 플레이 중" 어떤 단계든 이벤트가 오면 계속 살아있게 유지.
    //   showStarted(광고가 실제로 화면에 뜬 뒤)에는 아예 감시를 끔 → 무기한 체험 가능.
    let showStarted = false;
    const kickIdle = () => {
      if (showStarted) return; // 광고 재생 시작 후엔 타임아웃 없음(긴 게임 대비)
      clearIdle();
      idleTimer = setTimeout(() => done("failed"), IDLE_TIMEOUT_MS);
    };

    const done = (r: FullScreenResult) => {
      if (settled) return;
      settled = true;
      clearIdle();
      try {
        cleanupShow?.();
        cleanupLoad?.();
      } catch {
        /* noop */
      }
      resolve(r);
    };

    // 최초 무응답 감시 시작 (로드조차 시작 안 되면 실패 처리)
    kickIdle();

    cleanupLoad = loadFullScreenAd({
      options: { adGroupId },
      onEvent: (event: { type: string }) => {
        // 로드 단계에서 어떤 신호든 오면 살아있는 것 → 타이머 리셋
        kickIdle();

        if (event.type !== "loaded") return;

        // 로드 완료 → 표시 시작.
        cleanupShow = showFullScreenAd({
          options: { adGroupId },
          onEvent: (e: { type: string }) => {
            switch (e.type) {
              case "show":
              case "impression":
                // 광고가 실제 화면에 떴어요 → 이제부터 무기한 대기(긴 게임 OK)
                showStarted = true;
                clearIdle();
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
              default:
                // 그 외 진행 신호도 '살아있음'으로 처리
                kickIdle();
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
 * 미리보기(브라우저) 전용: 실제 광고 대신 짧은 안내 오버레이를 보여줘요.
 * "여기서 광고가 재생되고, 끝나면 기능이 열려요"를 예상할 수 있게 해요.
 * 실제 토스앱에서는 이 함수가 호출되지 않아요(SDK 지원 시 실제 광고 사용).
 */
function simulateAdForPreview(): Promise<FullScreenResult> {
  if (typeof document === "undefined") {
    return Promise.resolve("unsupported");
  }

  return new Promise<FullScreenResult>((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "ad-sim-overlay";
    overlay.innerHTML = `
      <div class="ad-sim-card">
        <div class="ad-sim-badge">AD · 미리보기</div>
        <div class="ad-sim-emoji">🎬</div>
        <div class="ad-sim-title">광고를 보여주는 중이에요</div>
        <div class="ad-sim-desc">실제 앱에서는 여기서 광고(전면·리워드·게임 체험형)가 재생돼요.<br/>광고를 끝까지 보면 이어서 진행돼요.</div>
        <div class="ad-sim-bar"><div class="ad-sim-fill"></div></div>
        <button class="ad-sim-skip" type="button">미리보기 건너뛰기 ›</button>
      </div>
    `;
    document.body.appendChild(overlay);

    let finished = false;
    const finish = (r: FullScreenResult) => {
      if (finished) return;
      finished = true;
      overlay.classList.add("closing");
      setTimeout(() => {
        overlay.remove();
        resolve(r);
      }, 180);
    };

    const skipBtn = overlay.querySelector(".ad-sim-skip");
    skipBtn?.addEventListener("click", () => finish("rewarded"));

    // 자동으로 2.4초 뒤 완료 (진행바 애니메이션과 동기)
    setTimeout(() => finish("rewarded"), 2400);
  });
}

/**
 * 전면광고 표시 (앱 실행 시 등). 성공/실패와 무관하게 곧바로 흐름을 이어가요.
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
