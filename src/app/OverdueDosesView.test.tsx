import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Tab from 'react-bootstrap/Tab';
import IMedicine from '../models/IMedicine';
import OverdueDose from '../models/OverdueDoses';
import OverdueDoseGroup from '../models/OverdueDosesGroup';
import OverdueDosesView from './OverdueDosesView';

const at = new Date('2026-11-24T08:00:00');

function med(name: string, count: number): IMedicine {
    return { id: name, name, meal: '', description: '', count, isVisible: true, hideWhenEmpty: false, doses: [], purchases: [] };
}

function dose(id: string, medicineName: string, amount = 1): OverdueDose {
    return new OverdueDose({ id, amount, numberOfDays: 1, nextDoseDate: at, medicineName, meal: '', time: '08:00', endDate: null });
}

function renderView(medicines: IMedicine[], doses: OverdueDose[], onConfirmAll = jest.fn()) {
    const group = new OverdueDoseGroup({ time: at, doses });
    render(
        <Tab.Container activeKey="missingDoses">
            <Tab.Content>
                <OverdueDosesView
                    medicines={medicines}
                    groups={[group]}
                    purchaseDeadlines={[]}
                    onSkipDose={jest.fn()}
                    onConfirmDose={jest.fn()}
                    onOpenMedicine={jest.fn()}
                    onConfirmAll={onConfirmAll}
                    showCurrentPackage
                />
            </Tab.Content>
        </Tab.Container>,
    );
    return { group, onConfirmAll };
}

describe('Potwierdź wszystkie', () => {
    it('is hidden with a single dose at that time', () => {
        renderView([med('Apap', 5)], [dose('a', 'Apap')]);

        expect(screen.queryByRole('button', { name: /Potwierdź wszystkie/ })).toBeNull();
    });

    it('confirms the whole group', () => {
        const { group, onConfirmAll } = renderView([med('Apap', 5), med('Ibuprom', 5)], [dose('a', 'Apap'), dose('b', 'Ibuprom')]);

        fireEvent.click(screen.getByRole('button', { name: 'Potwierdź wszystkie' }));

        expect(onConfirmAll).toHaveBeenCalledWith(group);
    });

    it('is greyed out with a warning when a dose lacks stock', () => {
        renderView([med('Apap', 5), med('Ibuprom', 0)], [dose('a', 'Apap'), dose('b', 'Ibuprom')]);

        expect(screen.getByRole('button', { name: /Potwierdź wszystkie - Za mało leku, żeby potwierdzić: Ibuprom/ })).toBeDisabled();
    });
});

describe('Status day separators', () => {
    it('are hidden when all doses are from today', () => {
        const now = new Date();
        now.setHours(0, 1, 0, 0);
        const group = new OverdueDoseGroup({ time: now, doses: [dose('a', 'Apap')] });
        render(
            <Tab.Container activeKey="missingDoses">
                <Tab.Content>
                    <OverdueDosesView medicines={[med('Apap', 5)]} groups={[group]} purchaseDeadlines={[]} onSkipDose={jest.fn()}
                        onConfirmDose={jest.fn()} onOpenMedicine={jest.fn()} onConfirmAll={jest.fn()} showCurrentPackage />
                </Tab.Content>
            </Tab.Container>,
        );
        expect(screen.queryByText('dziś')).toBeNull();
    });

    it('show each day when doses come from more than one day', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const today = new Date();
        today.setHours(0, 1, 0, 0);
        render(
            <Tab.Container activeKey="missingDoses">
                <Tab.Content>
                    <OverdueDosesView
                        medicines={[med('Apap', 5)]}
                        groups={[new OverdueDoseGroup({ time: yesterday, doses: [dose('a', 'Apap')] }), new OverdueDoseGroup({ time: today, doses: [dose('b', 'Apap')] })]}
                        purchaseDeadlines={[]} onSkipDose={jest.fn()} onConfirmDose={jest.fn()} onOpenMedicine={jest.fn()} onConfirmAll={jest.fn()} showCurrentPackage
                    />
                </Tab.Content>
            </Tab.Container>,
        );
        expect(screen.getByText('wczoraj')).toBeInTheDocument();
        expect(screen.getByText('dziś')).toBeInTheDocument();
    });
});
