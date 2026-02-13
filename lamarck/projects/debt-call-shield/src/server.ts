import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { handleIncomingCall } from "./routes/incoming-call.js";
import { handleMediaStream } from "./routes/media-stream.js";
import {
  listCallRecords,
  getCallRecord,
  getCallStats,
} from "./utils/call-history.js";

function dashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Debt Call Shield</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
  h1 { font-size: 1.5rem; margin-bottom: 1.5rem; color: #38bdf8; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .stat { background: #1e293b; padding: 1.2rem; border-radius: 0.5rem; }
  .stat .label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat .value { font-size: 1.8rem; font-weight: 700; margin-top: 0.3rem; }
  .calls { background: #1e293b; border-radius: 0.5rem; overflow: hidden; }
  .calls h2 { padding: 1rem; font-size: 1rem; border-bottom: 1px solid #334155; }
  .call-row { padding: 0.8rem 1rem; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
  .call-row:hover { background: #334155; }
  .call-row .time { color: #94a3b8; font-size: 0.85rem; }
  .call-row .intent { font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 999px; background: #334155; }
  .intent-debt { background: #7f1d1d; color: #fca5a5; }
  .intent-scam { background: #78350f; color: #fde68a; }
  .intent-unknown { background: #334155; color: #94a3b8; }
  .empty { text-align: center; padding: 3rem; color: #64748b; }
  .error { color: #f87171; text-align: center; padding: 2rem; }
</style>
</head>
<body>
<h1>Debt Call Shield</h1>
<div class="stats" id="stats">Loading...</div>
<div class="calls">
  <h2>Recent Calls</h2>
  <div id="calls">Loading...</div>
</div>
<script>
async function load() {
  try {
    const [statsRes, callsRes] = await Promise.all([
      fetch('/api/stats'), fetch('/api/calls')
    ]);
    const stats = await statsRes.json();
    const calls = await callsRes.json();

    document.getElementById('stats').innerHTML = [
      { label: 'Total Calls', value: stats.totalCalls },
      { label: 'Avg Duration', value: stats.avgDurationSec ? stats.avgDurationSec.toFixed(0) + 's' : '-' },
      { label: 'Debt Calls', value: stats.intentBreakdown?.debt_collection || 0 },
      { label: 'Scam Calls', value: stats.intentBreakdown?.scam || 0 },
    ].map(s => '<div class="stat"><div class="label">' + s.label + '</div><div class="value">' + s.value + '</div></div>').join('');

    if (!calls.calls || calls.calls.length === 0) {
      document.getElementById('calls').innerHTML = '<div class="empty">No calls recorded yet</div>';
      return;
    }

    document.getElementById('calls').innerHTML = calls.calls.slice(0, 20).map(function(c) {
      var d = new Date(c.startTime || c.timestamp);
      var cls = c.intent === 'debt_collection' ? 'intent-debt' : c.intent === 'scam' ? 'intent-scam' : 'intent-unknown';
      return '<div class="call-row"><span class="time">' + d.toLocaleString() + '</span>'
        + '<span>' + (c.turns || 0) + ' turns</span>'
        + '<span class="intent ' + cls + '">' + (c.intent || 'unknown') + '</span></div>';
    }).join('');
  } catch(e) {
    document.getElementById('stats').innerHTML = '<div class="error">Failed to load: ' + e.message + '</div>';
  }
}
load();
setInterval(load, 10000);
</script>
</body>
</html>`;
}

const PORT = parseInt(process.env.PORT || "3000");
const HOST = process.env.HOST || "0.0.0.0";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(websocket);

  // Twilio webhook: incoming call → return TwiML that connects to media stream
  app.post("/incoming-call", handleIncomingCall);

  // WebSocket: receive real-time audio from Twilio Media Streams
  app.register(async (fastify) => {
    fastify.get("/media-stream", { websocket: true }, handleMediaStream);
  });

  // Health check
  app.get("/health", async () => ({ status: "ok" }));

  // Dashboard
  app.get("/", async (_req, reply) => {
    reply.type("text/html").send(dashboardHtml());
  });

  // Call history API
  app.get("/api/calls", async () => {
    const records = await listCallRecords();
    return { total: records.length, calls: records };
  });

  app.get<{ Params: { id: string } }>("/api/calls/:id", async (req, reply) => {
    const record = await getCallRecord(req.params.id);
    if (!record) {
      return reply.code(404).send({ error: "Call not found" });
    }
    return record;
  });

  app.get("/api/stats", async () => {
    return getCallStats();
  });

  await app.listen({ port: PORT, host: HOST });
  console.log(`Server listening on ${HOST}:${PORT}`);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
