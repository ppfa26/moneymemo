// 경조사비 메모장 - 공통 타입 정의

/** 돈의 방향: 받음(내가 받음) / 줌(내가 냄) */
export type Direction = "received" | "given";

/** 상대와의 관계 */
export type Relation = "friend" | "work" | "family" | "etc";

/** 경조사 종류 */
export type EventType = "wedding" | "funeral" | "firstbirthday" | "etc";

/** 사진 첨부 (base64 data URL로 로컬 저장) */
export interface PhotoAttachment {
  id: string;
  dataUrl: string; // data:image/...;base64,...
}

/** 경조사비 기록 1건 */
export interface Record {
  id: string;
  direction: Direction;
  name: string;
  relation: Relation;
  eventType: EventType;
  amount: number; // 원 단위
  date: string; // ISO yyyy-mm-dd
  memo?: string;
  photos: PhotoAttachment[];
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

// ---- 라벨 매핑 (UI 표시용) ----

export const DIRECTION_LABEL: Record2<Direction> = {
  received: "받음",
  given: "줌",
};

export const RELATION_LABEL: Record2<Relation> = {
  friend: "친구",
  work: "직장",
  family: "친척",
  etc: "기타",
};

export const EVENT_LABEL: Record2<EventType> = {
  wedding: "결혼",
  funeral: "장례",
  firstbirthday: "돌잔치",
  etc: "기타",
};

export const EVENT_EMOJI: Record2<EventType> = {
  wedding: "💍",
  funeral: "🕊️",
  firstbirthday: "🎂",
  etc: "🎁",
};

// TS 내장 Record와 이름 충돌을 피하기 위한 헬퍼 별칭
type Record2<K extends string> = { [P in K]: string };
