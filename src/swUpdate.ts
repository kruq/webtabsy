/**
 * Aktualizacja PWA po wdrożeniu nowej wersji.
 *
 * Nowy service worker po pobraniu czeka ("waiting"), dopóki wszystkie okna aplikacji nie zostaną zamknięte -
 * zainstalowana aplikacja na telefonie zwykle tylko chowa się w tle, więc czekałby bardzo długo.
 * Ten moduł: sprawdza aktualizację przy każdym powrocie do aplikacji, zgłasza oczekującą wersję
 * (pasek "Nowa wersja") i po kliknięciu "Odśwież" włącza ją (SKIP_WAITING, obsługiwane w service-worker.ts)
 * i przeładowuje stronę.
 */

type Listener = (updateAvailable: boolean) => void;

let waitingWorker: ServiceWorker | null = null;
let updateRequested = false;
const listeners = new Set<Listener>();

/** Zgłasza oczekującą nową wersję, jeśli rejestracja ją ma. */
export function notifyWaiting(registration: ServiceWorkerRegistration): void {
    if (!registration.waiting) return;
    waitingWorker = registration.waiting;
    listeners.forEach(listener => listener(true));
}

export function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    listener(waitingWorker !== null);
    return () => {
        listeners.delete(listener);
    };
}

/** Włącza oczekującą wersję; przeładowanie następuje po przejęciu strony przez nowy service worker. */
export function applyUpdate(): void {
    updateRequested = true;
    if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
        window.location.reload();
    }
}

/**
 * Przeładowanie tylko wtedy, gdy użytkownik sam kliknął "Odśwież". Przy pierwszej instalacji service worker
 * też przejmuje stronę (clientsClaim) - wtedy nie przeładowujemy.
 */
export function handleControllerChange(reload: () => void = () => window.location.reload()): void {
    if (!updateRequested) return;
    updateRequested = false;
    reload();
}

export function initUpdateChecks(): void {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.addEventListener('controllerchange', () => handleControllerChange());
    navigator.serviceWorker.ready.then(registration => {
        // Nowa wersja mogła zostać pobrana już wcześniej, zanim aplikacja została ponownie otwarta.
        notifyWaiting(registration);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                registration.update().catch(e => console.warn('Sprawdzenie aktualizacji nie powiodło się', e));
            }
        });
    });
}

/** Tylko do testów. */
export function resetForTests(): void {
    waitingWorker = null;
    updateRequested = false;
    listeners.clear();
}
