import React, { ReactNode } from 'react';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import logo from '../assets/logo192.png';

/** Wspólna oprawa ekranów logowania i zmiany hasła: logo, nazwa aplikacji i karta z formularzem. */
export default function AuthScreen({ children }: { children: ReactNode }) {
    return (
        <Container className="pt-5" style={{ maxWidth: '24rem' }}>
            <div className="text-center mb-4">
                <img src={logo} alt="webtabsy logo" style={{ height: '48px' }} className="mb-2" />
                <div><strong>WEBTABSY</strong></div>
            </div>
            <Card>
                <Card.Body>{children}</Card.Body>
            </Card>
        </Container>
    );
}
