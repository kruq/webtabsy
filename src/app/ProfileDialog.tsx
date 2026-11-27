import React, { FormEvent, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { AuthUser, showsCurrentPackage, updateProfile } from '../services/auth.service';

interface ProfileDialogProps {
    visible: boolean;
    user: AuthUser;
    onSaved: (user: AuthUser) => void;
    onClose: () => void;
}

/** Profil zalogowanego: nazwa i ustawienia. „Zapisz” zapisuje wszystko naraz, „Anuluj” porzuca zmiany. */
export default function ProfileDialog({ visible, user, onSaved, onClose }: ProfileDialogProps) {
    const [name, setName] = useState(user.name);
    const [showCurrentPackage, setShowCurrentPackage] = useState(showsCurrentPackage(user));
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!visible) return;
        setName(user.name);
        setShowCurrentPackage(showsCurrentPackage(user));
        setError('');
    }, [visible, user]);

    const valid = name.trim().length > 0;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!valid) return;
        setSaving(true);
        setError('');
        try {
            onSaved(await updateProfile(name.trim(), showCurrentPackage));
            onClose();
        } catch (err) {
            console.error(err);
            setError('Nie udało się zapisać profilu');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={visible} onHide={onClose}>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title as="h5">Profil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="profile-name">
                        <Form.Label>Nazwa</Form.Label>
                        <Form.Control type="text" value={name} autoFocus onChange={e => setName(e.target.value)} />
                    </Form.Group>
                    <Form.Check
                        className="mt-3"
                        type="switch"
                        id="profile-show-current-package"
                        label="Pokaż ilość w aktualnym opakowaniu"
                        checked={showCurrentPackage}
                        onChange={e => setShowCurrentPackage(e.target.checked)}
                    />
                    {error && <div className="text-danger mt-2">{error}</div>}
                </Modal.Body>
                <Modal.Footer>
                    <Button type="submit" disabled={!valid || saving}>Zapisz</Button>
                    <Button variant="secondary" onClick={onClose}>Anuluj</Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
