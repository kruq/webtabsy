import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { AuthUser, createUser, DEFAULT_PASSWORD, fetchUsers, passwordProblem, resetUserPassword } from '../services/auth.service';
import { ApiError } from '../services/http';

/** Zarządzanie kontami - zakładka widoczna tylko dla administratora. */
export default function UsersView() {
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [error, setError] = useState('');
    const [name, setName] = useState('');
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        try {
            setUsers(await fetchUsers());
        } catch (e) {
            console.error(e);
            setError('Nie udało się pobrać użytkowników');
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const problem = password ? passwordProblem(password) : undefined;
    const valid = name.trim().length > 0 && login.trim().length > 0 && password.length > 0 && !problem;

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        if (!valid) return;
        setSaving(true);
        setError('');
        try {
            await createUser({ name: name.trim(), login: login.trim(), password });
            setName('');
            setLogin('');
            setPassword('');
            await load();
        } catch (err) {
            console.error(err);
            // API zwraca 400 m.in. dla zajętego loginu.
            setError(err instanceof ApiError && err.status === 400 ? 'Ten login jest już zajęty' : 'Nie udało się dodać użytkownika');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async (user: AuthUser) => {
        if (!window.confirm(`Zresetować hasło użytkownika ${user.name}? Hasło zmieni się na „${DEFAULT_PASSWORD}”, a przy logowaniu trzeba będzie ustawić nowe.`)) {
            return;
        }
        try {
            await resetUserPassword(user.id);
            await load();
        } catch (e) {
            console.error(e);
            alert('Nie udało się zresetować hasła');
        }
    };

    return (
        <>
            <h6 className="text-accent">Użytkownicy</h6>
            {users.map(user => (
                <Card key={user.id} className="my-2">
                    <Card.Body className="py-2">
                        <Row className="align-items-center">
                            <Col>
                                <strong>{user.name}</strong>{' '}
                                <small className="text-secondary">{user.login}</small>
                                {user.isAdmin && <Badge bg="secondary" className="ms-1">administrator</Badge>}
                                {user.mustChangePassword && <Badge bg="warning" text="dark" className="ms-1">czeka na nowe hasło</Badge>}
                            </Col>
                            <Col xs="auto">
                                <Button size="sm" variant="outline-danger" onClick={() => handleReset(user)}>Resetuj hasło</Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            ))}

            <h6 className="text-accent mt-4">Nowy użytkownik</h6>
            <Card>
                <Card.Body>
                    <Form onSubmit={handleCreate}>
                        <Form.Group className="mb-2" controlId="new-user-name">
                            <Form.Label>Nazwa</Form.Label>
                            <Form.Control type="text" value={name} onChange={e => setName(e.target.value)} />
                        </Form.Group>
                        <Form.Group className="mb-2" controlId="new-user-login">
                            <Form.Label>Login</Form.Label>
                            <Form.Control type="text" autoCapitalize="none" value={login} onChange={e => setLogin(e.target.value)} />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="new-user-password">
                            <Form.Label>Hasło</Form.Label>
                            <Form.Control
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                isInvalid={!!problem}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <Form.Control.Feedback type="invalid">{problem}</Form.Control.Feedback>
                        </Form.Group>
                        {error && <div className="text-danger mb-2">{error}</div>}
                        <div className="text-end">
                            <Button type="submit" size="sm" disabled={!valid || saving}>Dodaj użytkownika</Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </>
    );
}
