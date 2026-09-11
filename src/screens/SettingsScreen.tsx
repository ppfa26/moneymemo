import { navigate } from "../router";

interface Props {
  onToast: (msg: string) => void;
}

export function SettingsScreen(_props: Props) {
  return (
    <div className="page">
      <div className="page-header">
        <h1>설정</h1>
        <div className="sub">앱 정보를 확인해요</div>
      </div>

      <div className="page-body">
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
            onClick={() => navigate({ name: "terms" })}
          >
            <span className="k">이용약관</span>
            <span className="v arrow">›</span>
          </button>
          <button
            className="info-row link-row"
            onClick={() => navigate({ name: "privacy" })}
          >
            <span className="k">개인정보처리방침</span>
            <span className="v arrow">›</span>
          </button>
        </div>
      </div>
    </div>
  );
}
