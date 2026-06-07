import { createKV } from './kv';

/**
 * FIFO offline write-queue. Native uses MMKV; web falls back to localStorage
 * (see kv.web.ts). Mutations made while offline are enqueued and replayed in
 * order once connectivity returns. Pure storage + an injectable executor —
 * keeps it free of axios/store import cycles.
 */
const storage = createKV('transvigo-queue');
const QUEUE_KEY = 'offline_queue';
const MAX_RETRIES = 3;

export interface QueuedAction {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  body: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

/** Result of executing one queued action against the network. */
export type ExecResult = 'ok' | 'client_error' | 'retryable';

function readQueue(): QueuedAction[] {
  const raw = storage.getString(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedAction[];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedAction[]): void {
  storage.set(QUEUE_KEY, JSON.stringify(queue));
}

let counter = 0;
function localId(): string {
  counter += 1;
  return `q_${Date.now()}_${counter}`;
}

export function addToQueue(
  action: Pick<QueuedAction, 'endpoint' | 'method' | 'body'>,
): QueuedAction {
  const queued: QueuedAction = { ...action, id: localId(), timestamp: Date.now(), retryCount: 0 };
  writeQueue([...readQueue(), queued]);
  return queued;
}

export function getQueue(): QueuedAction[] {
  return readQueue();
}

export function getQueueCount(): number {
  return readQueue().length;
}

export function clearQueue(): void {
  storage.delete(QUEUE_KEY);
}

/**
 * Replay queued actions in order via the provided executor.
 *  - 'ok'           → remove from queue
 *  - 'client_error' → remove (4xx: user error, retrying won't help)
 *  - 'retryable'    → bump retryCount; drop after MAX_RETRIES (reported via onDrop)
 * Returns the number of actions that completed successfully.
 */
export async function processQueue(
  execute: (action: QueuedAction) => Promise<ExecResult>,
  onDrop?: (action: QueuedAction) => void,
): Promise<number> {
  let succeeded = 0;
  // Snapshot then process strictly in order (no parallel dispatch).
  for (const action of readQueue()) {
    let result: ExecResult;
    try {
      result = await execute(action);
    } catch {
      result = 'retryable';
    }

    const queue = readQueue();
    const idx = queue.findIndex((a) => a.id === action.id);
    if (idx === -1) continue;

    if (result === 'ok') {
      queue.splice(idx, 1);
      succeeded += 1;
    } else if (result === 'client_error') {
      queue.splice(idx, 1);
    } else {
      const next = { ...queue[idx]!, retryCount: queue[idx]!.retryCount + 1 };
      if (next.retryCount >= MAX_RETRIES) {
        queue.splice(idx, 1);
        onDrop?.(next);
      } else {
        queue[idx] = next;
      }
    }
    writeQueue(queue);
  }
  return succeeded;
}
