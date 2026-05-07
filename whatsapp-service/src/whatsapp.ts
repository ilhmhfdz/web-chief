import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';

// ============================================================
// Types
// ============================================================

export type WhatsAppStatus =
  | 'initializing'
  | 'qr_ready'
  | 'authenticated'
  | 'ready'
  | 'disconnected';

// ============================================================
// WhatsApp State Manager
// Encapsulates client state so index.ts stays clean.
// ============================================================

export class WhatsAppManager {
  private _client: Client;
  private _status: WhatsAppStatus = 'initializing';
  private _qrDataUrl: string | null = null;

  constructor() {
    this._client = new Client({
      authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      },
    });
  }

  get client(): Client {
    return this._client;
  }

  get status(): WhatsAppStatus {
    return this._status;
  }

  get qrDataUrl(): string | null {
    return this._qrDataUrl;
  }

  /** Attach event listeners and start the client */
  initialize(onMessage: (from: string, body: string) => Promise<string>): void {
    this._client.on('qr', async (qr: string) => {
      try {
        this._qrDataUrl = await qrcode.toDataURL(qr, { scale: 8 });
        this._status = 'qr_ready';
        console.log('📱 QR Code ready — open http://localhost:3003/qr to scan');
      } catch (err) {
        console.error('Failed to generate QR code:', (err as Error).message);
      }
    });

    this._client.on('authenticated', () => {
      this._status = 'authenticated';
      this._qrDataUrl = null;
      console.log('✅ WhatsApp authenticated!');
    });

    this._client.on('ready', () => {
      this._status = 'ready';
      console.log('🚀 WhatsApp client ready! Bot siap menerima pesan.');
    });

    this._client.on('disconnected', (reason: string) => {
      this._status = 'disconnected';
      this._qrDataUrl = null;
      console.warn('⚠️  WhatsApp disconnected:', reason);
      // Auto-reconnect after 5 seconds
      console.log('🔄 Mencoba reconnect dalam 5 detik...');
      setTimeout(async () => {
        this._status = 'initializing';
        try {
          await this._client.destroy().catch(() => {}); // Ensure no zombie instances
          await this._client.initialize();
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error('❌ Reconnect gagal:', errorMessage);
        }
      }, 5000);
    });

    /** Handler utama untuk membalas pesan masuk */
    const handleIncomingMessage = async (message: any) => {
      // BUG FIX 1: Jangan balas pesan dari bot sendiri (mencegah infinite loop)
      if (message.fromMe) return;

      // Skip grup, broadcast, dan status WA
      if (
        message.from.includes('@g.us') ||
        message.from === 'status@broadcast' ||
        message.isStatus
      ) {
        return;
      }

      // Skip jika body kosong (sticker, gambar tanpa caption, dll)
      if (!message.body || message.body.trim() === '') return;

      console.log(`📨 Pesan dari ${message.from}: ${message.body.substring(0, 50)}...`);

      try {
        const chat = await message.getChat();
        await chat.sendSeen();
        await chat.sendStateTyping();

        const reply = await onMessage(message.from, message.body);
        await message.reply(reply);

        await chat.clearState();
        console.log(`✅ Balasan terkirim ke ${message.from}`);
      } catch (err) {
        console.error('❌ Error processing message:', (err as Error).message);
        await message
          .reply(
            'Mohon maaf, ada gangguan teknis saat ini. Silakan coba lagi beberapa saat lagi. 🙏'
          )
          .catch(() => {}); // swallow reply errors
      }
    };

    // Hanya gunakan 'message' — cukup untuk semua pesan masuk
    // 'message_create' DIHAPUS karena juga trigger untuk pesan masuk → menyebabkan double reply
    this._client.on('message', handleIncomingMessage);

    this._client.initialize();
  }
}

