import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { WhatsAppManager } from './whatsapp';
import { generateResponse, ChatMessage } from './ragAgent';

// ============================================================
// Validation
// ============================================================

if (!process.env.MONGODB_URI || !process.env.OPENAI_API_KEY) {
  console.error(
    '❌ FATAL: MONGODB_URI and OPENAI_API_KEY must be set in your .env file.'
  );
  process.exit(1);
}

if (!process.env.INTERNAL_API_SECRET) {
  console.error('❌ FATAL: INTERNAL_API_SECRET must be set in your .env file.');
  process.exit(1);
}

// ============================================================
// Express App
// ============================================================

const PORT = Number(process.env.PORT ?? 3003);
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET as string;
const app = express();
app.use(express.json());

// [SEC-05] Internal secret middleware — protects management endpoints
function requireInternalSecret(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers['x-internal-secret'];
  if (!secret || secret !== INTERNAL_API_SECRET) {
    res.status(401).json({ success: false, error: 'Unauthorized — internal secret required' });
    return;
  }
  next();
}

// ============================================================
// Conversation Memory (in-process, per sender)
// ============================================================

const MAX_HISTORY_TURNS = 10; // Keep last 10 exchanges
const conversationHistory = new Map<string, ChatMessage[]>();

function getHistory(contactId: string): ChatMessage[] {
  return conversationHistory.get(contactId) ?? [];
}

function updateHistory(contactId: string, userMsg: string, botMsg: string): void {
  const history = getHistory(contactId);
  history.push({ role: 'user', content: userMsg });
  history.push({ role: 'assistant', content: botMsg });

  // Trim to max length
  const trimmed =
    history.length > MAX_HISTORY_TURNS * 2
      ? history.slice(-(MAX_HISTORY_TURNS * 2))
      : history;

  conversationHistory.set(contactId, trimmed);
}

// ============================================================
// WhatsApp Manager
// ============================================================

const wa = new WhatsAppManager();

wa.initialize(async (from: string, body: string): Promise<string> => {
  const history = getHistory(from);
  const reply = await generateResponse(body, history);
  updateHistory(from, body, reply);
  return reply;
});

// ============================================================
// Routes
// ============================================================

/**
 * GET /qr
 * Beautiful auto-refreshing QR page for scanning.
 * Auto-redirects when authenticated.
 */
app.get('/qr', requireInternalSecret, (req: Request, res: Response) => {
  const status = wa.status;
  const qr = wa.qrDataUrl;

  if (status === 'ready' || status === 'authenticated') {
    res.send(buildPage({
      title: '✅ Sudah Terhubung',
      body: `
        <div class="icon">✅</div>
        <h2>WhatsApp Berhasil Terhubung!</h2>
        <p>Bot Chief Assistant sudah aktif dan siap menerima pesan.</p>
        <a href="/status" class="btn">Lihat Status</a>
      `,
      refresh: false,
    }));
    return;
  }

  if (status === 'initializing') {
    res.send(buildPage({
      title: '⏳ Memulai...',
      body: `
        <div class="icon spin">⏳</div>
        <h2>Memulai WhatsApp Client...</h2>
        <p>Mohon tunggu, halaman akan otomatis refresh.</p>
      `,
      refresh: true,
    }));
    return;
  }

  if (!qr || status !== 'qr_ready') {
    res.send(buildPage({
      title: '⏳ Menunggu QR...',
      body: `
        <div class="icon spin">🔄</div>
        <h2>Memuat QR Code...</h2>
        <p>Mohon tunggu beberapa detik, halaman akan otomatis refresh.</p>
      `,
      refresh: true,
    }));
    return;
  }

  // QR ready — show it!
  res.send(buildPage({
    title: '📱 Scan QR Code',
    body: `
      <h2>Scan QR Code dengan WhatsApp Anda</h2>
      <p>Buka WhatsApp → Menu (⋮) → <strong>Perangkat Tertaut</strong> → <strong>Tautkan Perangkat</strong></p>
      <div class="qr-wrapper">
        <img src="${qr}" alt="WhatsApp QR Code" />
      </div>
      <p class="hint">⚠️ QR Code akan kedaluwarsa dalam ~60 detik. Halaman otomatis refresh.</p>
    `,
    refresh: true,
    refreshInterval: 30,
  }));
});

/**
 * GET /status
 * JSON status endpoint.
 */
app.get('/status', requireInternalSecret, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: wa.status,
      hasQR: !!wa.qrDataUrl,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /health
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() } });
});

/**
 * POST /api/logout
 * Logout the current WhatsApp session.
 */
app.post('/api/logout', requireInternalSecret, async (req: Request, res: Response) => {
  try {
    await wa.client.logout();
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ============================================================
// HTML Page Builder
// ============================================================

interface PageOptions {
  title: string;
  body: string;
  refresh: boolean;
  refreshInterval?: number;
}

function buildPage({ title, body, refresh, refreshInterval = 5 }: PageOptions): string {
  const metaRefresh = refresh
    ? `<meta http-equiv="refresh" content="${refreshInterval}">`
    : '';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${metaRefresh}
  <title>${title} — Chief Supplies Bot</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #09090b;
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 24px;
      text-align: center;
    }
    .card {
      background: #18181b;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 24px;
      padding: 48px 40px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 25px 60px rgba(0,0,0,0.5);
    }
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 32px;
    }
    .logo-icon {
      width: 40px; height: 40px;
      background: #f99207;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    .logo-text { font-size: 18px; font-weight: 700; color: #fff; }
    .logo-sub { font-size: 11px; color: #71717a; letter-spacing: 0.2em; text-transform: uppercase; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    .spin { display: inline-block; animation: spin 1.5s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 12px; }
    p { color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 8px; }
    p strong { color: #d4d4d8; }
    .qr-wrapper {
      margin: 24px auto;
      display: inline-block;
      background: white;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 10px 40px rgba(249,146,7,0.15);
    }
    .qr-wrapper img { display: block; width: 260px; height: 260px; }
    .hint { font-size: 12px; color: #52525b; margin-top: 8px; }
    .btn {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 24px;
      background: #f99207;
      color: #09090b;
      font-weight: 600;
      font-size: 14px;
      border-radius: 10px;
      text-decoration: none;
    }
    .refresh-note {
      margin-top: 24px;
      font-size: 11px;
      color: #3f3f46;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <div class="logo-icon">🛍</div>
      <div>
        <div class="logo-text">Chief Supplies</div>
        <div class="logo-sub">WhatsApp Bot</div>
      </div>
    </div>
    ${body}
    ${refresh ? `<p class="refresh-note">Auto-refresh setiap ${refreshInterval} detik</p>` : ''}
  </div>
</body>
</html>`;
}

// ============================================================
// Start server
// ============================================================

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║     Chief Supplies WhatsApp Bot        ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  HTTP : http://localhost:${PORT}           ║`);
  console.log(`║  QR   : http://localhost:${PORT}/qr        ║`);
  console.log(`║  API  : http://localhost:${PORT}/status    ║`);
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log('📱 Buka http://localhost:3003/qr di browser untuk scan QR');
  console.log('');
});
