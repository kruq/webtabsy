import React, { FormEvent, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { AuthUser, ManagedUser, showsCurrentPackage, updateProfile, updateSettings } from '../services/auth.service';

interface ProfileDialogProps {
    visible: boolean;
    user: AuthUser;
    /** Użytkownik, którego dane są wyświetlane - do niego należy ustawienie ilości w opakowaniu. */
    viewed: ManagedUser;
    onSaved: (user: AuthUser) => void;
    onClose: () => void;
}

/**
 * Profil: nazwa zalogowanego i ustawienia użytkownika, którego dane są wyświetlane (przy danych połączonego
 * użytkownika - jego ustawienia). „Zapisz” zapisuje wszystko naraz, „Anuluj” porzuca zmiany.
 */
export default function ProfileDialog({ visible, user, viewed, onSaved, onClose }: ProfileDialogProps) {
    const viewingOther = viewed.id !== user.id;
    const [name, setName] = useState(user.name);
    const viewedShows = showsCurrentPackage(viewed);
    const [showCurrentPackage, setShowCurrentPackage] = useState(viewedShows);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!visible) return;
        setName(user.name);
        setShowCurrentPackage(viewedShows);
        setError('');
        // viewed powstaje przy każdym renderze - zależność od wartości, nie od obiektu (inaczej wpisywanie by się resetowało).
    }, [visible, user, viewedShows]);

    const valid = name.trim().length > 0;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!valid) return;
        setSaving(true);
        setError('');
        try {
            let saved: AuthUser;
            if (viewingOther) {
                await updateProfile(name.trim());
                saved = await updateSettings(showCurrentPackage);
            } else {
                saved = await updateProfile(name.trim(), showCurrentPackage);
            }
            onSaved(saved);
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
                    {viewingOther && <Form.Text className="text-secondary">Ustawienie użytkownika {viewed.name}</Form.Text>}
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
