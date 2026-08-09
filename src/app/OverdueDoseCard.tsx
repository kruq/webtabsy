import React from 'react';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { TfiCheck, TfiClose } from 'react-icons/tfi';
import IMedicine from '../models/IMedicine';
import OverdueDose from '../models/OverdueDoses';
import { formatAmountForDisplay } from '../utils/fraction';
import { countAmountInCurrentPackage } from '../utils/medicineMath';

interface OverdueDoseCardProps {
    dose: OverdueDose;
    medicines: IMedicine[];
    onSkip: () => void;
    onConfirm: () => void;
}

export default function OverdueDoseCard({ dose, medicines, onSkip, onConfirm }: OverdueDoseCardProps) {
    const medicine = medicines.find(m => m.name === dose.medicineName);
    const stock = medicine?.count ?? 0;
    const stockLow = stock < dose.amount;
    const inPackage = countAmountInCurrentPackage(medicine);

    return (
        <Card
            className="my-2"
            style={{ backgroundColor: dose.todaysDate > new Date() ? '#eceff1' : 'white' }}
        >
            <Card.Body>
                <Row className="d-flex align-items-center">
                    <Col xs="auto">
                        <Button variant="outline-secondary" size="sm" className="py-0 px-2" onClick={onSkip}>
                            <TfiClose /> <span className="d-none d-md-inline">Pomiń</span>
                        </Button>
                    </Col>
                    <Col className="p-0">
                        <div>
                            <strong>{formatAmountForDisplay(dose.amount)} x {dose.medicineName} </strong>
                            <small style={{ verticalAlign: 'top', marginLeft: '5px' }}>
                                <Badge bg={stockLow ? 'danger' : 'secondary'} pill>
                                    {formatAmountForDisplay(stock)}{inPackage !== undefined ? ` (${formatAmountForDisplay(inPackage)})` : ''}
                                </Badge>
                            </small>
                        </div>
                        <div>
                            <small className="text-secondary">{dose.meal}</small>
                        </div>
                    </Col>
                    <Col xs="auto">
                        <Button
                            size="sm"
                            className="py-0 px-2"
                            disabled={stockLow || dose.disabled}
                            onClick={onConfirm}
                        >
                            <TfiCheck /> <span className="d-none d-md-inline">Potwierdź</span>
                        </Button>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
}
