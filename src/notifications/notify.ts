// 푸시 알림 동의 유틸.
//
// ★ 앱인토스 알림 구조:
//   - 앱에서는 Notification.requestAgreement 로 "알림 동의"만 받아요.
//   - 실제 발송(경조사 D-1, 월말 요약 등)은 토스 콘솔의 "스마트발송 템플릿"으로
//     서버에서 예약/발송해요. 앱 코드가 직접 시각을 잡아 푸시를 쏘지 않아요.
//   - templateCode 는 콘솔에서 알림 템플릿을 만들면 발급돼요.
//     대표님이 발급받은 코드로 아래 상수를 교체해 주세요.
//
//   미지원 환경(브라우저/구버전 토스앱)에서는 조용히 무시돼요.

import { Notification } from "@apps-in-toss/web-framework";

// ★ 콘솔에서 알림 템플릿 발급 후 실제 코드로 교체하세요.
//   여러 알림(경조사 D-1 / 월말 요약 / 시즌)을 하나의 동의로 묶어 받는 게 일반적이에요.
export const NOTIFICATION_TEMPLATE_CODE = "gyeongjosa-memo-default";

export type AgreementResult =
  | "newAgreement"
  | "alreadyAgreed"
  | "agreementRejected"
  | "unsupported"
  | "error";

export function isNotificationSupported(): boolean {
  try {
    return Notification?.requestAgreement?.isSupported?.() === true;
  } catch {
    return false;
  }
}

/**
 * 알림 동의 화면을 띄우고 결과를 반환해요.
 * 반드시 사용자의 명시적 액션(버튼 클릭)에서 호출해요.
 */
export function requestNotificationAgreement(
  templateCode: string = NOTIFICATION_TEMPLATE_CODE,
): Promise<AgreementResult> {
  if (!isNotificationSupported()) {
    return Promise.resolve("unsupported");
  }

  return new Promise<AgreementResult>((resolve) => {
    let settled = false;
    const done = (r: AgreementResult) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };

    try {
      const cleanup = Notification.requestAgreement({
        options: { templateCode },
        onEvent: (result: { type: AgreementResult }) => {
          done(result.type);
          // 결과를 받은 뒤 구독 해제
          try {
            cleanup?.();
          } catch {
            /* noop */
          }
        },
        onError: () => done("error"),
      });
    } catch {
      done("error");
    }
  });
}
