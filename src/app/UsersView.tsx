import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import {
    AuthUser,
    connectUser,
    createUser,
    DEFAULT_PASSWORD,
    disconnectUser,
    fetchUsers,
    passwordProblem,
    resetUserPassword,
} from '../services/auth.service';
import { ApiError } from '../services/http';

interface ConnectDialogProps {
    user: AuthUser | undefined;
    onConnected: () => void;
    onClose: () => void;
}

/** Połączenie konta: hasło tego użytkownika podawane raz; potem jego dane są dostępne w przełączniku w nagłówku. */
function ConnectDialog({ user, onConnected, onClose }: ConnectDialogProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setPassword('');
        setError('');
    }, [user]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || password.length === 0) return;
        setSaving(true);
        setError('');
        try {
            await connectUser(user.id, password);
            onConnected();
        } catch (err) {
            console.error(err);
            setError(err instanceof ApiError && err.status === 400 ? 'Nieprawidłowe hasło' : 'Nie udało się połączyć konta');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={user !== undefined} onHide={onClose}>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title as="h5">Połącz konto</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="connect-user-password">
                        <Form.Label>Hasło użytkownika {user?.name}</Form.Label>
                        <Form.Control
                            type="password"
                            autoComplete="off"
                            autoFocus
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </Form.Group>
                    {error && <div className="text-danger mt-2">{error}</div>}
                </Modal.Body>
                <Modal.Footer>
                    <Button type="submit" disabled={password.length === 0 || saving}>Połącz</Button>
                    <Button variant="secondary" onClick={onClose}>Anuluj</Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

interface UsersViewProps {
    /** Zalogowany administrator - własnego konta nie łączy się. */
    currentUserId: string;
    /** Po połączeniu lub rozłączeniu: odświeżenie listy kont w przełączniku w nagłówku. */
    onConnectionsChanged: () => Promise<void>;
}

/** Zarządzanie kontami - zakładka widoczna tylko dla administratora. */
export default function UsersView({ currentUserId, onConnectionsChanged }: UsersViewProps) {
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [error, setError] = useState('');
    const [name, setName] = useState('');
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [connecting, setConnecting] = useState<AuthUser | undefined>(undefined);

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

    const handleConnected = async () => {
        setConnecting(undefined);
        await load();
        await onConnectionsChanged();
    };

    const handleDisconnect = async (user: AuthUser) => {
        if (!window.confirm(`Rozłączyć konto ${user.name}? Żeby znów zarządzać jego danymi, trzeba będzie podać jego hasło.`)) {
            return;
        }
        try {
            await disconnectUser(user.id);
            await load();
            await onConnectionsChanged();
        } catch (e) {
            console.error(e);
            alert('Nie udało się rozłączyć konta');
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
                                {user.isConnected && <Badge pill bg="primary" className="ms-1">połączony</Badge>}
                            </Col>
                            <Col xs="auto">
                                {user.id !== currentUserId && (user.isConnected ? (
                                    <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => handleDisconnect(user)}>
                                        Rozłącz
                                    </Button>
                                ) : (
                                    <Button size="sm" variant="outline-primary" className="me-2" onClick={() => setConnecting(user)}>
                                        Połącz
                                    </Button>
                                ))}
                                <Button size="sm" variant="outline-danger" onClick={() => handleReset(user)}>Resetuj hasło</Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            ))}

            <ConnectDialog user={connecting} onConnected={handleConnected} onClose={() => setConnecting(undefined)} />

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
