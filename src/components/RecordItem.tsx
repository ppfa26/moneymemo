import type { Record } from "../types";
import {
  DIRECTION_LABEL,
  EVENT_EMOJI,
  EVENT_LABEL,
  RELATION_LABEL,
} from "../types";
import { formatDate, formatMoney } from "../utils";

interface Props {
  record: Record;
  onClick: (id: string) => void;
}

export function RecordItem({ record, onClick }: Props) {
  return (
    <button className="record-item" onClick={() => onClick(record.id)}>
      <div className="record-emoji">{EVENT_EMOJI[record.eventType]}</div>
      <div className="record-main">
        <div className="name">{record.name}</div>
        <div className="meta">
          {RELATION_LABEL[record.relation]} · {EVENT_LABEL[record.eventType]} ·{" "}
          {formatDate(record.date)}
        </div>
      </div>
      <div className="record-amount">
        <div className={`amt ${record.direction}`}>
          {record.direction === "given" ? "-" : "+"}
          {formatMoney(record.amount)}
        </div>
        <div className="dir">{DIRECTION_LABEL[record.direction]}</div>
      </div>
    </button>
  );
}
