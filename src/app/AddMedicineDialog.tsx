import React, { MouseEvent, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';

interface AddMedicineDialogProps {
    visible: boolean;
    onSubmit: (name: string) => Promise<void> | void;
    onCancel: () => void;
}

export default function AddMedicineDialog({ visible, onSubmit, onCancel }: AddMedicineDialogProps) {
    const [name, setName] = useState('');

    const handleSubmit = async (e: MouseEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Nie można dodać leku bez nazwy');
            return;
        }
        await onSubmit(name.trim());
        setName('');
    };

    const handleCancel = () => {
        setName('');
        onCancel();
    };

    return (
        <dialog open={visible}>
            <strong>Nowy lek</strong>
            <Form>
                <Form.Group className="mb-3">
                    <Form.Label>Nazwa leku</Form.Label>
                    <Form.Control
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </Form.Group>
                <Row className="text-end">
                    <Col>
                        <Button type="submit" onClick={handleSubmit} variant="primary">Dodaj</Button>
                        <Button className="ms-2" variant="secondary" onClick={handleCancel}>Anuluj</Button>
                    </Col>
                </Row>
            </Form>
        </dialog>
    );
}
