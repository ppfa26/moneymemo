import { useMemo, useState } from "react";
import { goBack, navigate } from "../router";
import { getRecord, upsertRecord } from "../storage";
import type {
  Category,
  Flow,
  PayMethod,
  PhotoAttachment,
  Record,
} from "../types";
import {
  CATEGORY_DEFAULT_FLOW,
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  PAY_METHOD_LABEL,
} from "../types";
import { formatMoney, todayISO, uid } from "../utils";
import { PhotoAttach } from "../components/PhotoAttach";

const CATEGORIES: Category[] = ["salary", "expense", "gift", "saving"];
const PAY_METHODS: PayMethod[] = ["card", "transfer", "auto", "cash", "etc"];
const AMOUNT_CHIPS = [10000, 50000, 100000, 500000, 1000000];
const REASON_CHIPS = ["결혼", "장례", "돌잔치", "생일", "출산", "개업"];

interface Props {
  category?: Category;
  editId?: string;
  onToast: (msg: string) => void;
}

export function AddEditScreen({ category: catProp, editId, onToast }: Props) {
  const existing = useMemo(
    () => (editId ? getRecord(editId) : undefined),
    [editId],
  );
  const isEdit = existing != null;

  const [category, setCategory] = useState<Category>(
    existing?.category ?? catProp ?? "expense",
  );
  // 경조사비만 받음/냄 선택. 나머지는 카테고리 기본 flow.
  const [giftFlow, setGiftFlow] = useState<Flow>(
    existing?.category === "gift" ? existing.flow : "out",
  );

  const [name, setName] = useState(existing?.name ?? "");
  const [amount, setAmount] = useState<string>(
    existing ? String(existing.amount) : "",
  );
  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [memo, setMemo] = useState(existing?.memo ?? "");
  const [photos, setPhotos] = useState<PhotoAttachment[]>(
    existing?.photos ?? [],
  );
  const [payMethod, setPayMethod] = useState<PayMethod>(
    existing?.payMethod ?? "card",
  );
  const [payDay, setPayDay] = useState<number>(
    existing?.payDay ?? Number(todayISO().slice(8, 10)),
  );
  const [bankName, setBankName] = useState(existing?.bankName ?? "");
  const [accountLast5, setAccountLast5] = useState(existing?.accountLast5 ?? "");
  const [reason, setReason] = useState(existing?.reason ?? "");

  const [saving, setSaving] = useState(false);

  const amountNum = Number(amount.replace(/[^0-9]/g, "")) || 0;
  const isExpenseLike = category === "expense" || category === "saving";
  const isGift = category === "gift";
  // 자동이체/계좌이체면 은행·계좌 입력란을 보여줘요
  const needsBank =
    !isGift && (payMethod === "auto" || payMethod === "transfer");
  const canSave =
    name.trim().length > 0 &&
    amountNum > 0 &&
    (isGift ? reason.trim().length > 0 : true);

  function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);

    const flow: Flow = isGift ? giftFlow : CATEGORY_DEFAULT_FLOW[category];
    const now = Date.now();
    const record: Record = {
      id: existing?.id ?? uid(),
      category,
      flow,
      name: name.trim(),
      amount: amountNum,
      date,
      memo: memo.trim() || undefined,
      photos,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      ...(isExpenseLike || category === "salary"
        ? { payMethod, payDay }
        : {}),
      ...(needsBank
        ? {
            bankName: bankName.trim() || undefined,
            accountLast5: accountLast5.trim() || undefined,
          }
        : {}),
      ...(isGift ? { reason: reason.trim() } : {}),
    };

    upsertRecord(record);
    onToast(isEdit ? "수정했어요" : "저장했어요");

    if (isEdit) goBack();
    else navigate({ name: "detail", id: record.id });
  }

  // 이름 placeholder (카테고리별)
  const namePlaceholder =
    category === "salary"
      ? "예: 월급, 부수입"
      : category === "expense"
        ? "예: 넷플릭스, 월세, 통신비"
        : category === "saving"
          ? "예: 청년적금, 주식 적립"
          : "이름을 입력해요 (예: 김철수)";

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEdit ? "기록 수정" : "새 기록 추가"}</h1>
        <div className="sub">항목을 골라 · 얼마를 남겨요</div>
      </div>

      <div className="page-body">
        {/* 카테고리 선택 */}
        <div className="field">
          <label>어떤 종류예요?</label>
          <div className="cat-grid">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`cat-btn ${category === c ? "active" : ""}`}
                onClick={() => setCategory(c)}
              >
                <span className="cat-emoji">{CATEGORY_EMOJI[c]}</span>
                <span className="cat-label">{CATEGORY_LABEL[c]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 경조사비: 받음/냄 */}
        {isGift && (
          <div className="field">
            <label>받았나요, 냈나요?</label>
            <div className="segment two">
              {(["in", "out"] as Flow[]).map((f) => (
                <button
                  key={f}
                  className={`seg ${giftFlow === f ? `active dir-${f === "in" ? "received" : "given"}` : ""}`}
                  onClick={() => setGiftFlow(f)}
                >
                  {f === "in" ? "🎁 받았어요" : "💸 냈어요"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 이름 */}
        <div className="field">
          <label>{isGift ? "누구인가요?" : "무슨 항목인가요?"}</label>
          <input
            className="text-input"
            placeholder={namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* 급여/고정지출/저축: 결제·입금 방법 + 매달 날짜 */}
        {!isGift && (
          <>
            <div className="field">
              <label>{category === "salary" ? "입금 방법" : "결제방법"}</label>
              <div className="segment">
                {PAY_METHODS.map((p) => (
                  <button
                    key={p}
                    className={`seg ${payMethod === p ? "active" : ""}`}
                    onClick={() => setPayMethod(p)}
                  >
                    {PAY_METHOD_LABEL[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>매달 {category === "salary" ? "입금일" : "결제일"}</label>
              <div className="amount-input">
                <span className="won" style={{ marginRight: 8 }}>매달</span>
                <input
                  inputMode="numeric"
                  placeholder="25"
                  value={payDay ? String(payDay) : ""}
                  onChange={(e) => {
                    const v = Number(e.target.value.replace(/[^0-9]/g, ""));
                    if (!v) return setPayDay(0);
                    setPayDay(Math.min(31, Math.max(1, v)));
                  }}
                  style={{ textAlign: "right" }}
                />
                <span className="won">일</span>
              </div>
            </div>

            {/* 자동이체/계좌이체: 은행 + 계좌 뒷5자리 */}
            {needsBank && (
              <div className="field">
                <label>어느 계좌인가요? (선택)</label>
                <input
                  className="text-input"
                  placeholder="은행명 (예: 토스뱅크, 국민은행)"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
                <div className="amount-input" style={{ marginTop: 8 }}>
                  <span className="won" style={{ marginRight: 8 }}>계좌 뒷자리</span>
                  <input
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="12345"
                    value={accountLast5}
                    onChange={(e) =>
                      setAccountLast5(
                        e.target.value.replace(/[^0-9]/g, "").slice(0, 5),
                      )
                    }
                    style={{ textAlign: "right", letterSpacing: "2px" }}
                  />
                  <span className="won">뒷 5자리</span>
                </div>
                <p className="field-hint">
                  안전을 위해 계좌번호는 <b>뒷 5자리만</b> 저장돼요. 전체 번호는
                  저장하지 않아요.
                </p>
              </div>
            )}
          </>
        )}

        {/* 경조사비: 사유 */}
        {isGift && (
          <div className="field">
            <label>무슨 사유예요?</label>
            <input
              className="text-input"
              placeholder="예: 결혼, 돌잔치, 장례"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="chips">
              {REASON_CHIPS.map((c) => (
                <button key={c} className="chip" onClick={() => setReason(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 금액 */}
        <div className="field">
          <label>얼마인가요?</label>
          <div className="amount-input">
            <input
              inputMode="numeric"
              placeholder="0"
              value={amount ? formatMoney(amountNum) : ""}
              onChange={(e) => setAmount(e.target.value)}
            />
            <span className="won">원</span>
          </div>
          <div className="chips">
            {AMOUNT_CHIPS.map((c) => (
              <button
                key={c}
                className="chip"
                onClick={() => setAmount(String(amountNum + c))}
              >
                +{formatMoney(c)}
              </button>
            ))}
            <button className="chip" onClick={() => setAmount("")}>
              초기화
            </button>
          </div>
        </div>

        {/* 날짜 */}
        <div className="field">
          <label>{isGift ? "언제였나요?" : "시작일"}</label>
          <input
            type="date"
            className="text-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* 사진 */}
        <div className="field">
          <label>사진을 남겨둘까요? (선택)</label>
          <PhotoAttach photos={photos} onChange={setPhotos} onToast={onToast} />
        </div>

        {/* 메모 */}
        <div className="field">
          <label>메모 (선택)</label>
          <textarea
            className="text-input"
            placeholder="기억해두고 싶은 내용을 적어요"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      </div>

      <div className="fixed-bottom">
        <div className="row-btns">
          <button
            className="btn btn-ghost"
            style={{ flex: "0 0 34%" }}
            onClick={() => goBack()}
          >
            취소
          </button>
          <button
            className="btn btn-primary btn-lg"
            style={{ flex: 1 }}
            disabled={!canSave || saving}
            onClick={handleSave}
          >
            {saving ? "저장하고 있어요…" : isEdit ? "수정 완료" : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
