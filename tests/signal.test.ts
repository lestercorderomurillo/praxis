import { describe, it, expect, vi } from "vitest";
import { signal, watch } from "../src/core/signal";

describe("signal", () => {
  it("should return the initial value", () => {
    const counter = signal(0);
    expect(counter.value).toBe(0);
  });

  it("should update the value", () => {
    const counter = signal(0);
    counter.value = 5;
    expect(counter.value).toBe(5);
  });

  it("should notify subscribers on value change", () => {
    const counter = signal(0);
    const callback = vi.fn();

    counter.subscribe(callback);
    counter.value = 1;

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should notify multiple subscribers", () => {
    const counter = signal(0);
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    counter.subscribe(cb1);
    counter.subscribe(cb2);
    counter.value = 1;

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it("should stop notifying after unsubscribe", () => {
    const counter = signal(0);
    const callback = vi.fn();

    const unsubscribe = counter.subscribe(callback);
    counter.value = 1;
    unsubscribe();
    counter.value = 2;

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should reflect current value inside subscriber", () => {
    const counter = signal(0);
    const values: number[] = [];

    counter.subscribe(() => {
      values.push(counter.value);
    });

    counter.value = 1;
    counter.value = 2;
    counter.value = 3;

    expect(values).toEqual([1, 2, 3]);
  });
});

describe("watch", () => {
  it("should run the callback immediately", () => {
    const callback = vi.fn();
    watch(callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should re-run when a tracked signal changes", () => {
    const counter = signal(0);
    const values: number[] = [];

    watch(() => {
      values.push(counter.value);
    });

    counter.value = 1;
    counter.value = 2;

    expect(values).toEqual([0, 1, 2]);
  });

  it("should track multiple signals", () => {
    const a = signal(1);
    const b = signal(2);
    const sums: number[] = [];

    watch(() => {
      sums.push(a.value + b.value);
    });

    a.value = 10;
    b.value = 20;

    expect(sums).toEqual([3, 12, 30]);
  });

  it("should stop via external watcher.stop()", () => {
    const counter = signal(0);
    const values: number[] = [];

    const watcher = watch(() => {
      values.push(counter.value);
    });

    counter.value = 1;
    watcher.stop();
    counter.value = 2;

    expect(values).toEqual([0, 1]);
  });

  it("should stop via self.stop() from inside", () => {
    const counter = signal(0);
    const values: number[] = [];

    watch((self) => {
      values.push(counter.value);
      if (counter.value >= 2) {
        self.stop();
      }
    });

    counter.value = 1;
    counter.value = 2;
    counter.value = 3;

    expect(values).toEqual([0, 1, 2]);
  });
});
