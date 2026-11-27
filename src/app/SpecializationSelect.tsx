import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { Specialization } from '../models/Prescription';

interface SpecializationSelectProps {
    value: string;
    onChange: (name: string) => void;
    specializations: Specialization[];
    onAdd: (name: string) => Promise<Specialization>;
    /** Napis pozycji „bez specjalizacji”. */
    emptyLabel: string;
    className?: string;
}

const NEW_SPECIALIZATION = '__new__';

const byName = (a: Specialization, b: Specialization) => a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' });

/**
 * Wybór specjalizacji z listy; „+ Dodaj nową…” zamienia listę na pole z „Dodaj” / „Anuluj”, a dodana specjalizacja
 * od razu zostaje wybrana. Wspólne dla recepty, nowego lekarza w recepcie i okienka „Lekarze”.
 */
export default function SpecializationSelect({ value, onChange, specializations, onAdd, emptyLabel, className }: SpecializationSelectProps) {
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');

    const save = async () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        try {
            const created = await onAdd(trimmed);
            onChange(created.name);
            setAdding(false);
            setName('');
        } catch (e) {
            console.error(e);
            alert('Nie udało się dodać specjalizacji');
        }
    };

    if (adding) {
        return (
            <InputGroup className={className}>
                <Form.Control
                    type="text"
                    placeholder="Nazwa specjalizacji"
                    value={name}
                    autoFocus
                    onChange={e => setName(e.target.value)}
                />
                <Button onClick={save} disabled={!name.trim()}>Dodaj</Button>
                <Button variant="outline-secondary" onClick={() => setAdding(false)}>Anuluj</Button>
            </InputGroup>
        );
    }

    return (
        <Form.Select
            className={className}
            value={value}
            onChange={e => (e.target.value === NEW_SPECIALIZATION ? setAdding(true) : onChange(e.target.value))}
        >
            <option value="">{emptyLabel}</option>
            {[...specializations].sort(byName).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            {/* Specjalizacja zapisana wcześniej, a potem usunięta ze słownika, nadal ma się wyświetlić. */}
            {value && !specializations.some(s => s.name === value) && <option value={value}>{value}</option>}
            <option value={NEW_SPECIALIZATION}>+ Dodaj nową…</option>
        </Form.Select>
    );
}
