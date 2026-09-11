// 사진 첨부 (최대 3장, 광고 없이 간단하게).
//
// ★ 간결화: 예전엔 4장째부터 리워드 광고로 잠금해제했지만,
//   실제로 3장이면 청첩장·부고장·이체내역을 담기 충분해서 3장 고정으로 단순화했어요.
//   사진 첨부 화면엔 어떤 광고도 넣지 않아요(이탈 방지).
//
// 사진은 <input type=file>로 받고 base64 data URL로 로컬 저장해요.

import { useRef } from "react";
import type { PhotoAttachment } from "../types";
import { uid } from "../utils";

const MAX_PHOTOS = 3;

interface Props {
  photos: PhotoAttachment[];
  onChange: (photos: PhotoAttachment[]) => void;
  onToast: (msg: string) => void;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PhotoAttach({ photos, onChange, onToast }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const atLimit = photos.length >= MAX_PHOTOS;

  function handleAddClick() {
    if (atLimit) {
      onToast(`사진은 최대 ${MAX_PHOTOS}장까지 담을 수 있어요`);
      return;
    }
    inputRef.current?.click();
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const room = MAX_PHOTOS - photos.length;
    const picked = files.slice(0, room);
    const added: PhotoAttachment[] = [];
    for (const f of picked) {
      try {
        added.push({ id: uid(), dataUrl: await fileToDataUrl(f) });
      } catch {
        /* 개별 실패는 건너뜀 */
      }
    }
    if (added.length > 0) onChange([...photos, ...added]);
  }

  function removePhoto(id: string) {
    onChange(photos.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="photo-grid">
        {photos.map((p) => (
          <div className="photo-thumb" key={p.id}>
            <img src={p.dataUrl} alt="첨부 사진" />
            <button
              className="remove"
              onClick={() => removePhoto(p.id)}
              aria-label="삭제"
            >
              ×
            </button>
          </div>
        ))}

        {!atLimit && (
          <button className="photo-add" onClick={handleAddClick}>
            <span className="plus">+</span>
            <span>사진 담기</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFiles}
      />
    </div>
  );
}
