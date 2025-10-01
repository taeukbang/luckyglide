// Simple local test to hit affiliate endpoint
async function main() {
  const body = {
    from: process.env.TEST_FROM || 'ICN',
    to: process.env.TEST_TO || 'OSA',
    dep: process.env.TEST_DEP || '2025-11-03',
    ret: process.env.TEST_RET || '2025-11-07',
    nonstop: String(process.env.TEST_NONSTOP || 'true').toLowerCase() === 'true',
  };
  const r = await fetch('http://localhost:8787/api/affiliate/mrt-deeplink', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  console.log(JSON.stringify({ status: r.status, text }, null, 2));
}

main().catch((e) => {
  console.error('TEST_ERROR', e?.message || e);
  process.exit(1);
});


