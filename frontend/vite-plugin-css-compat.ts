import type { Plugin } from 'vite';

/** Patch Sonner runtime CSS injection (Safari user-select prefix). */
export function cssVendorCompat(): Plugin {
  return {
    name: 'css-vendor-compat',
    enforce: 'post',
    transform(code, id) {
      if (!id.includes('node_modules/sonner/dist/index.')) return;
      if (!code.includes('data-swiped')) return;

      const next = code.replace(
        /(\[data-sonner-toast\]\[data-swiped=true\]\{)user-select:none/g,
        '$1-webkit-user-select:none;user-select:none',
      );

      if (next === code) return;
      return { code: next, map: null };
    },
  };
}
