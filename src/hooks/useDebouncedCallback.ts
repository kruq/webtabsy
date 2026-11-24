import { useEffect, useRef, useCallback, useMemo } from 'react';

type AnyFn = (...args: any[]) => void;

/** Zwraca funkcję wywoływaną z opóźnieniem; cancel() porzuca oczekujące wywołanie. */
export function useDebouncedCallback<T extends AnyFn>(callback: T, delayMs: number): T & { cancel: () => void } {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        return () => {
            if (timerRef.current !== null) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    const cancel = useCallback(() => {
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const debounced = useCallback((...args: Parameters<T>) => {
        cancel();
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            callbackRef.current(...args);
        }, delayMs);
    }, [delayMs, cancel]);

    return useMemo(() => Object.assign(debounced, { cancel }), [debounced, cancel]) as unknown as T & { cancel: () => void };
}
