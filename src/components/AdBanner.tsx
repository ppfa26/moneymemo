// 배너 광고 슬롯 컴포넌트.
// 토스앱이 아닌 환경(브라우저/심사 초기)에서는 조용히 아무것도 안 그려요.
// ★ 기록 입력/사진 첨부 화면에는 절대 넣지 않아요 (이탈 방지).

import { useEffect, useRef } from "react";
import { useTossBanner } from "../hooks/useTossBanner";
import { AD_GROUP_IDS } from "../ads/adConfig";

export function AdBanner() {
  const { isReady, isSupported, attachBanner } = useTossBanner();
  const ref = useRef<HTMLDivElement>(null);

  const adGroupId = AD_GROUP_IDS.bannerHome;

  useEffect(() => {
    if (!isReady || ref.current == null) return;
    const handle = attachBanner(adGroupId, ref.current);
    return () => {
      // attachBanner가 반환하는 정리 함수가 있으면 호출
      if (handle && typeof (handle as { destroy?: () => void }).destroy === "function") {
        (handle as { destroy: () => void }).destroy();
      }
    };
  }, [isReady, adGroupId, attachBanner]);

  // 미지원 환경에서는 렌더링 자체를 생략 (빈 공간/오해 방지)
  if (!isSupported) return null;

  return (
    <div className="ad-banner">
      <div ref={ref} style={{ width: "100%" }} />
    </div>
  );
}
