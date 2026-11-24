// One continuous foreground press; cancellation always starts the next attempt at zero.
export function createHold(onComplete: () => void, onProgress: (fraction: number) => void,
  clock = () => performance.now(), schedule = (callback: () => void) => setTimeout(callback, 40),
  clear = (timer: ReturnType<typeof setTimeout>) => clearTimeout(timer)) {
  let start: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  function cancel() {
    start = undefined;
    if (timer !== undefined) clear(timer);
    timer = undefined;
    onProgress(0);
  }
  function tick() {
    if (start === undefined) return;
    const fraction = Math.min(1, (clock() - start) / 3000);
    onProgress(fraction);
    if (fraction >= 1) {
      start = undefined; timer = undefined;
      onComplete();
    } else timer = schedule(tick);
  }
  return { cancel, begin() { cancel(); start = clock(); tick(); } };
}
