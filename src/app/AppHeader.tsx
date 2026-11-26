import React, { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import logo from '../assets/logo192.png';
import { AuthUser } from '../services/auth.service';
import { clearJustUpdated, wasJustUpdated } from '../swUpdate';
import ProfileDialog from './ProfileDialog';

const APP_VERSION = process.env.REACT_APP_VERSION ?? 'dev';
const UPDATED_MESSAGE_MS = 10_000;

interface AppHeaderProps {
    syncTimestamp: number;
    errorMessage: string;
    showPermissionAlert: boolean;
    onDismissPermissionAlert: () => void;
    user: AuthUser;
    onLogout: () => void;
    onUserChanged: (user: AuthUser) => void;
}

export default function AppHeader({
    syncTimestamp,
    errorMessage,
    showPermissionAlert,
    onDismissPermissionAlert,
    user,
    onLogout,
    onUserChanged,
}: AppHeaderProps) {
    // Po automatycznym przeładowaniu do nowej wersji - informacja na 10 s.
    const [justUpdated, setJustUpdated] = useState(wasJustUpdated);
    const [profileOpen, setProfileOpen] = useState(false);

    useEffect(() => {
        if (!justUpdated) return;
        clearJustUpdated();
        const timer = setTimeout(() => setJustUpdated(false), UPDATED_MESSAGE_MS);
        return () => clearTimeout(timer);
    }, [justUpdated]);

    return (
        <Container className="sticky-top p-3" style={{ backgroundColor: '#fafafc' }}>
            <Row>
                <Col>
                    <Alert
                        onClose={onDismissPermissionAlert}
                        variant="warning"
                        dismissible
                        hidden={!showPermissionAlert}
                    >
                        Brak uprawnień do wyświetlania powiadomień
                    </Alert>
                    <Alert variant="danger" hidden={errorMessage.length === 0}>{errorMessage}</Alert>
                    {justUpdated && (
                        <Alert variant="success" className="py-2">Aplikacja zaktualizowana do v{APP_VERSION}</Alert>
                    )}
                </Col>
            </Row>
            <Row>
                <Col>
                    <strong>
                        <img src={logo} alt="webtabsy logo" style={{ height: '16px' }} className="me-3" />
                        WEBTABSY
                    </strong>
                </Col>
                <Col xs="auto" className="text-end text-secondary">
                    <span style={{ fontSize: '1.2rem' }}>{syncTimestamp < 5 ? '⌛ ' : ''}</span>
                    <small className="me-2">
                        <Button
                            variant="link"
                            size="sm"
                            className="p-0 align-baseline"
                            title="Profil"
                            onClick={() => setProfileOpen(true)}
                        >
                            {user.name}
                        </Button>
                        {' '}·{' '}
                        <Button variant="link" size="sm" className="p-0 align-baseline" onClick={onLogout}>Wyloguj</Button>
                    </small>
                    <span style={{ fontSize: '0.5rem' }}>v. {APP_VERSION}</span>
                </Col>
            </Row>
            <ProfileDialog
                visible={profileOpen}
                user={user}
                onSaved={onUserChanged}
                onClose={() => setProfileOpen(false)}
            />
        </Container>
    );
}
