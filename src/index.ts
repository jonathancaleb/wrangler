// Callback URLs look like:  https://<your-worker>.workers.dev/<type>/<status>
//   type:   checkout | deposit | payout | refund
//   status: success | error | cancel | pending | ... (anything)
const TYPES = ["checkout", "deposit", "payout", "refund"] as const;
type CallbackType = (typeof TYPES)[number];

const isCallbackType = (t: string): t is CallbackType => (TYPES as readonly string[]).includes(t);

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const [type, status = "notify"] = url.pathname.split("/").filter(Boolean);

    if (!type) return Response.json({ ok: true, service: "callbacks" });
    if (!isCallbackType(type)) return Response.json({ ok: false, error: "unknown type" }, { status: 404 });

    const query = JSON.stringify(Object.fromEntries(url.searchParams));
    const body = request.method === "GET" ? null : await request.text();

    // Save before answering: if this fails we return 500 so the provider retries
    try {
      await env.DB.prepare("INSERT INTO callbacks (type, status, method, query, body) VALUES (?, ?, ?, ?, ?)")
        .bind(type, status, request.method, query, body)
        .run();
    } catch (err) {
      console.error("db insert failed", err);
      return Response.json({ ok: false }, { status: 500 });
    }

    console.log(JSON.stringify({ type, status, method: request.method, query, body }));

    // TODO: verify provider signature, then forward to your wallet backend

    // Browser redirects (e.g. checkout success/cancel pages) arrive as GET
    if (request.method === "GET") {
      return new Response(`<h1>${type} ${status}</h1>`, { headers: { "content-type": "text/html" } });
    }
    // Server-to-server webhooks: answer 200 fast so the provider stops retrying
    return Response.json({ ok: true, type, status });
  },
} satisfies ExportedHandler<Env>;
