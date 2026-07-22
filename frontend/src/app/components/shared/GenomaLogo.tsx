import { useTheme } from '../../context/ThemeContext';

const LOGO_LIGHT = '/genoma-logo.png';
const LOGO_DARK = '/genoma-logo2.png';

type GenomaLogoProps = {
  className?: string;
  alt?: string;
};

export function GenomaLogo({ className = 'h-9 w-auto max-w-[180px]', alt = 'Genoma' }: GenomaLogoProps) {
  const { isDark } = useTheme();

  return (
    <img
      src={isDark ? LOGO_DARK : LOGO_LIGHT}
      alt={alt}
      className={className}
      decoding="async"
      loading="eager"
    />
  );
}
