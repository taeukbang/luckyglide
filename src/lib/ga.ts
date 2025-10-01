export function gaEvent(action: string, params?: Record<string, any>) {
  try {
    // @ts-ignore
    window.gtag?.('event', action, params || {});
  } catch {}
}
