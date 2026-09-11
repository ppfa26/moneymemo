import { navigate } from "../router";

type Kind = "terms" | "privacy";

interface Props {
  kind: Kind;
}

export function LegalScreen({ kind }: Props) {
  const isTerms = kind === "terms";
  return (
    <div className="page">
      <div className="page-header">
        <h1>{isTerms ? "이용약관" : "개인정보처리방침"}</h1>
        <div className="sub">머니메모 · 최종 업데이트 2026.01</div>
      </div>

      <div className="page-body">
        <div className="card legal-card">
          {isTerms ? <TermsContent /> : <PrivacyContent />}
        </div>

        <button
          className="btn btn-ghost btn-block"
          style={{ marginTop: 16 }}
          onClick={() => navigate({ name: "settings" })}
        >
          설정으로 돌아가기
        </button>
      </div>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="legal">
      <h3>제1조 (목적)</h3>
      <p>
        본 약관은 &lsquo;머니메모&rsquo;(이하 &lsquo;앱&rsquo;)를 이용함에 있어
        이용자와 앱 사이의 권리·의무 및 책임 사항을 규정함을 목적으로 해요.
      </p>

      <h3>제2조 (서비스 내용)</h3>
      <p>
        머니메모는 고정지출과 경조사비 내역을 이용자의 기기에 직접 기록하고,
        월별·연도별로 조회하며, 엑셀·PDF로 내보낼 수 있는 개인용 가계 메모
        서비스예요.
      </p>

      <h3>제3조 (요금)</h3>
      <p>
        모든 기능은 무료로 제공돼요. 서비스 운영을 위해 앱 화면에 광고가 표시될
        수 있어요.
      </p>

      <h3>제4조 (데이터 저장·책임)</h3>
      <p>
        모든 기록은 이용자의 기기(브라우저 저장소)에만 저장되며, 앱은 이용자의
        기록을 서버로 전송하거나 수집하지 않아요. 기기 변경·앱 삭제·저장소
        초기화 시 데이터가 사라질 수 있으므로, 중요한 내역은 엑셀·PDF로
        내보내어 별도 보관하시길 권장해요.
      </p>

      <h3>제5조 (금지 행위)</h3>
      <p>
        이용자는 앱을 불법적인 목적이나 서비스 운영을 방해하는 방식으로 이용할
        수 없어요.
      </p>

      <h3>제6조 (면책)</h3>
      <p>
        앱은 이용자가 입력한 데이터의 정확성·손실에 대해 책임지지 않으며, 천재
        지변·기기 오류 등 불가항력으로 인한 데이터 손실에 책임을 지지 않아요.
      </p>

      <h3>제7조 (약관 변경)</h3>
      <p>
        약관이 변경될 경우 앱 내 공지를 통해 안내하며, 변경된 약관은 공지한
        시점부터 효력이 발생해요.
      </p>

      <p className="legal-foot">문의: 앱 설정 &gt; 앱 정보</p>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="legal">
      <h3>1. 수집하는 개인정보</h3>
      <p>
        머니메모는 회원가입 없이 사용하는 앱으로, <b>이름·이메일 등 개인정보를
        서버에서 수집하지 않아요.</b> 이용자가 입력하는 기록(항목명, 금액, 날짜,
        메모, 사진 등)은 오직 이용자의 기기에만 저장돼요.
      </p>

      <h3>2. 개인정보의 저장 위치</h3>
      <p>
        모든 데이터는 이용자 기기의 로컬 저장소(브라우저 localStorage)에
        저장돼요. 앱 운영자를 포함한 제3자는 이 데이터에 접근할 수 없어요.
      </p>

      <h3>3. 제3자 제공 및 처리 위탁</h3>
      <p>
        이용자의 기록을 외부에 제공하거나 위탁하지 않아요.
      </p>

      <h3>4. 광고</h3>
      <p>
        서비스 운영을 위해 토스가 제공하는 광고가 표시될 수 있으며, 광고 노출·
        보상 처리는 토스의 광고 정책 및 개인정보 처리방침을 따라요.
      </p>

      <h3>5. 알림</h3>
      <p>
        이용자가 원하는 경우에만 토스 알림 동의를 통해 알림을 받을 수 있으며,
        언제든지 토스 설정에서 해제할 수 있어요.
      </p>

      <h3>6. 데이터 삭제</h3>
      <p>
        각 기록은 앱 내에서 직접 삭제할 수 있고, 앱을 삭제하면 기기에 저장된
        모든 데이터가 함께 삭제돼요.
      </p>

      <h3>7. 문의</h3>
      <p>개인정보 관련 문의는 앱 설정 &gt; 앱 정보를 통해 접수할 수 있어요.</p>

      <p className="legal-foot">시행일: 2026년 1월 1일</p>
    </div>
  );
}
