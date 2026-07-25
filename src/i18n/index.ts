/**
 * i18n public API
 *
 * Usage:
 *   const t = useT();
 *   <span>{t.controlCenter}</span>
 *
 * To switch locale at runtime:
 *   useStudio.getState().setLocale('en-US');
 */
export { useT } from '@/i18n/useT';
export type { Translation } from '@/i18n/types';
export type { LocaleCode } from '@/i18n/useT';
