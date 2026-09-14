// 배너 광고 슬롯 컴포넌트.
//
// ★ 토스앱: 실제 배너 광고를 attach 해서 노출해요.
// ★ 미리보기(브라우저/심사 초기): 실제 광고가 안 뜨는 대신
//   "여기에 배너 광고가 나와요" 플레이스홀더를 보여줘서
//   대표님/검수자가 광고 위치를 예상할 수 있게 해요.
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

  // 미지원 환경(미리보기/브라우저): 광고 위치를 예상할 수 있는 플레이스홀더
  if (!isSupported) {
    return (
      <div className="ad-banner ad-placeholder" aria-hidden="true">
        <span className="ad-ph-badge">AD</span>
        <span className="ad-ph-text">배너 광고 자리 · 앱에서 실제 광고가 나와요</span>
      </div>
    );
  }

  return (
    <div className="ad-banner">
      <div ref={ref} style={{ width: "100%" }} />
    </div>
  );
}
