// 토스 SafeArea insets를 CSS 변수(--safe-top / --safe-bottom)로 반영해요.
// 토스앱이 아닌 일반 브라우저(개발/심사 웹뷰 환경)에서는 값이 0이라 자연스럽게 무시돼요.

import { useEffect } from "react";
import { SafeArea } from "@apps-in-toss/web-framework";

export function useSafeArea(): void {
  useEffect(() => {
    try {
      if (SafeArea?.get != null) {
        const insets = SafeArea.get();
        const root = document.documentElement;
        root.style.setProperty("--safe-top", `${insets.top ?? 0}px`);
        root.style.setProperty("--safe-bottom", `${insets.bottom ?? 0}px`);
      }
    } catch {
      // 미지원 환경 - 기본값 0px 유지
    }
  }, []);
}
