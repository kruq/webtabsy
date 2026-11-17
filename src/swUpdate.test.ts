import { applyUpdate, handleControllerChange, notifyWaiting, resetForTests, subscribe } from './swUpdate';

function registrationWithWaiting(postMessage = jest.fn()): ServiceWorkerRegistration {
    return { waiting: { postMessage } } as unknown as ServiceWorkerRegistration;
}

beforeEach(() => resetForTests());

describe('swUpdate', () => {
    it('reports no update until a waiting worker appears', () => {
        const listener = jest.fn();
        subscribe(listener);
        expect(listener).toHaveBeenLastCalledWith(false);

        notifyWaiting(registrationWithWaiting());

        expect(listener).toHaveBeenLastCalledWith(true);
    });

    it('ignores a registration without a waiting worker', () => {
        const listener = jest.fn();
        subscribe(listener);

        notifyWaiting({ waiting: null } as unknown as ServiceWorkerRegistration);

        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('activates the waiting worker and reloads once it takes control', () => {
        const postMessage = jest.fn();
        const reload = jest.fn();
        notifyWaiting(registrationWithWaiting(postMessage));

        applyUpdate();
        handleControllerChange(reload);
        handleControllerChange(reload);

        expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
        expect(reload).toHaveBeenCalledTimes(1);
    });

    it('does not reload when the worker takes control without a user request (first install)', () => {
        const reload = jest.fn();

        handleControllerChange(reload);

        expect(reload).not.toHaveBeenCalled();
    });
});
