/**
 * Automatyczna aktualizacja PWA po wdrożeniu nowej wersji.
 *
 * Nowy service worker po pobraniu czeka ("waiting"), dopóki wszystkie okna aplikacji nie zostaną zamknięte -
 * zainstalowana aplikacja na telefonie zwykle tylko chowa się w tle, więc czekałby bardzo długo.
 * Ten moduł: sprawdza aktualizację przy każdym powrocie do aplikacji, a gdy nowa wersja czeka, od razu ją
 * włącza (SKIP_WAITING, obsługiwane w service-worker.ts) i przeładowuje stronę. Po przeładowaniu aplikacja
 * pokazuje informację o nowej wersji (justUpdated).
 */

/** Ustawiane tuż przed przeładowaniem; sessionStorage przetrwa przeładowanie w tej samej karcie/oknie aplikacji. */
const JUST_UPDATED_KEY = 'webtabsyJustUpdated';

let updateRequested = false;

/** Gdy rejestracja ma oczekującą nową wersję - włącza ją od razu. */
export function notifyWaiting(registration: ServiceWorkerRegistration): void {
    if (!registration.waiting) return;
    updateRequested = true;
    sessionStorage.setItem(JUST_UPDATED_KEY, 'true');
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
}

/**
 * Przeładowanie tylko po włączeniu nowej wersji przez notifyWaiting. Przy pierwszej instalacji service worker
 * też przejmuje stronę (clientsClaim) - wtedy nie przeładowujemy.
 */
export function handleControllerChange(reload: () => void = () => window.location.reload()): void {
    if (!updateRequested) return;
    updateRequested = false;
    reload();
}

/** Czy ta strona została właśnie przeładowana po aktualizacji. */
export function wasJustUpdated(): boolean {
    return sessionStorage.getItem(JUST_UPDATED_KEY) === 'true';
}

/** Informacja o nowej wersji pokazuje się raz. */
export function clearJustUpdated(): void {
    sessionStorage.removeItem(JUST_UPDATED_KEY);
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
    updateRequested = false;
    clearJustUpdated();
}
