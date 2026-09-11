// 토스 배너 광고 SDK 초기화 훅 (공식 예제 구조 기반)
import { TossAds } from "@apps-in-toss/web-framework";
import { useCallback, useEffect, useState } from "react";

type BannerStatus = "idle" | "initializing" | "ready" | "unsupported" | "error";

let sharedInitializePromise: Promise<void> | null = null;

function initializeOnce(): Promise<void> {
  if (sharedInitializePromise != null) return sharedInitializePromise;

  sharedInitializePromise = new Promise<void>((resolve, reject) => {
    TossAds.initialize({
      callbacks: {
        onInitialized: () => resolve(),
        onInitializationFailed: (error: unknown) => reject(error),
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
    (adGroupId: string, element: HTMLElement) => {
      if (status !== "ready") return undefined;
      return TossAds.attachBanner(adGroupId, element);
    },
    [status],
  );

  return { status, isReady: status === "ready", isSupported, attachBanner };
}
