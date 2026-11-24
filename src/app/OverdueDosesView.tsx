import React from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Tab from 'react-bootstrap/Tab';
import { TfiAlert, TfiCheck } from 'react-icons/tfi';
import IMedicine from '../models/IMedicine';
import OverdueDose from '../models/OverdueDoses';
import OverdueDoseGroup from '../models/OverdueDosesGroup';
import { formatDoseTimestamp } from '../utils/dateFormat';
import { PurchaseDeadline } from '../utils/prescriptionStatus';
import { confirmAllDoses } from './doseActions';
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
    onOpenMedicine: (medicineId: string) => void;
    /** „Weź wszystkie”: potwierdzenie wszystkich pozostałych dawek grupy w domyślnej ilości. */
    onConfirmAll: (group: OverdueDoseGroup) => void;
}

/**
 * „Weź wszystkie” - tylko przy co najmniej dwóch pozostałych dawkach. Gdy którejś nie da się potwierdzić
 * (za mało leku na domyślną ilość), przycisk jest wyszarzony i zamiast ✓ ma ostrzeżenie.
 */
function ConfirmAllButton({ group, medicines, onConfirmAll }: {
    group: OverdueDoseGroup;
    medicines: IMedicine[];
    onConfirmAll: (group: OverdueDoseGroup) => void;
}) {
    if (group.doses.length < 2) return null;
    const { allConfirmed, confirmed } = confirmAllDoses(medicines, [group], group);
    // Podpowiedź po najechaniu: zwykły atrybut title na otaczającym spanie - wyłączony przycisk Bootstrapa
    // ma pointer-events: none, więc sam nie pokazałby podpowiedzi.
    const lacking = group.doses.filter(d => !confirmed.includes(d)).map(d => d.medicineName);
    const hint = allConfirmed ? undefined : `Za mało leku, żeby potwierdzić: ${lacking.join(', ')}`;
    return (
        <span title={hint} className="d-inline-block">
            {/* Ikona i napis wyśrodkowane w pionie (flex); w stanie ostrzeżenia przycisk jest pomarańczowy. */}
            <Button
                size="sm"
                className={`d-inline-flex align-items-center gap-1${allConfirmed ? '' : ' confirm-all-warning'}`}
                disabled={!allConfirmed}
                onClick={() => onConfirmAll(group)}
                aria-label={allConfirmed ? 'Weź wszystkie' : `Weź wszystkie - ${hint}`}
            >
                {allConfirmed ? <TfiCheck /> : <TfiAlert />}
                <span>Weź wszystkie</span>
            </Button>
        </span>
    );
}

export default function OverdueDosesView({
    medicines, groups, purchaseDeadlines, onSkipDose, onConfirmDose, onOpenMedicine, onConfirmAll,
}: OverdueDosesViewProps) {
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
                            <Row className="align-items-center">
                                <Col xs="auto" className="d-flex align-items-center">
                                    <strong className="text-secondary">
                                        <small>{formatDoseTimestamp(group.date)}</small>
                                    </strong>
                                </Col>
                                <Col className="text-end">
                                    <ConfirmAllButton group={group} medicines={medicines} onConfirmAll={onConfirmAll} />
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
                                            onOpenMedicine={onOpenMedicine}
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
