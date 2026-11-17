import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import logo from '../assets/logo192.png';
import { applyUpdate } from '../swUpdate';
import { useServiceWorkerUpdate } from './useServiceWorkerUpdate';

const APP_VERSION = process.env.REACT_APP_VERSION ?? 'dev';

interface AppHeaderProps {
    syncTimestamp: number;
    errorMessage: string;
    showPermissionAlert: boolean;
    onDismissPermissionAlert: () => void;
}

export default function AppHeader({ syncTimestamp, errorMessage, showPermissionAlert, onDismissPermissionAlert }: AppHeaderProps) {
    const updateAvailable = useServiceWorkerUpdate();

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
                    {updateAvailable && (
                        <Alert variant="success" className="py-2 d-flex justify-content-between align-items-center">
                            <span>Nowa wersja</span>
                            <Button size="sm" onClick={applyUpdate}>Odśwież</Button>
                        </Alert>
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
                    <span style={{ fontSize: '0.5rem' }}>v. {APP_VERSION}</span>
                </Col>
            </Row>
        </Container>
    );
}
