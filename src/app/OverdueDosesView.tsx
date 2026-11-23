import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Tab from 'react-bootstrap/Tab';
import IMedicine from '../models/IMedicine';
import OverdueDose from '../models/OverdueDoses';
import OverdueDoseGroup from '../models/OverdueDosesGroup';
import { formatDoseTimestamp } from '../utils/dateFormat';
import { PurchaseDeadline } from '../utils/prescriptionStatus';
import EmptyState from './EmptyState';
import OverdueDoseCard from './OverdueDoseCard';
import PurchaseDeadlinesPanel from './PurchaseDeadlinesPanel';

interface OverdueDosesViewProps {
    medicines: IMedicine[];
    groups: OverdueDoseGroup[];
    purchaseDeadlines: PurchaseDeadline[];
    onSkipDose: (group: OverdueDoseGroup, dose: OverdueDose) => void;
    /** amount: ilość faktycznie przyjęta; undefined = domyślna ilość z dawki. */
    onConfirmDose: (group: OverdueDoseGroup, dose: OverdueDose, amount?: number) => void;
}

export default function OverdueDosesView({ medicines, groups, purchaseDeadlines, onSkipDose, onConfirmDose }: OverdueDosesViewProps) {
    const hasMedicines = medicines.length > 0;

    return (
        <Tab.Pane eventKey="missingDoses" className="justify-content-center">
            <PurchaseDeadlinesPanel deadlines={purchaseDeadlines} />
            {!hasMedicines && <EmptyState title="Brak leków" hint="Dodaj lek w zakładce „Lista leków”" />}
            <Row hidden={!hasMedicines || groups.length !== 0} className="mt-5 text-center">
                <Col>
                    <h4>Gratulacje!</h4>
                    <h6>Wszystkie leki zostały wzięte</h6>
                </Col>
            </Row>
            <Row>
                <Col>
                    {groups.map(group => (
                        <div key={`overdue-group-${group.date}`}>
                            <Row>
                                <Col xs="auto" className="d-flex align-items-center">
                                    <strong className="text-secondary">
                                        <small>{formatDoseTimestamp(group.date)}</small>
                                    </strong>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    {group.doses.map(dose => (
                                        <OverdueDoseCard
                                            key={`overdue-dose-${dose.id}`}
                                            dose={dose}
                                            medicines={medicines}
                                            onSkip={() => onSkipDose(group, dose)}
                                            onConfirm={amount => onConfirmDose(group, dose, amount)}
                                        />
                                    ))}
                                </Col>
                            </Row>
                        </div>
                    ))}
                </Col>
            </Row>
        </Tab.Pane>
    );
}
