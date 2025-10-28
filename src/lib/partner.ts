import { isMobileUA } from "@/lib/utils";

export async function getMrtPartnerMylink(params: { from: string; to: string; depdt: string; rtndt: string; nonstop?: boolean; mobile?: boolean }) {
  try {
    const mobile = typeof params.mobile === 'boolean' ? params.mobile : isMobileUA();
    const res = await fetch("/api/mrt-partner-link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...params, mobile }),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null as any);
    const my = data?.mylink;
    return typeof my === 'string' && my ? my : null;
  } catch {
    return null;
  }
}

export async function openPartnerOrFallback(args: { from: string; to: string; depdt: string; rtndt: string; nonstop?: boolean; fallbackUrl: string; mobile?: boolean }) {
  const { from, to, depdt, rtndt, nonstop, fallbackUrl } = args;
  const win = window.open('about:blank', '_blank', 'noopener,noreferrer');
  try {
    const link = await getMrtPartnerMylink({ from, to, depdt, rtndt, nonstop });
    const target = link || fallbackUrl;
    if (win) win.location.href = target;
    else window.open(target, '_blank', 'noopener,noreferrer');
  } catch {
    if (win) win.location.href = fallbackUrl;
    else window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
  }
}


