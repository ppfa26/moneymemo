// 머니메모 - 공통 타입 정의
// 통합형: '고정지출' 탭과 '경조사비' 탭 두 종류의 기록을 다뤄요.

/** 기록 종류(=홈 상단 탭). expense=고정지출, gift=경조사비 */
export type Kind = "expense" | "gift";

/** 돈의 방향(부호)
 *  - out: 나가는 돈(-)  (고정지출의 '지출', 경조사비의 '냄')
 *  - in : 들어오는/모이는 돈(+) (고정지출의 '저축·투자', 경조사비의 '받음')
 */
export type Flow = "out" | "in";

/** 고정지출 결제방법 */
export type PayMethod = "card" | "transfer" | "auto" | "cash" | "etc";

/** 사진 첨부 (base64 data URL로 로컬 저장) */
export interface PhotoAttachment {
  id: string;
  dataUrl: string; // data:image/...;base64,...
}

/** 공통 필드 */
interface BaseRecord {
  id: string;
  kind: Kind;
  flow: Flow;
  name: string; // 항목/상대 이름
  amount: number; // 원 단위
  date: string; // ISO yyyy-mm-dd (고정지출=결제일 기준일, 경조사비=날짜)
  memo?: string;
  photos: PhotoAttachment[];
  createdAt: number;
  updatedAt: number;
}

/** 고정지출 기록: 이름 / 결제방법 / 결제일 / 금액 */
export interface ExpenseRecord extends BaseRecord {
  kind: "expense";
  payMethod: PayMethod;
  payDay: number; // 매달 결제일 (1~31)
}

/** 경조사비 기록: 이름 / 사유 / 날짜 / 금액 */
export interface GiftRecord extends BaseRecord {
  kind: "gift";
  reason: string; // 사유 (예: 결혼, 돌잔치, 장례 ... 자유 입력)
}

/** 통합 기록 타입 */
export type Record = ExpenseRecord | GiftRecord;

// ---- 라벨 매핑 (UI 표시용) ----

// TS 내장 Record와 이름 충돌을 피하기 위한 헬퍼 별칭
type LabelMap<K extends string> = { [P in K]: string };

export const KIND_LABEL: LabelMap<Kind> = {
  expense: "고정지출",
  gift: "경조사비",
};

export const PAY_METHOD_LABEL: LabelMap<PayMethod> = {
  card: "카드",
  transfer: "계좌이체",
  auto: "자동이체",
  cash: "현금",
  etc: "기타",
};

/** flow 라벨은 kind에 따라 문구가 달라요 */
export function flowLabel(kind: Kind, flow: Flow): string {
  if (kind === "expense") return flow === "out" ? "지출" : "저축·투자";
  return flow === "out" ? "냈어요" : "받았어요";
}

/** 목록/요약에서 쓰는 짧은 라벨 */
export function flowShort(kind: Kind, flow: Flow): string {
  if (kind === "expense") return flow === "out" ? "지출" : "저축·투자";
  return flow === "out" ? "냄" : "받음";
}
