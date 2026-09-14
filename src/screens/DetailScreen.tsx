import { useMemo, useState } from "react";
import { goBack, navigate } from "../router";
import { deleteRecord, getRecord } from "../storage";
import {
  amountClass,
  amountSign,
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  INVEST_TYPE_EMOJI,
  INVEST_TYPE_LABEL,
  PAY_METHOD_LABEL,
} from "../types";
import { formatDate, formatMoney } from "../utils";

interface Props {
  id: string;
  onToast: (msg: string) => void;
}

export function DetailScreen({ id, onToast }: Props) {
  const record = useMemo(() => getRecord(id), [id]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);

  if (!record) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>기록</h1>
        </div>
        <div className="page-body">
          <div className="card empty">
            <div className="emoji">🗑️</div>
            <div className="msg">삭제되었거나 없는 기록이에요.</div>
          </div>
          <button
            className="btn btn-ghost btn-block"
            style={{ marginTop: 16 }}
            onClick={() => navigate({ name: "home" })}
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  const isGift = record.category === "gift";
  const flowText = isGift
    ? record.flow === "in"
      ? "받았어요"
      : "냈어요"
    : CATEGORY_LABEL[record.category];

  function handleDelete() {
    deleteRecord(record!.id);
    onToast("삭제되었어요");
    goBack();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>
          {CATEGORY_EMOJI[record.category]} {record.name}
        </h1>
        <div className="sub">
          {CATEGORY_LABEL[record.category]}
          {isGift ? ` · ${flowText}` : ""}
        </div>
      </div>

      <div className="page-body">
        {/* 금액 강조 */}
        <div className="card detail-hero">
          <div className="dh-dir">{flowText}</div>
          <div className={`dh-amt amt ${amountClass(record.flow)}`}>
            {amountSign(record.flow)}
            {formatMoney(record.amount)}원
          </div>
        </div>

        {/* 정보 */}
        <div className="card">
          <div className="info-row">
            <span className="k">{isGift ? "이름" : "항목"}</span>
            <span className="v">{record.name}</span>
          </div>
          <div className="info-row">
            <span className="k">종류</span>
            <span className="v">{CATEGORY_LABEL[record.category]}</span>
          </div>
          {isGift && record.reason && (
            <div className="info-row">
              <span className="k">사유</span>
              <span className="v">{record.reason}</span>
            </div>
          )}
          {record.category === "saving" && record.investType && (
            <div className="info-row">
              <span className="k">투자 종류</span>
              <span className="v">
                {INVEST_TYPE_EMOJI[record.investType]}{" "}
                {INVEST_TYPE_LABEL[record.investType]}
              </span>
            </div>
          )}
          {!isGift && record.payMethod && (
            <div className="info-row">
              <span className="k">{record.category === "salary" ? "입금 방법" : "결제방법"}</span>
              <span className="v">{PAY_METHOD_LABEL[record.payMethod]}</span>
            </div>
          )}
          {!isGift && record.payDay ? (
            <div className="info-row">
              <span className="k">매달 {record.category === "salary" ? "입금일" : "결제일"}</span>
              <span className="v">매달 {record.payDay}일</span>
            </div>
          ) : null}
          {!isGift && record.bankName && (
            <div className="info-row">
              <span className="k">은행</span>
              <span className="v">{record.bankName}</span>
            </div>
          )}
          {!isGift && record.accountLast5 && (
            <div className="info-row">
              <span className="k">계좌</span>
              <span className="v">****{record.accountLast5}</span>
            </div>
          )}
          <div className="info-row">
            <span className="k">{isGift ? "날짜" : "시작일"}</span>
            <span className="v">{formatDate(record.date)}</span>
          </div>
          {record.memo && (
            <div className="info-row">
              <span className="k">메모</span>
              <span className="v">{record.memo}</span>
            </div>
          )}
        </div>

        {/* 사진 */}
        {record.photos.length > 0 && (
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-sub)", marginBottom: 10 }}>
              첨부 사진 {record.photos.length}장
            </div>
            <div className="detail-photos">
              {record.photos.map((p) => (
                <img
                  key={p.id}
                  src={p.dataUrl}
                  alt="첨부 사진"
                  onClick={() => setZoomPhoto(p.dataUrl)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 수정/삭제 */}
      <div className="fixed-bottom">
        {confirmDelete ? (
          <div className="row-btns">
            <button
              className="btn btn-ghost"
              onClick={() => setConfirmDelete(false)}
            >
              취소
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              네, 삭제할게요
            </button>
          </div>
        ) : (
          <div className="row-btns">
            <button
              className="btn btn-danger"
              onClick={() => setConfirmDelete(true)}
            >
              삭제
            </button>
            <button
              className="btn btn-navy"
              onClick={() => navigate({ name: "edit", id: record.id })}
            >
              수정
            </button>
          </div>
        )}
      </div>

      {/* 사진 확대 */}
      {zoomPhoto && (
        <div
          onClick={() => setZoomPhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <img
            src={zoomPhoto}
            alt="확대 사진"
            style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12 }}
          />
        </div>
      )}
    </div>
  );
}
