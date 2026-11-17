import { RefObject, useEffect, useState } from 'react';

/** Bieżąca wysokość elementu w px; 0, dopóki element nie jest zamontowany lub brak ResizeObserver (np. jsdom). */
export function useElementHeight(ref: RefObject<HTMLElement>): number {
    const [height, setHeight] = useState(0);

    useEffect(() => {
        const element = ref.current;
        if (!element || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(() => setHeight(element.getBoundingClientRect().height));
        observer.observe(element);
        return () => observer.disconnect();
    }, [ref]);

    return height;
}
