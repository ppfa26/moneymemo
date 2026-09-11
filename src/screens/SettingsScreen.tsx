import { useState } from "react";
// ★ 심사 규칙: openURL은 static import + 클릭 핸들러에서 "동기" 호출.
//   dynamic import()는 제스처 컨텍스트가 끊겨 반려돼요.
import { openURL } from "@apps-in-toss/web-framework";
import { loadMeta, setNotificationAgreed } from "../storage";
import { requestNotificationAgreement } from "../notifications/notify";

interface Props {
  onToast: (msg: string) => void;
}

export function SettingsScreen({ onToast }: Props) {
  const [agreed, setAgreed] = useState<boolean>(
    () => loadMeta().notificationAgreed,
  );
  const [busy, setBusy] = useState(false);

  async function handleToggleNotification() {
    if (busy) return;

    // 이미 켜져 있으면: 토스 알림 설정은 시스템/토스 설정에서 관리하므로
    // 앱 내에서는 안내만 하고 표시 상태만 꺼요.
    if (agreed) {
      setNotificationAgreed(false);
      setAgreed(false);
      onToast("알림을 껐어요");
      return;
    }

    setBusy(true);
    const result = await requestNotificationAgreement();
    setBusy(false);

    switch (result) {
      case "newAgreement":
      case "alreadyAgreed":
        setNotificationAgreed(true);
        setAgreed(true);
        onToast("알림을 켰어요 🔔");
        break;
      case "agreementRejected":
        onToast("알림 권한이 필요해요");
        break;
      case "unsupported":
        onToast("토스앱에서 알림을 켤 수 있어요");
        break;
      default:
        onToast("잠시 후 다시 시도해 주세요");
    }
  }

  function handleOpenTerms() {
    // 동기 호출 (Promise는 그냥 흘려보냄)
    void openURL("https://toss.im/policy");
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>설정</h1>
        <div className="sub">알림과 앱 정보를 확인해요</div>
      </div>

      <div className="page-body">
        {/* 알림 */}
        <div className="section-title">
          <h2>알림</h2>
        </div>
        <div className="card">
          <div className="setting-row">
            <div className="setting-text">
              <div className="st-title">경조사 알림 받기</div>
              <div className="st-sub">
                경조사 하루 전, 월말 요약을 알려드려요
              </div>
            </div>
            <button
              className={`switch ${agreed ? "on" : ""}`}
              onClick={handleToggleNotification}
              disabled={busy}
              aria-label="알림 토글"
            >
              <span className="knob" />
            </button>
          </div>
        </div>

        {/* 앱 정보 */}
        <div className="section-title">
          <h2>앱 정보</h2>
        </div>
        <div className="card">
          <div className="info-row">
            <span className="k">버전</span>
            <span className="v">1.0.0</span>
          </div>
          <button
            className="info-row link-row"
            onClick={handleOpenTerms}
          >
            <span className="k">이용약관 · 개인정보</span>
            <span className="v arrow">›</span>
          </button>
        </div>
      </div>
    </div>
  );
}
