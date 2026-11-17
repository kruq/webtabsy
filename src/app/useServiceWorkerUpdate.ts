import { useEffect, useState } from 'react';
import { subscribe } from '../swUpdate';

/** true, gdy nowa wersja aplikacji jest pobrana i czeka na włączenie. */
export function useServiceWorkerUpdate(): boolean {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    useEffect(() => subscribe(setUpdateAvailable), []);
    return updateAvailable;
}
