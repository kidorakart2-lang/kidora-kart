import { logger } from "./logger.js";

type Job = () => Promise<void>;

const queue: Job[] = [];
let processing = false;

async function processNext(): Promise<void> {
  if (processing || queue.length === 0) return;
  processing = true;
  const job = queue.shift();
  if (job) {
    try {
      await job();
    } catch (error) {
      logger.error(error, "Job queue: unhandled error in job");
    }
  }
  processing = false;
  if (queue.length > 0) {
    setImmediate(processNext);
  }
}

export function enqueue(fn: Job): void {
  queue.push(fn);
  if (!processing) {
    setImmediate(processNext);
  }
}
