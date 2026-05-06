import { useEffect, useRef, useState } from 'react';
import { SYNC_INTERVAL_IN_SECONDS } from '../constants';

export function useSyncTimer(onTick: () => void): number {
    const [secondsLeft, setSecondsLeft] = useState(SYNC_INTERVAL_IN_SECONDS);
    const onTickRef = useRef(onTick);

    useEffect(() => {
        onTickRef.current = onTick;
    }, [onTick]);

    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    onTickRef.current();
                    return SYNC_INTERVAL_IN_SECONDS;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return secondsLeft;
}
