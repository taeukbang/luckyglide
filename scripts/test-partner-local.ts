import "dotenv/config";

const PORT = process.env.PARTNER_LOCAL_PORT || process.env.PORT || "8787";
const HOST = process.env.PARTNER_LOCAL_HOST || "localhost";

async function call(body: any, label: string) {
  const res = await fetch(`http://${HOST}:${PORT}/api/mrt-partner-link`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log(`\n=== ${label} ===`);
  console.log("status:", res.status);
  console.log(text);
}

async function main() {
  // Desktop nonstop
  await call({ from: "ICN", to: "KIX", depdt: "2025-11-12", rtndt: "2025-11-14", tripType: "RT", nonstop: true, mobile: false }, "nonstop desktop");
  // Mobile nonstop
  await call({ from: "ICN", to: "KIX", depdt: "2025-11-12", rtndt: "2025-11-14", tripType: "RT", nonstop: true, mobile: true }, "nonstop mobile");
  // Mapping via gid path (nonstop=false)
  await call({ from: "GMP", to: "NRT", depdt: "2025-11-12", rtndt: "2025-11-14", tripType: "RT" }, "gid path mapping GMP->SEL, NRT->TYO");
  await call({ from: "ICN", to: "JFK", depdt: "2025-11-12", rtndt: "2025-11-14", tripType: "RT" }, "gid path mapping JFK->NYC");
}

main().catch((e) => { console.error(e); process.exit(1); });


