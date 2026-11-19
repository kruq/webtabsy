import React, { FormEvent, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { AuthUser, renameMe } from '../services/auth.service';

interface RenameDialogProps {
    visible: boolean;
    currentName: string;
    onRenamed: (user: AuthUser) => void;
    onClose: () => void;
}

export default function RenameDialog({ visible, currentName, onRenamed, onClose }: RenameDialogProps) {
    const [name, setName] = useState(currentName);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!visible) return;
        setName(currentName);
        setError('');
    }, [visible, currentName]);

    const valid = name.trim().length > 0;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!valid) return;
        setSaving(true);
        setError('');
        try {
            onRenamed(await renameMe(name.trim()));
            onClose();
        } catch (err) {
            console.error(err);
            setError('Nie udało się zmienić nazwy');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={visible} onHide={onClose}>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title as="h5">Zmień nazwę</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="rename-name">
                        <Form.Label>Nazwa</Form.Label>
                        <Form.Control type="text" value={name} autoFocus onChange={e => setName(e.target.value)} />
                    </Form.Group>
                    {error && <div className="text-danger mt-2">{error}</div>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onClose}>Anuluj</Button>
                    <Button type="submit" disabled={!valid || saving}>Zapisz</Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
