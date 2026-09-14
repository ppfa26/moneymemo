import type { Record } from "../types";
import {
  amountClass,
  amountSign,
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  INVEST_TYPE_LABEL,
  PAY_METHOD_LABEL,
} from "../types";
import { formatDate, formatMoney } from "../utils";

interface Props {
  record: Record;
  onClick: (id: string) => void;
}

export function RecordItem({ record, onClick }: Props) {
  const emoji = CATEGORY_EMOJI[record.category];

  // 부제(메타) 텍스트
  let meta: string;
  if (record.category === "gift") {
    meta = `${record.reason ?? ""} · ${formatDate(record.date)}`;
  } else if (record.category === "saving" && record.investType) {
    const pm = record.payDay
      ? ` · 매달 ${record.payDay}일`
      : "";
    meta = `${INVEST_TYPE_LABEL[record.investType]}${pm}`;
  } else if (record.payDay) {
    meta = `${record.payMethod ? PAY_METHOD_LABEL[record.payMethod] : ""} · 매달 ${record.payDay}일`;
  } else {
    meta = formatDate(record.date);
  }

  // 우측 라벨 (카테고리명 or 받음/냄)
  const rightLabel =
    record.category === "gift"
      ? record.flow === "in"
        ? "받음"
        : "냄"
      : CATEGORY_LABEL[record.category];

  return (
    <button className="record-item" onClick={() => onClick(record.id)}>
      <div className="record-emoji">{emoji}</div>
      <div className="record-main">
        <div className="name">{record.name}</div>
        <div className="meta">{meta}</div>
      </div>
      <div className="record-amount">
        <div className={`amt ${amountClass(record.flow)}`}>
          {amountSign(record.flow)}
          {formatMoney(record.amount)}
        </div>
        <div className="dir">{rightLabel}</div>
      </div>
    </button>
  );
}
