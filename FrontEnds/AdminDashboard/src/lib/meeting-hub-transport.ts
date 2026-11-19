import * as signalR from '@microsoft/signalr';

const HUB_INVOKE_MAX_ATTEMPTS = 4;
const HUB_INVOKE_RETRY_MS = 350;

/** خطاهای متنی منتخب شبکه را برای retry تشخیص می‌دهد؛ این نام به معنی بی‌اهمیت بودن علت قطع نیست. */
export function isBenignSignalTransportError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('failed to fetch') ||
    m.includes('networkerror') ||
    m.includes('network error') ||
    m.includes('timeout occurred') ||
    m.includes('a timeout occurred') ||
    m.includes('err_http2_protocol_error') ||
    m.includes('connection disconnected') ||
    m.includes('connection reconnecting') ||
    m.includes('stopped during negotiation')
  );
}

/** فاصله تلاش اتصال مجدد را تا ۳۰ ثانیه افزایش می‌دهد؛ چون null برنمی‌گرداند سقف تعداد تلاش خودکار ندارد. */
export function createMeetingHubReconnectDelays(): signalR.IRetryPolicy {
  return {
    nextRetryDelayInMilliseconds(retryContext) {
      const n = retryContext.previousRetryCount;
      if (n === 0) return 0;
      if (n === 1) return 1000;
      if (n === 2) return 2000;
      if (n === 3) return 4000;
      if (n < 8) return 8000;
      if (n < 16) return 15000;
      return 30000;
    },
  };
}

type InvokeChain = {
  tail: Promise<void>;
};

/** صف وعده‌ها را برای اجرای مرتب درخواست‌های یک Hook مقداردهی می‌کند. */
export function createHubInvokeChain(): InvokeChain {
  return { tail: Promise.resolve() };
}

/**
 * فراخوانی‌ها را پشت سر هم اجرا می‌کند و خطاهای منتخب انتقال را حداکثر چهار بار امتحان می‌کند.
 * خطای درخواست قبلی صف را مسدود نمی‌کند. retry تضمین اجرای دقیقاً یک‌باره متد در سرور نیست.
 */
export async function enqueueHubInvoke(
  chain: InvokeChain,
  getConnection: () => signalR.HubConnection | null,
  method: string,
  ...args: unknown[]
): Promise<void> {
  const run = async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt < HUB_INVOKE_MAX_ATTEMPTS; attempt++) {
      const conn = getConnection();
      if (!conn) return;
      if (conn.state === signalR.HubConnectionState.Disconnected) {
        await waitForHubConnected(conn, 8000);
      }
      if (conn.state !== signalR.HubConnectionState.Connected) {
        throw new Error('Hub is not connected.');
      }
      try {
        await conn.invoke(method, ...args);
        return;
      } catch (error) {
        lastError = error;
        const msg = String(error instanceof Error ? error.message : error);
        if (
          conn.state !== signalR.HubConnectionState.Connected &&
          conn.state !== signalR.HubConnectionState.Reconnecting
        ) {
          throw error;
        }
        if (attempt + 1 >= HUB_INVOKE_MAX_ATTEMPTS) break;
        if (!isBenignSignalTransportError(msg)) break;
        await sleep(HUB_INVOKE_RETRY_MS * (attempt + 1));
      }
    }
    throw lastError ?? new Error(`Hub invoke failed: ${method}`);
  };

  const next = chain.tail.catch(() => undefined).then(run);
  chain.tail = next.catch(() => undefined);
  return next;
}

/** مکث غیرمسدودکننده میان تلاش‌های ارسال. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * تا رویداد اتصال مجدد یا پایان مهلت منتظر می‌ماند؛ خودش connection.start را فراخوانی نمی‌کند.
 * ثبت callback از onreconnected است؛ off('reconnected') پایین مربوط به پیام Hub است و همان callback را حذف نمی‌کند.
 */
function waitForHubConnected(connection: signalR.HubConnection, timeoutMs: number): Promise<void> {
  if (connection.state === signalR.HubConnectionState.Connected) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      connection.off('reconnected', onReconnected);
      reject(new Error('Timed out waiting for hub reconnect.'));
    }, timeoutMs);

    const onReconnected = () => {
      clearTimeout(timer);
      connection.off('reconnected', onReconnected);
      resolve();
    };

    if (connection.state === signalR.HubConnectionState.Connected) {
      clearTimeout(timer);
      resolve();
      return;
    }

    connection.onreconnected(onReconnected);
  });
}
