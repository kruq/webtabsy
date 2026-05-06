import { useEffect, useRef, useCallback } from 'react';

type AnyFn = (...args: any[]) => void;

export function useDebouncedCallback<T extends AnyFn>(callback: T, delayMs: number): T {
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

    return useCallback((...args: Parameters<T>) => {
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delayMs);
    }, [delayMs]) as T;
}
