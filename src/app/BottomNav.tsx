import React from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import { BsCardList, BsFillCalendarWeekFill, BsFillPersonCheckFill } from 'react-icons/bs';

export default function BottomNav() {
    return (
        <Container className="fixed-bottom p-3" style={{ backgroundColor: '#fafafc' }}>
            <Nav variant="pills" className="nav-justified">
                <Nav.Item>
                    <Nav.Link eventKey="missingDoses">
                        <BsFillPersonCheckFill /> <span className="d-none d-md-inline">Status</span>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="medicines">
                        <BsCardList /> <span className="d-none d-md-inline">Lista leków</span>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="schedule">
                        <BsFillCalendarWeekFill /> <span className="d-none d-md-inline">Grafik</span>
                    </Nav.Link>
                </Nav.Item>
            </Nav>
        </Container>
    );
}
