import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Modal, Button } from '../ds-primitives';
import { useI18n, type Language } from '../i18n-provider';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

/** Side of the square JPEG we emit. Backend downscales further if needed. */
const OUTPUT_SIZE = 512;

/**
 * Square crop / zoom editor for service logos. The admin pans and zooms the
 * picked image inside a square frame so the logo fills the whole tile (no
 * letterboxing). On apply we render exactly the framed region to a 512×512
 * canvas and hand back a fresh JPEG File — so the stored image already fills
 * the box everywhere it's shown, with no per-render fit settings to maintain.
 *
 * Self-contained: no cropping library, just pointer math + canvas.
 */
export function LogoCropModal({
  open,
  file,
  onCancel,
  onApply,
}: {
  open: boolean;
  file: File | null;
  onCancel: () => void;
  onApply: (cropped: File) => void;
}) {
  const { language } = useI18n();
  const lang = language as Language;

  const frameRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const [src, setSrc] = useState<string | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [frame, setFrame] = useState(300); // measured viewport side, px
  const [minScale, setMinScale] = useState(1);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // top-left of image in frame coords
  const [busy, setBusy] = useState(false);

  // Load the picked file into an object URL + read its natural size.
  useEffect(() => {
    if (!open || !file) {
      setSrc(null);
      setNat(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    const image = new Image();
    image.onload = () => {
      imgRef.current = image;
      setNat({ w: image.naturalWidth, h: image.naturalHeight });
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [open, file]);

  // Measure the square frame so the crop math matches what's on screen.
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const w = frameRef.current?.clientWidth;
      if (w && w > 0) setFrame(w);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open, src]);

  const clamp = useCallback(
    (next: { x: number; y: number }, s: number) => {
      if (!nat) return next;
      const dispW = nat.w * s;
      const dispH = nat.h * s;
      // Keep the frame fully covered: image edges never enter the frame.
      const minX = frame - dispW;
      const minY = frame - dispH;
      return {
        x: Math.min(0, Math.max(minX, next.x)),
        y: Math.min(0, Math.max(minY, next.y)),
      };
    },
    [nat, frame],
  );

  // Initialise to "cover": smallest scale that fills the frame, centred.
  useEffect(() => {
    if (!nat) return;
    const cover = Math.max(frame / nat.w, frame / nat.h);
    setMinScale(cover);
    setScale(cover);
    setPos({ x: (frame - nat.w * cover) / 2, y: (frame - nat.h * cover) / 2 });
  }, [nat, frame]);

  const applyScale = useCallback(
    (nextScale: number) => {
      if (!nat) return;
      const s = Math.min(minScale * 5, Math.max(minScale, nextScale));
      // Zoom around the frame centre so the focus point stays put.
      const cx = (frame / 2 - pos.x) / scale;
      const cy = (frame / 2 - pos.y) / scale;
      const next = { x: frame / 2 - cx * s, y: frame / 2 - cy * s };
      setScale(s);
      setPos(clamp(next, s));
    },
    [nat, minScale, frame, pos, scale, clamp],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setPos((p) => clamp({ x: p.x + dx, y: p.y + dy }, scale));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };
  const onWheel = (e: React.WheelEvent) => {
    applyScale(scale * (e.deltaY < 0 ? 1.08 : 0.92));
  };

  const apply = useCallback(() => {
    const image = imgRef.current;
    if (!image || !nat || !file) return;
    setBusy(true);
    try {
      // Frame → natural-image source rectangle.
      const srcX = -pos.x / scale;
      const srcY = -pos.y / scale;
      const srcSize = frame / scale;

      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setBusy(false);
        return;
      }
      // Transparent areas flatten to white, matching the backend re-encode.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      canvas.toBlob(
        (blob) => {
          setBusy(false);
          if (!blob) return;
          const base = (file.name || 'logo').replace(/\.[^.]+$/, '');
          onApply(new File([blob], `${base}.jpg`, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.92,
      );
    } catch {
      setBusy(false);
    }
  }, [nat, file, pos, scale, frame, onApply]);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={tx(lang, 'Кадрирование логотипа', 'Логотипті кадрлау', 'Crop logo')}
    >
      <div className="flex flex-col gap-4">
        <p className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          {tx(
            lang,
            'Перетащите и масштабируйте, чтобы логотип заполнил всю область.',
            'Логотип бүкіл аумақты толтыру үшін жылжытып, масштабтаңыз.',
            'Drag and zoom so the logo fills the whole area.',
          )}
        </p>

        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
          className="relative w-full mx-auto overflow-hidden rounded-xl select-none"
          style={{
            maxWidth: 320,
            aspectRatio: '1 / 1',
            background: 'var(--eco-surface)',
            border: '1px solid var(--eco-border)',
            cursor: dragRef.current ? 'grabbing' : 'grab',
            touchAction: 'none',
          }}
        >
          {src && nat && (
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: nat.w * scale,
                height: nat.h * scale,
                maxWidth: 'none',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {tx(lang, 'Масштаб', 'Масштаб', 'Zoom')}
          </span>
          <input
            type="range"
            min={minScale}
            max={minScale * 5}
            step={(minScale * 4) / 100 || 0.01}
            value={scale}
            onChange={(e) => applyScale(Number(e.target.value))}
            className="flex-1 cursor-pointer"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {tx(lang, 'Отмена', 'Бас тарту', 'Cancel')}
          </Button>
          <Button variant="primary" size="sm" loading={busy} onClick={apply} disabled={!nat}>
            {tx(lang, 'Применить', 'Қолдану', 'Apply')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
