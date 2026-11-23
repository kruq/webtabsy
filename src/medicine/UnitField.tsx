import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { useUnits } from '../app/UnitsContext';
import Unit from '../models/Unit';
import EditableField from './EditableField';

interface UnitFieldProps {
    unit: Unit;
    onChange: (unitId: string) => void;
}

const NEW_UNIT = '__new__';

type UnitForm = Omit<Unit, 'id'>;

const EMPTY_FORM: UnitForm = {
    nominativeSingular: '',
    nominativePlural: '',
    genitiveSingular: '',
    genitivePlural: '',
    abbreviation: '',
};

const FIELDS: { key: keyof UnitForm; label: string; placeholder: string }[] = [
    { key: 'nominativeSingular', label: 'Mianownik l.p.', placeholder: 'np. kapsułka' },
    { key: 'nominativePlural', label: 'Mianownik l.m.', placeholder: 'np. kapsułki' },
    { key: 'genitiveSingular', label: 'Dopełniacz l.p.', placeholder: 'np. kapsułki' },
    { key: 'genitivePlural', label: 'Dopełniacz l.m.', placeholder: 'np. kapsułek' },
    { key: 'abbreviation', label: 'Skrót', placeholder: 'np. kaps.' },
];

/** Jednostka leku: wybór ze wspólnej listy albo dodanie nowej (pięć form nazwy). */
export default function UnitField({ unit, onChange }: UnitFieldProps) {
    const { units, addUnit } = useUnits();
    const [editing, setEditing] = useState(false);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState<UnitForm>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const sorted = [...units].sort((a, b) => a.nominativeSingular.localeCompare(b.nominativeSingular, 'pl'));
    const formValid = FIELDS.every(f => form[f.key].trim().length > 0);

    const handleChoice = (value: string) => {
        if (value === NEW_UNIT) {
            setForm(EMPTY_FORM);
            setAdding(true);
            return;
        }
        onChange(value);
        setEditing(false);
    };

    const handleAdd = async () => {
        if (!formValid) return;
        setSaving(true);
        try {
            const created = await addUnit({
                nominativeSingular: form.nominativeSingular.trim(),
                nominativePlural: form.nominativePlural.trim(),
                genitiveSingular: form.genitiveSingular.trim(),
                genitivePlural: form.genitivePlural.trim(),
                abbreviation: form.abbreviation.trim(),
            });
            onChange(created.id);
            setAdding(false);
            setEditing(false);
        } catch (e) {
            console.error(e);
            alert('Nie udało się dodać jednostki');
        } finally {
            setSaving(false);
        }
    };

    return (
        <EditableField
            label="Jednostka"
            isEditing={editing}
            onStartEdit={() => setEditing(true)}
            onStopEdit={() => {
                setEditing(false);
                setAdding(false);
            }}
            display={`${unit.nominativeSingular} (${unit.abbreviation})`}
        >
            {adding ? (
                <div className="border rounded p-2">
                    <div className="mb-2"><small className="text-accent">Nowa jednostka</small></div>
                    <Row className="g-2">
                        {FIELDS.map(f => (
                            <Form.Group as={Col} xs={6} key={f.key} controlId={`new-unit-${f.key}`}>
                                <Form.Label className="mb-0"><small>{f.label}</small></Form.Label>
                                <Form.Control
                                    size="sm"
                                    type="text"
                                    placeholder={f.placeholder}
                                    value={form[f.key]}
                                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                />
                            </Form.Group>
                        ))}
                    </Row>
                    <div className="text-end mt-2">
                        <Button size="sm" onClick={handleAdd} disabled={!formValid || saving}>Dodaj</Button>
                        <Button size="sm" variant="outline-secondary" className="ms-2" onClick={() => setAdding(false)}>Anuluj</Button>
                    </div>
                </div>
            ) : (
                <Form.Select value={unit.id} onChange={e => handleChoice(e.target.value)}>
                    {sorted.map(u => (
                        <option key={u.id} value={u.id}>{u.nominativeSingular} ({u.abbreviation})</option>
                    ))}
                    <option value={NEW_UNIT}>+ Dodaj nową…</option>
                </Form.Select>
            )}
        </EditableField>
    );
}
