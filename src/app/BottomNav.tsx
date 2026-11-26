import React, { forwardRef, ReactNode } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import { BsCalendarWeek, BsCardList, BsClockHistory, BsFileEarmarkMedical, BsPeople, BsPersonCheck } from 'react-icons/bs';

interface BottomNavProps {
    /** Treść przyklejona do dołu ekranu nad przyciskami zakładek (np. przycisk „Potwierdź lek doraźny”). */
    children?: ReactNode;
    /** Zakładka zarządzania kontami - tylko dla administratora. */
    showUsers?: boolean;
}

const BottomNav = forwardRef<HTMLDivElement, BottomNavProps>(({ children, showUsers }, ref) => {
    return (
        <Container ref={ref} fluid className="app-container fixed-bottom p-3" style={{ backgroundColor: '#fafafc' }}>
            {children}
            {/* Od tabletu do 991px ikona nad napisem we wszystkich zakładkach, od 992px obok siebie (App.css). */}
            <Nav variant="pills" className="nav-justified">
                <Nav.Item>
                    <Nav.Link eventKey="missingDoses" className="bottom-nav-link">
                        <BsPersonCheck /> <span className="d-none d-md-inline">Status</span>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="medicines" className="bottom-nav-link">
                        <BsCardList /> <span className="d-none d-md-inline">Lista leków</span>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="schedule" className="bottom-nav-link">
                        <BsCalendarWeek /> <span className="d-none d-md-inline">Grafik</span>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="prescriptions" className="bottom-nav-link">
                        <BsFileEarmarkMedical /> <span className="d-none d-md-inline">Recepty</span>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="doseLog" className="bottom-nav-link">
                        <BsClockHistory /> <span className="d-none d-md-inline">Historia</span>
                    </Nav.Link>
                </Nav.Item>
                {showUsers && (
                    <Nav.Item>
                        <Nav.Link eventKey="users" className="bottom-nav-link">
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
