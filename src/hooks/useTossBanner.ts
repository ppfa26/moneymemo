// 토스 배너 광고 SDK 초기화 훅 (앱인토스 공식 문서 기준).
// 문서: /documentation/common/monetization/iaa/web-banner
//
// - TossAds.initialize 는 앱 전체에서 1회만 (중복 방지 위해 shared promise).
// - attachBanner 는 options(theme/tone/variant, callbacks)를 그대로 전달.
// - 배너는 SDK가 자동 refresh(10초+visibility) 하므로 우리가 인위적 refresh 하지 않아요(정책 준수).

import { TossAds } from "@apps-in-toss/web-framework";
import type { TossAdsAttachBannerOptions } from "@apps-in-toss/web-framework";
import { useCallback, useEffect, useState } from "react";

type BannerStatus = "idle" | "initializing" | "ready" | "unsupported" | "error";

let sharedInitializePromise: Promise<void> | null = null;

function initializeOnce(): Promise<void> {
  if (sharedInitializePromise != null) return sharedInitializePromise;

  sharedInitializePromise = new Promise<void>((resolve, reject) => {
    TossAds.initialize({
      callbacks: {
        onInitialized: () => resolve(),
        onInitializationFailed: (error: unknown) =>
          reject(error instanceof Error ? error : new Error(String(error))),
      },
    });
  });

  return sharedInitializePromise;
}

export function useTossBanner() {
  const [status, setStatus] = useState<BannerStatus>("idle");
  const isSupported =
    TossAds.initialize.isSupported() && TossAds.attachBanner.isSupported();

  useEffect(() => {
    if (!isSupported) {
      setStatus("unsupported");
      return;
    }
    setStatus("initializing");
    initializeOnce()
      .then(() => setStatus("ready"))
      .catch(() => setStatus("error"));
  }, [isSupported]);

  const attachBanner = useCallback(
    (
      adGroupId: string,
      element: HTMLElement,
      options?: TossAdsAttachBannerOptions,
    ) => {
      if (status !== "ready") return undefined;
      return TossAds.attachBanner(adGroupId, element, options);
    },
    [status],
  );

  return { status, isReady: status === "ready", isSupported, attachBanner };
}
