import type { Watcher, Widen } from '../types';

let activeWatcher: (() => void) | null = null;
let activeCleanups: (() => void)[] | null = null;

export const signal = <T = unknown>(initialValue: T) => {
    let value = initialValue as Widen<T>;
    let subscribers: (() => void)[] = [];

    return {
        get value(): Widen<T> {
            if (activeWatcher) {
                const watcher = activeWatcher;
                if (!subscribers.includes(watcher)) {
                    subscribers.push(watcher);
                    activeCleanups?.push(() => {
                        subscribers = subscribers.filter(sub => sub !== watcher);
                    });
                }
            }
            return value;
        },
        set value(newValue: Widen<T>) {
            value = newValue;
            for (const sub of [...subscribers]) {
                sub();
            }
        },
        subscribe(callback: () => void) {
            subscribers.push(callback);

            return () => {
                subscribers = subscribers.filter(sub => sub !== callback);
            };
        }
    }
}

export const watch = (fn: (self: Watcher) => void): Watcher => {
    const cleanups: (() => void)[] = [];

    const watcher: Watcher = {
        stop: () => {
            for (const cleanup of cleanups) {
                cleanup();
            }
        }
    };

    const runner = () => fn(watcher);

    activeWatcher = runner;
    activeCleanups = cleanups;

    runner();
    
    activeWatcher = null;
    activeCleanups = null;

    return watcher;
}