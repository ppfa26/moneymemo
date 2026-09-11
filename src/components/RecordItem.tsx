import type { Record } from "../types";
import { PAY_METHOD_LABEL } from "../types";
import { formatDate, formatMoney } from "../utils";

interface Props {
  record: Record;
  onClick: (id: string) => void;
}

export function RecordItem({ record, onClick }: Props) {
  const isExpense = record.kind === "expense";
  const emoji = isExpense
    ? record.flow === "in"
      ? "💰"
      : "💳"
    : record.flow === "in"
      ? "🎁"
      : "💸";

  // 부제(메타) 텍스트
  const meta = isExpense
    ? `${PAY_METHOD_LABEL[record.payMethod]} · 매달 ${record.payDay}일`
    : `${record.reason} · ${formatDate(record.date)}`;

  // 부호: in=+, out=-  (요약과 일관)
  const sign = record.flow === "in" ? "+" : "-";
  const amtClass = record.flow === "in" ? "received" : "given";
  const dirLabel = isExpense
    ? record.flow === "in"
      ? "저축·투자"
      : "지출"
    : record.flow === "in"
      ? "받음"
      : "냄";

  return (
    <button className="record-item" onClick={() => onClick(record.id)}>
      <div className="record-emoji">{emoji}</div>
      <div className="record-main">
        <div className="name">{record.name}</div>
        <div className="meta">{meta}</div>
      </div>
      <div className="record-amount">
        <div className={`amt ${amtClass}`}>
          {sign}
          {formatMoney(record.amount)}
        </div>
        <div className="dir">{dirLabel}</div>
      </div>
    </button>
  );
}
