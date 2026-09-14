// 머니메모 - 공통 타입 정의
// 통합형 가계 관리: 급여(수입) 기준으로 고정지출·경조사비·저축을 빼서
// '남은 돈'을 자동 계산해요. 모든 기록은 하나의 목록에 category로 구분돼요.

/** 기록 카테고리 */
export type Category = "salary" | "expense" | "gift" | "saving";

/** 돈의 방향(부호)
 *  - in : 들어오는 돈(+)  (급여, 경조사비 받음)
 *  - out: 나가는 돈(-)     (고정지출, 경조사비 냄)
 *  - save: 모으는 돈(저축·투자) — 남은 돈 계산에서는 빠지지만 '소비'는 아님
 */
export type Flow = "in" | "out" | "save";

/** 고정지출/급여 결제·입금 방법 */
export type PayMethod = "card" | "transfer" | "auto" | "cash" | "etc";

/** 저축·투자 종류 */
export type InvestType = "deposit" | "stock" | "realestate" | "coin" | "etc";

/** 사진 첨부 (base64 data URL로 로컬 저장) */
export interface PhotoAttachment {
  id: string;
  dataUrl: string;
}

/** 통합 기록 1건 */
export interface Record {
  id: string;
  category: Category;
  flow: Flow;
  name: string; // 항목/상대 이름
  amount: number; // 원 단위
  date: string; // ISO yyyy-mm-dd
  /** 고정지출/급여: 결제방법 */
  payMethod?: PayMethod;
  /** 고정지출/급여: 매달 결제일(1~31) */
  payDay?: number;
  /** 자동이체/계좌이체: 은행명 */
  bankName?: string;
  /** 자동이체/계좌이체: 계좌번호 뒷 5자리 (전체번호는 저장 안 함 - 개인정보 최소화) */
  accountLast5?: string;
  /** 저축·투자: 종류 (예금/주식/부동산/코인 등) */
  investType?: InvestType;
  /** 경조사비: 사유 */
  reason?: string;
  memo?: string;
  photos: PhotoAttachment[];
  createdAt: number;
  updatedAt: number;
}

// ---- 카테고리별 기본 성격 ----

/** 카테고리를 고르면 기본 flow가 정해져요 (경조사비만 in/out 선택) */
export const CATEGORY_DEFAULT_FLOW: { [K in Category]: Flow } = {
  salary: "in",
  expense: "out",
  gift: "out",
  saving: "save",
};

// ---- 라벨/이모지 매핑 ----

type LabelMap<K extends string> = { [P in K]: string };

export const CATEGORY_LABEL: LabelMap<Category> = {
  salary: "급여",
  expense: "고정지출",
  gift: "경조사비",
  saving: "저축·투자",
};

export const CATEGORY_EMOJI: LabelMap<Category> = {
  salary: "💰",
  expense: "💳",
  gift: "🎁",
  saving: "🏦",
};

export const PAY_METHOD_LABEL: LabelMap<PayMethod> = {
  card: "카드",
  transfer: "계좌이체",
  auto: "자동이체",
  cash: "현금",
  etc: "기타",
};

export const INVEST_TYPE_LABEL: LabelMap<InvestType> = {
  deposit: "예금·적금",
  stock: "주식",
  realestate: "부동산",
  coin: "코인",
  etc: "기타",
};

export const INVEST_TYPE_EMOJI: LabelMap<InvestType> = {
  deposit: "💵",
  stock: "📈",
  realestate: "🏠",
  coin: "🪙",
  etc: "📦",
};

/** 금액 표시 부호 (+/-) */
export function amountSign(flow: Flow): "+" | "-" {
  return flow === "in" ? "+" : "-";
}

/** 금액 색상 클래스 */
export function amountClass(flow: Flow): "received" | "given" | "saving" {
  if (flow === "in") return "received";
  if (flow === "save") return "saving";
  return "given";
}
