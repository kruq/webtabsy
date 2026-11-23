import React, { forwardRef, ReactNode } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import { BsCalendarWeek, BsCardList, BsClockHistory, BsFileEarmarkMedical, BsPeople, BsPersonCheck } from 'react-icons/bs';

interface BottomNavProps {
    /** Treść przyklejona do dołu ekranu nad przyciskami zakładek (np. przycisk „Weź lek doraźny”). */
    children?: ReactNode;
    /** Zakładka zarządzania kontami - tylko dla administratora. */
    showUsers?: boolean;
}

const BottomNav = forwardRef<HTMLDivElement, BottomNavProps>(({ children, showUsers }, ref) => {
    return (
        <Container ref={ref} className="fixed-bottom p-3" style={{ backgroundColor: '#fafafc' }}>
            {children}
            <Nav variant="pills" className="nav-justified">
                <Nav.Item>
                    <Nav.Link eventKey="missingDoses">
                        <BsPersonCheck /> <span className="d-none d-md-inline">Status</span>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="medicines">
                        <BsCardList /> <span className="d-none d-md-inline">Lista leków</span>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="schedule">
                        <BsCalendarWeek /> <span className="d-none d-md-inline">Grafik</span>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="prescriptions">
                        <BsFileEarmarkMedical /> <span className="d-none d-md-inline">Recepty</span>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="doseLog">
                        <BsClockHistory /> <span className="d-none d-md-inline">Historia</span>
                    </Nav.Link>
                </Nav.Item>
                {showUsers && (
                    <Nav.Item>
                        <Nav.Link eventKey="users">
                            <BsPeople /> <span className="d-none d-md-inline">Użytkownicy</span>
                        </Nav.Link>
                    </Nav.Item>
                )}
            </Nav>
        </Container>
    );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
