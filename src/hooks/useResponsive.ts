import { useEffect } from 'react';
import { useStudio } from '@/store/useStudio';

/** Tracks viewport width and sets isMobile for responsive panel behaviour. */
export function useResponsive() {
  const setIsMobile = useStudio((s) => s.setIsMobile);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [setIsMobile]);
}
