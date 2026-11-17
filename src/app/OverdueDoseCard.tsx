import React, { useState } from 'react';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Dropdown from 'react-bootstrap/Dropdown';
import Row from 'react-bootstrap/Row';
import { TfiCheck, TfiClose } from 'react-icons/tfi';
import TakeDoseDialog from '../medicine/TakeDoseDialog';
import IMedicine from '../models/IMedicine';
import OverdueDose from '../models/OverdueDoses';
import { formatAmountForDisplay } from '../utils/fraction';
import { countAmountInCurrentPackage } from '../utils/medicineMath';

interface OverdueDoseCardProps {
    dose: OverdueDose;
    medicines: IMedicine[];
    onSkip: () => void;
    /** amount: ilość faktycznie przyjęta; undefined = domyślna ilość z dawki. */
    onConfirm: (amount?: number) => void;
}

export default function OverdueDoseCard({ dose, medicines, onSkip, onConfirm }: OverdueDoseCardProps) {
    const [customAmountDialogOpen, setCustomAmountDialogOpen] = useState(false);

    const medicine = medicines.find(m => m.name === dose.medicineName);
    const stock = medicine?.count ?? 0;
    const stockLow = stock < dose.amount;
    const inPackage = countAmountInCurrentPackage(medicine);

    const handleCustomAmountSubmit = (amount: number) => {
        setCustomAmountDialogOpen(false);
        onConfirm(amount);
    };

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
                        <Dropdown as={ButtonGroup} align="end">
                            <Button
                                size="sm"
                                className="py-0 px-2"
                                disabled={stockLow || dose.disabled}
                                onClick={() => onConfirm()}
                            >
                                <TfiCheck /> <span className="d-none d-md-inline">Potwierdź</span>
                            </Button>
                            {/* Mniejszą dawkę da się przyjąć nawet wtedy, gdy zapas nie starcza na domyślną. */}
                            <Dropdown.Toggle
                                split
                                size="sm"
                                className="py-0 px-2"
                                disabled={stock <= 0 || dose.disabled}
                                aria-label="Inna ilość"
                            />
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => setCustomAmountDialogOpen(true)}>
                                    Potwierdź inną ilość…
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Col>
                </Row>
                <TakeDoseDialog
                    visible={customAmountDialogOpen}
                    medicineName={dose.medicineName}
                    maxAmount={stock}
                    initialAmount={dose.amount}
                    onSubmit={handleCustomAmountSubmit}
                    onCancel={() => setCustomAmountDialogOpen(false)}
                />
            </Card.Body>
        </Card>
    );
}
