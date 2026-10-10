const expected = process.env.CRON_SECRET;
const received = req.headers.get("authorization");

console.info("Cron authentication diagnostic", {
  secretConfigured: Boolean(expected),
  authorizationHeaderPresent: Boolean(received),
  bearerPrefixPresent: received?.startsWith("Bearer ") ?? false,
  secretLength: expected?.length ?? 0,
  receivedLength: received?.startsWith("Bearer ")
    ? received.length - 7
    : null,
});

if (!expected || received !== `Bearer ${expected}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
