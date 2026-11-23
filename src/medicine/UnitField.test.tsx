import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { UnitsProvider } from '../app/UnitsContext';
import Unit from '../models/Unit';
import { DEFAULT_UNIT } from '../utils/units';
import UnitField from './UnitField';

const ML: Unit = { id: 'ml', nominativeSingular: 'mililitr', nominativePlural: 'mililitry', genitiveSingular: 'mililitra', genitivePlural: 'mililitrów', abbreviation: 'ml' };

function mockUnitsApi() {
    const fetchMock = jest.fn((url: string, init?: RequestInit) => {
        if (init?.method === 'POST') {
            return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve({ id: 'new-unit', ...JSON.parse(init.body as string) }) });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([DEFAULT_UNIT, ML]) });
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    return fetchMock;
}

function renderField(onChange: jest.Mock) {
    render(
        <UnitsProvider medicines={[]}>
            <UnitField unit={DEFAULT_UNIT} onChange={onChange} />
        </UnitsProvider>,
    );
    expect(screen.getByText('tabletka (tab.)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
}

afterEach(() => jest.resetAllMocks());

describe('UnitField', () => {
    it('picks a unit from the shared list', async () => {
        mockUnitsApi();
        const onChange = jest.fn();
        renderField(onChange);

        await screen.findByRole('option', { name: 'mililitr (ml)' });
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ml' } });

        expect(onChange).toHaveBeenCalledWith('ml');
    });

    it('adds a new unit with all five forms and picks it', async () => {
        const fetchMock = mockUnitsApi();
        const onChange = jest.fn();
        renderField(onChange);

        fireEvent.change(screen.getByRole('combobox'), { target: { value: '__new__' } });
        const forms: [string, string][] = [
            ['Mianownik l.p.', 'kapsułka'], ['Mianownik l.m.', 'kapsułki'], ['Dopełniacz l.p.', 'kapsułki'],
            ['Dopełniacz l.m.', 'kapsułek'], ['Skrót', 'kaps.'],
        ];
        const add = screen.getByRole('button', { name: 'Dodaj' });
        // Wszystkie pięć pól jest wymaganych: przycisk jest nieaktywny, dopóki brakuje choćby jednego.
        forms.slice(0, -1).forEach(([label, value]) => {
            fireEvent.change(screen.getByLabelText(label), { target: { value } });
        });
        expect(add).toBeDisabled();
        const [lastLabel, lastValue] = forms[forms.length - 1];
        fireEvent.change(screen.getByLabelText(lastLabel), { target: { value: lastValue } });
        expect(add).toBeEnabled();
        fireEvent.click(add);

        await waitFor(() => expect(onChange).toHaveBeenCalledWith('new-unit'));
        const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST') as [string, RequestInit];
        expect(JSON.parse(post[1].body as string)).toEqual({
            nominativeSingular: 'kapsułka', nominativePlural: 'kapsułki', genitiveSingular: 'kapsułki', genitivePlural: 'kapsułek', abbreviation: 'kaps.',
        });
    });
});
