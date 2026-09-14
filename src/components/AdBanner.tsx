// 배너 광고 슬롯 컴포넌트 (앱인토스 공식 문서 기준).
// 문서: /documentation/common/monetization/iaa/web-banner
//
// ★ 토스앱: TossAds.attachBanner 로 실제 배너를 부착. SDK 기본 스타일(표준 컴포넌트) 사용.
//   - 정책상 광고 색상/글꼴/문구를 임의로 바꾸면 안 되므로, SDK 프리셋(theme/tone/variant)만 사용.
//   - 컨테이너는 width:100%, 고정형 height:96px (문서 권장).
//   - 배너 refresh는 SDK가 자동 처리(우리가 인위적 refresh 하지 않음 → 정책 준수).
//   - 언마운트 시 destroy() 호출로 메모리 누수 방지.
// ★ 미리보기(브라우저): 실제 광고가 안 뜨므로 위치 예상용 플레이스홀더 표시.
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
    const handle = attachBanner(adGroupId, ref.current, {
      theme: "auto", // 시스템 다크모드에 따라 자동 전환
      tone: "blackAndWhite",
      variant: "expanded", // 전체 너비 확장 형태
    });
    return () => {
      // 언마운트 시 배너 제거 (메모리 누수 방지)
      handle?.destroy?.();
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

  // 실제 배너: 문서 권장 컨테이너(width:100%, 고정형 height:96px)
  return (
    <div className="ad-banner">
      <div ref={ref} style={{ width: "100%", height: "96px" }} />
    </div>
  );
}
