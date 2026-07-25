import { useStudio } from '@/store/useStudio';
import type { Translation } from '@/i18n/types';
import zhCN from '@/i18n/zh-CN';
import enUS from '@/i18n/en-US';

export type LocaleCode = 'zh-CN' | 'en-US';

const LOCALES: Record<LocaleCode, Translation> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

/** Returns the translation object for the active locale. */
export function useT(): Translation {
  const locale = useStudio((s) => s.locale);
  return LOCALES[locale] ?? zhCN;
}
