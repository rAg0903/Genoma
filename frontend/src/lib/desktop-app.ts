export function isGenomaDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.genomaDesktop?.isDesktop) return true;
  return navigator.userAgent.includes('GenomaDesktop');
}

declare global {
  interface Window {
    genomaDesktop?: {
      platform: string;
      isDesktop: boolean;
    };
  }
}
