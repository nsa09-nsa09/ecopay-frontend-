import { Link } from 'react-router';
import logoUrl from '../assets/ecopay-logo-transparent-256.png';

type BrandLogoProps = {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  sublabel?: string;
  className?: string;
  textColor?: string;
};

const sizes = {
  sm: { image: 34, text: 'text-[18px]', gap: 'gap-2' },
  md: { image: 46, text: 'text-[28px]', gap: 'gap-2.5' },
  lg: { image: 82, text: 'text-[32px]', gap: 'gap-3' },
};

function BrandLogoContent({
  size = 'md',
  label = 'EcoPay',
  sublabel,
  textColor = 'var(--eco-text)',
}: Omit<BrandLogoProps, 'to' | 'className'>) {
  const config = sizes[size];

  return (
    <span className={`inline-flex items-center ${config.gap}`}>
      <img
        src={logoUrl}
        alt=""
        aria-hidden="true"
        className="shrink-0 object-contain"
        style={{ width: config.image, height: config.image }}
      />
      <span className="flex flex-col leading-none">
        <span
          className={`${config.text} tracking-tight`}
          style={{ color: textColor, fontWeight: 700 }}
        >
          {label}
        </span>
        {sublabel && (
          <span
            className="text-[11px] mt-1"
            style={{ color: 'var(--eco-text-tertiary)', fontWeight: 400 }}
          >
            {sublabel}
          </span>
        )}
      </span>
    </span>
  );
}

export function BrandLogo({ to, className = '', ...props }: BrandLogoProps) {
  if (to) {
    return (
      <Link
        to={to}
        className={className}
        style={{ color: 'var(--eco-text)', textDecoration: 'none' }}
        aria-label="EcoPay"
      >
        <BrandLogoContent {...props} />
      </Link>
    );
  }

  return (
    <span className={className} aria-label="EcoPay">
      <BrandLogoContent {...props} />
    </span>
  );
}

export { logoUrl as ecopayLogoUrl };
