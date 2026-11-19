import React, { FormEvent, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { AuthUser, changePassword, passwordProblem } from '../services/auth.service';
import AuthScreen from './AuthScreen';

interface ChangePasswordViewProps {
    user: AuthUser;
    onChanged: (user: AuthUser) => void;
    onLogout: () => void;
}

/** Wymuszona zmiana hasła po resecie - bez niej API nie udostępnia żadnych danych. */
export default function ChangePasswordView({ user, onChanged, onLogout }: ChangePasswordViewProps) {
    const [password, setPassword] = useState('');
    const [repeat, setRepeat] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const problem = password ? passwordProblem(password) : undefined;
    const mismatch = repeat.length > 0 && repeat !== password;
    const valid = password.length > 0 && !problem && repeat === password;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!valid) return;
        setBusy(true);
        setError('');
        try {
            onChanged(await changePassword(password));
        } catch (err) {
            console.error(err);
            setError('Nie udało się zmienić hasła, spróbuj ponownie');
            setBusy(false);
        }
    };

    return (
        <AuthScreen>
            <p>
                <strong>{user.name}</strong>, hasło zostało zresetowane. Ustaw nowe hasło, żeby korzystać z aplikacji.
            </p>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="new-password">
                    <Form.Label>Nowe hasło</Form.Label>
                    <Form.Control
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        isInvalid={!!problem}
                        onChange={e => setPassword(e.target.value)}
                    />
                    <Form.Control.Feedback type="invalid">{problem}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="new-password-repeat">
                    <Form.Label>Powtórz hasło</Form.Label>
                    <Form.Control
                        type="password"
                        autoComplete="new-password"
                        value={repeat}
                        isInvalid={mismatch}
                        onChange={e => setRepeat(e.target.value)}
                    />
                    <Form.Control.Feedback type="invalid">Hasła się różnią</Form.Control.Feedback>
                </Form.Group>
                {error && <div className="text-danger mb-3">{error}</div>}
                <Button type="submit" className="w-100" disabled={!valid || busy}>Zapisz hasło</Button>
                <Button variant="link" className="w-100 mt-2" onClick={onLogout}>Wyloguj</Button>
            </Form>
        </AuthScreen>
    );
}
