import React, { FormEvent, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { InvalidCredentialsError } from '../services/auth.service';
import AuthScreen from './AuthScreen';

interface LoginViewProps {
    onLogin: (login: string, password: string) => Promise<void>;
}

export default function LoginView({ onLogin }: LoginViewProps) {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            await onLogin(login, password);
        } catch (err) {
            setError(err instanceof InvalidCredentialsError ? 'Nieprawidłowy login lub hasło' : 'Błąd połączenia, spróbuj ponownie');
            setBusy(false);
        }
    };

    return (
        <AuthScreen>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="login-login">
                    <Form.Label>Login</Form.Label>
                    <Form.Control
                        type="text"
                        autoComplete="username"
                        autoCapitalize="none"
                        value={login}
                        onChange={e => setLogin(e.target.value)}
                    />
                </Form.Group>
                <Form.Group className="mb-3" controlId="login-password">
                    <Form.Label>Hasło</Form.Label>
                    <Form.Control
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </Form.Group>
                {error && <div className="text-danger mb-3">{error}</div>}
                <Button type="submit" className="w-100" disabled={busy || !login.trim() || !password}>Zaloguj</Button>
            </Form>
        </AuthScreen>
    );
}
