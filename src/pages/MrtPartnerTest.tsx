import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MrtPartnerTest() {
  const [tokenStatus, setTokenStatus] = useState<null | { ok: boolean; exp?: number | null; expiresInSec?: number | null; preview?: string | null; error?: string; upstream?: { status: number; body: string } }>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [envStatus, setEnvStatus] = useState<null | { ok: boolean; runtime?: string; hasRefreshToken?: boolean; refreshTokenLen?: number; hasClientId?: boolean; clientIdLen?: number; error?: string }>(null);
  const [loadingEnv, setLoadingEnv] = useState(false);

  const [depAirportCd, setDepAirportCd] = useState("ICN");
  const [arrAirportCd, setArrAirportCd] = useState("BKK");
  const [depDate, setDepDate] = useState("2024-11-10");
  const [arrDate, setArrDate] = useState("2024-11-15");
  const [tripTypeCd, setTripTypeCd] = useState<"OW" | "RT">("RT");
  const [landingUrl, setLandingUrl] = useState<string | null>(null);
  const [gid, setGid] = useState<number | null>(null);
  const [loadingLanding, setLoadingLanding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestToken = async () => {
    try {
      setLoadingToken(true);
      setError(null);
      const res = await fetch("/api/mrt/partner/token");
      const json = await res.json();
      setTokenStatus(json);
    } catch (e: any) {
      setTokenStatus({ ok: false, error: e?.message ?? "error" });
    } finally {
      setLoadingToken(false);
    }
  };

  const requestTokenDebug = async () => {
    try {
      setLoadingToken(true);
      setError(null);
      const res = await fetch("/api/mrt/partner/token?debug=1&refresh=1");
      const json = await res.json();
      setTokenStatus(json);
    } catch (e: any) {
      setTokenStatus({ ok: false, error: e?.message ?? "error" });
    } finally {
      setLoadingToken(false);
    }
  };

  const requestEnv = async () => {
    try {
      setLoadingEnv(true);
      const res = await fetch("/api/mrt/partner/env");
      const json = await res.json();
      setEnvStatus(json);
    } catch (e: any) {
      setEnvStatus({ ok: false, error: e?.message ?? "error" });
    } finally {
      setLoadingEnv(false);
    }
  };

  const requestLanding = async () => {
    try {
      setLoadingLanding(true);
      setError(null);
      setLandingUrl(null);
      setGid(null);
      const res = await fetch("/api/mrt/partner/landing-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depAirportCd, arrAirportCd, depDate, arrDate: tripTypeCd === "RT" ? arrDate : undefined, tripTypeCd }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(String(json?.error || `HTTP ${res.status}`) + (json?.body ? `\n${json.body}` : ""));
        return;
      }
      const url = json?.data?.url as string | undefined;
      const g = json?.data?.gid as number | undefined;
      if (url) {
        // append UTM for verification
        const u = new URL(url);
        if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", "luckyglide");
        setLandingUrl(u.toString());
        setGid(typeof g === "number" ? g : null);
      } else {
        setError("No URL returned");
      }
    } catch (e: any) {
      setError(e?.message ?? "error");
    } finally {
      setLoadingLanding(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-4">MRT 파트너 마이링크 테스트</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">Step 0. 환경 변수 확인</h3>
            <p className="text-sm text-muted-foreground">프리뷰(Edge) 런타임의 env 로드 여부를 확인합니다.</p>
            <Button size="sm" onClick={requestEnv} disabled={loadingEnv}>{loadingEnv ? "확인 중…" : "확인"}</Button>
            {envStatus ? (
              <div className="text-sm">
                <div>ok: {String(envStatus.ok)}</div>
                {"runtime" in envStatus ? <div>runtime: {envStatus.runtime}</div> : null}
                {"hasRefreshToken" in envStatus ? <div>hasRefreshToken: {String(envStatus.hasRefreshToken)}</div> : null}
                {"refreshTokenLen" in envStatus ? <div>refreshTokenLen: {envStatus.refreshTokenLen}</div> : null}
                {"hasClientId" in envStatus ? <div>hasClientId: {String(envStatus.hasClientId)}</div> : null}
                {"clientIdLen" in envStatus ? <div>clientIdLen: {envStatus.clientIdLen}</div> : null}
                {"error" in envStatus && envStatus.error ? <div className="text-red-600">error: {envStatus.error}</div> : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">Step 1. 액세스 토큰 발급</h3>
            <p className="text-sm text-muted-foreground">서버의 환경변수 MRT_PARTNER_REFRESH_TOKEN을 사용합니다.</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={requestToken} disabled={loadingToken}>{loadingToken ? "발급 중…" : "발급/확인"}</Button>
              <Button size="sm" variant="outline" onClick={requestTokenDebug} disabled={loadingToken}>{loadingToken ? "발급 중…" : "디버그 새로발급"}</Button>
            </div>
            {tokenStatus ? (
              <div className="text-sm">
                <div>ok: {String(tokenStatus.ok)}</div>
                {"error" in tokenStatus && tokenStatus.error ? <div className="text-red-600">error: {tokenStatus.error}</div> : null}
                {"preview" in tokenStatus && tokenStatus.preview ? <div>preview: {tokenStatus.preview}</div> : null}
                {"expiresInSec" in tokenStatus ? <div>expiresInSec: {tokenStatus.expiresInSec ?? "-"}</div> : null}
                {"exp" in tokenStatus ? <div>exp: {tokenStatus.exp ?? "-"}</div> : null}
                {"meta" in (tokenStatus as any) && (tokenStatus as any).meta ? (
                  <div className="text-xs text-muted-foreground mt-1">
                    payloadUsed: {(tokenStatus as any).meta.payloadUsed ?? "-"}, clientIdIncluded: {String((tokenStatus as any).meta.clientIdIncluded ?? false)}
                  </div>
                ) : null}
                {"upstream" in tokenStatus && tokenStatus.upstream ? (
                  <details className="mt-2">
                    <summary className="cursor-pointer">업스트림 응답 보기</summary>
                    <div className="text-xs mt-1 whitespace-pre-wrap break-all border rounded p-2">
                      status: {tokenStatus.upstream.status}
                      {"\n"}
                      {tokenStatus.upstream.body}
                    </div>
                  </details>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">Step 2. 마이링크(랜딩 URL) 요청</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dep">출발지</Label>
                <Input id="dep" value={depAirportCd} onChange={(e)=> setDepAirportCd(e.target.value.toUpperCase())} placeholder="ICN" />
              </div>
              <div>
                <Label htmlFor="arr">도착지</Label>
                <Input id="arr" value={arrAirportCd} onChange={(e)=> setArrAirportCd(e.target.value.toUpperCase())} placeholder="BKK" />
              </div>
              <div>
                <Label htmlFor="depDate">출발일</Label>
                <Input id="depDate" value={depDate} onChange={(e)=> setDepDate(e.target.value)} placeholder="YYYY-MM-DD" />
              </div>
              <div>
                <Label htmlFor="arrDate">복귀일</Label>
                <Input id="arrDate" value={arrDate} onChange={(e)=> setArrDate(e.target.value)} placeholder="YYYY-MM-DD" disabled={tripTypeCd === "OW"} />
              </div>
              <div className="col-span-2">
                <Label>여정 타입</Label>
                <div className="flex gap-3 mt-1">
                  <label className="text-sm flex items-center gap-1">
                    <input type="radio" name="tt" value="OW" checked={tripTypeCd === "OW"} onChange={()=> setTripTypeCd("OW")} />
                    OW(편도)
                  </label>
                  <label className="text-sm flex items-center gap-1">
                    <input type="radio" name="tt" value="RT" checked={tripTypeCd === "RT"} onChange={()=> setTripTypeCd("RT")} />
                    RT(왕복)
                  </label>
                </div>
              </div>
            </div>
            <Button size="sm" onClick={requestLanding} disabled={loadingLanding}>{loadingLanding ? "요청 중…" : "랜딩 URL 발급"}</Button>
            {error ? <div className="text-sm text-red-600">{error}</div> : null}
            {landingUrl ? (
              <div className="text-sm space-y-1">
                <div>gid: {gid ?? "-"}</div>
                <div className="truncate">url: <a className="text-blue-600 underline" href={landingUrl} target="_blank" rel="noreferrer">{landingUrl}</a></div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


