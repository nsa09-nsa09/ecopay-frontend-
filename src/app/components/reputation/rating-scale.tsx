import { useState } from 'react';

/**
 * 10-segment trust-rating scale (1..10). Display mode fills segments up to the
 * rounded rating; interactive mode lets the user pick a value 1..10 (used by the
 * leave-review form, which starts at the neutral default of 5).
 */
export function RatingScale({
  rating,
  size = 16,
  interactive = false,
  onChange,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = interactive ? hover || rating : rating;
  return (
    <div
      className="flex items-center gap-0.5"
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`${Math.round(rating * 10) / 10}/10`}
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => {
        const filled = Math.round(shown) >= step;
        return (
          <button
            key={step}
            type="button"
            disabled={!interactive}
            role={interactive ? 'radio' : undefined}
            aria-checked={interactive ? rating === step : undefined}
            aria-label={interactive ? `${step}/10` : undefined}
            onClick={() => interactive && onChange?.(step)}
            onMouseEnter={() => interactive && setHover(step)}
            onMouseLeave={() => interactive && setHover(0)}
            className={
              interactive
                ? 'cursor-pointer transition-transform hover:scale-110 p-0 border-0 bg-transparent'
                : 'cursor-default p-0 border-0 bg-transparent'
            }
          >
            <span
              className="block rounded-full transition-colors"
              style={{
                width: size * 0.55,
                height: size,
                background: filled ? 'var(--eco-warning-500)' : 'var(--eco-border)',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
