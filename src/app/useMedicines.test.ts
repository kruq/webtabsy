import { act, renderHook, waitFor } from '@testing-library/react';
import IMedicine from '../models/IMedicine';
import { fetchMedicines } from '../services/medicine.service';
import { findOverdueDoses } from '../services/overdueDoses.service';
import { useMedicines } from './useMedicines';

jest.mock('../services/medicine.service', () => ({
    fetchMedicines: jest.fn(),
    addMedicine: jest.fn(),
    updateMedicine: jest.fn(),
    deleteMedicine: jest.fn(),
    newMedicine: jest.fn(),
}));
jest.mock('../services/overdueDoses.service', () => ({ findOverdueDoses: jest.fn() }));

const fetchMedicinesMock = fetchMedicines as jest.Mock;
const findOverdueDosesMock = findOverdueDoses as jest.Mock;

function medicine(count: number): IMedicine {
    return { id: 'm', name: 'Lek', meal: '', description: '', count, isVisible: true, hideWhenEmpty: false, doses: [], purchases: [] };
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(r => {
        resolve = r;
    });
    return { promise, resolve };
}

beforeEach(() => {
    jest.resetAllMocks();
    findOverdueDosesMock.mockResolvedValue([]);
});

describe('useMedicines refresh during writes', () => {
    it('discards a refresh that was in flight while a write happened, then refreshes again', async () => {
        const staleFetch = deferred<IMedicine[]>();
        fetchMedicinesMock.mockReturnValueOnce(staleFetch.promise).mockResolvedValue([medicine(8)]);

        const { result } = renderHook(() => useMedicines());

        // The initial refresh is still waiting for the API while the user confirms a dose.
        await act(async () => {
            await result.current.trackWrite(async () => undefined);
        });
        // The old response (count 10, before the write) arrives late and must not overwrite the state.
        await act(async () => {
            staleFetch.resolve([medicine(10)]);
        });

        await waitFor(() => expect(result.current.medicines).toEqual([medicine(8)]));
        expect(fetchMedicinesMock).toHaveBeenCalledTimes(2);
    });

    it('applies a refresh when no write happened meanwhile', async () => {
        fetchMedicinesMock.mockResolvedValue([medicine(5)]);

        const { result } = renderHook(() => useMedicines());

        await waitFor(() => expect(result.current.medicines).toEqual([medicine(5)]));
    });

    it('is loaded after the first refresh even with no medicines', async () => {
        fetchMedicinesMock.mockResolvedValue([]);

        const { result } = renderHook(() => useMedicines());

        expect(result.current.loaded).toBe(false);
        await waitFor(() => expect(result.current.loaded).toBe(true));
        expect(result.current.medicines).toEqual([]);
    });

    it('does not start a refresh while a write is in flight', async () => {
        fetchMedicinesMock.mockResolvedValue([medicine(5)]);
        const { result } = renderHook(() => useMedicines());
        await waitFor(() => expect(fetchMedicinesMock).toHaveBeenCalledTimes(1));

        const write = deferred<void>();
        let writing: Promise<void> = Promise.resolve();
        act(() => {
            writing = result.current.trackWrite(() => write.promise);
        });
        await act(async () => {
            await result.current.refresh();
        });
        expect(fetchMedicinesMock).toHaveBeenCalledTimes(1);

        await act(async () => {
            write.resolve();
            await writing;
        });
        await waitFor(() => expect(fetchMedicinesMock).toHaveBeenCalledTimes(2));
    });
});
