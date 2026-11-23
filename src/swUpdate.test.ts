import { clearJustUpdated, handleControllerChange, notifyWaiting, resetForTests, wasJustUpdated } from './swUpdate';

function registrationWithWaiting(postMessage = jest.fn()): ServiceWorkerRegistration {
    return { waiting: { postMessage } } as unknown as ServiceWorkerRegistration;
}

beforeEach(() => resetForTests());

describe('swUpdate', () => {
    it('activates a waiting worker right away and reloads once it takes control', () => {
        const postMessage = jest.fn();
        const reload = jest.fn();

        notifyWaiting(registrationWithWaiting(postMessage));
        handleControllerChange(reload);
        handleControllerChange(reload);

        expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
        expect(reload).toHaveBeenCalledTimes(1);
    });

    it('remembers across the reload that the app was just updated, until cleared', () => {
        notifyWaiting(registrationWithWaiting());

        expect(wasJustUpdated()).toBe(true);
        clearJustUpdated();
        expect(wasJustUpdated()).toBe(false);
    });

    it('does nothing without a waiting worker', () => {
        const reload = jest.fn();

        notifyWaiting({ waiting: null } as unknown as ServiceWorkerRegistration);
        handleControllerChange(reload);

        expect(reload).not.toHaveBeenCalled();
        expect(wasJustUpdated()).toBe(false);
    });

    it('does not reload when the worker takes control on the first install', () => {
        const reload = jest.fn();

        handleControllerChange(reload);

        expect(reload).not.toHaveBeenCalled();
    });
});
