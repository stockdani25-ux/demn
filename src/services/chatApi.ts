import { ApiResponse } from '../types/chat';

export const PRIMARY_API_ENDPOINT = 'https://christmas-practitioner-secret-off.trycloudflare.com/api/chat';
export const PROXY_API_ENDPOINT = '/api/remote-chat';

export interface SendMessageOptions {
  message: string;
  signal?: AbortSignal;
  customEndpoint?: string;
  timeoutMs?: number;
}

/**
 * Sends a message to the AI Chat REST API.
 * Uses exact schema: POST { "message": string } with Content-Type: application/json.
 * Parses response: { success: boolean, reply?: string, error?: string }.
 */
export async function sendChatMessage({
  message,
  signal,
  customEndpoint,
  timeoutMs = 45000,
}: SendMessageOptions): Promise<string> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('Pesan (message) tidak boleh kosong!');
  }

  // Use customEndpoint if set, else primary, fallback to proxy
  const endpointsToTry = customEndpoint
    ? [customEndpoint]
    : [PRIMARY_API_ENDPOINT, PROXY_API_ENDPOINT];

  let lastError: Error | null = null;

  for (const endpoint of endpointsToTry) {
    // Setup abort timeout
    const timeoutController = new AbortController();
    const timer = setTimeout(() => {
      timeoutController.abort('Request timeout');
    }, timeoutMs);

    const onUserAbort = () => timeoutController.abort();
    if (signal) {
      signal.addEventListener('abort', onUserAbort);
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ message: trimmed }),
        signal: timeoutController.signal,
      });

      clearTimeout(timer);
      if (signal) {
        signal.removeEventListener('abort', onUserAbort);
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let parsedError = '';
        try {
          const errJson = JSON.parse(errorText);
          parsedError = errJson.error || errJson.message || '';
        } catch {
          // not json
        }
        throw new Error(
          parsedError || `Server mengembalikan status HTTP ${response.status} (${response.statusText})`
        );
      }

      const data: ApiResponse = await response.json();

      if (data.success === false) {
        throw new Error(data.error || 'Gagal memproses pesan pada server AI.');
      }

      if (typeof data.reply === 'string') {
        return data.reply;
      }

      // If reply is nested or missing
      if (data && typeof data === 'object') {
        const record = data as unknown as Record<string, unknown>;
        const anyReply = record.message || record.response;
        if (typeof anyReply === 'string') return anyReply;
      }

      throw new Error('Format balasan server tidak sesuai.');
    } catch (err: unknown) {
      clearTimeout(timer);
      if (signal) {
        signal.removeEventListener('abort', onUserAbort);
      }

      const isAbort =
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && err.name === 'AbortError') ||
        signal?.aborted;

      if (isAbort) {
        throw new Error('Permintaan dibatalkan.');
      }

      lastError = err instanceof Error ? err : new Error(String(err));
      // If we have another endpoint to try, continue
    }
  }

  throw lastError || new Error('Tidak dapat terhubung ke server AI. Periksa koneksi internet Anda.');
}

/**
 * Health check utility to test endpoint connectivity.
 */
export async function testApiConnection(endpoint = PRIMARY_API_ENDPOINT): Promise<{
  ok: boolean;
  latencyMs: number;
  message: string;
}> {
  const start = performance.now();
  const endpoints = endpoint === PRIMARY_API_ENDPOINT ? [PRIMARY_API_ENDPOINT, PROXY_API_ENDPOINT] : [endpoint];

  let lastMsg = 'Koneksi gagal';
  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'ping' }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const latencyMs = Math.round(performance.now() - start);

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return { ok: true, latencyMs, message: 'Server online dan merespons dengan baik' };
        }
        return { ok: false, latencyMs, message: data.error || 'Format respon tidak valid' };
      }
      lastMsg = `Status HTTP ${res.status}`;
    } catch (err: unknown) {
      lastMsg = err instanceof Error ? err.message : 'Koneksi gagal';
    }
  }

  const latencyMs = Math.round(performance.now() - start);
  return { ok: false, latencyMs, message: lastMsg };
}
