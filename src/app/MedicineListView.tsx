import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Row from 'react-bootstrap/Row';
import Tab from 'react-bootstrap/Tab';
import Medicine from '../medicine/MedicineCard';
import IMedicine from '../models/IMedicine';
import AddMedicineDialog from './AddMedicineDialog';

interface MedicineListViewProps {
    medicines: IMedicine[];
    selectedMedicineId: string;
    onMedicineClick: (id: string) => void;
    onAddMedicine: (name: string) => Promise<void>;
    onUpdateMedicine: (id: string, params: Partial<IMedicine>) => Promise<void>;
    onDeleteMedicine: (id: string) => Promise<void>;
}

function shouldShow(m: IMedicine, selectedId: string, showAll: boolean, nameFilter: string): boolean {
    const matchesName = m.name.toLowerCase().includes(nameFilter.toLowerCase());
    const allowed = showAll || m.isVisible || m.id === selectedId || nameFilter.length > 0;
    return allowed && matchesName;
}

export default function MedicineListView(props: MedicineListViewProps) {
    const [showAll, setShowAll] = useState<boolean>(localStorage.getItem('showAll') === 'true');
    const [nameFilter, setNameFilter] = useState<string>('');
    const [addDialogOpen, setAddDialogOpen] = useState(false);

    const handleShowAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newShowAll = !e.target.checked;
        setShowAll(newShowAll);
        localStorage.setItem('showAll', newShowAll.toString());
        props.onMedicineClick('');
    };

    const handleAdd = async (name: string) => {
        await props.onAddMedicine(name);
        setAddDialogOpen(false);
    };

    const visible = props.medicines
        .filter(m => shouldShow(m, props.selectedMedicineId, showAll, nameFilter))
        .sort((a, b) => (a.name > b.name ? 1 : -1));

    return (
        <Tab.Pane eventKey="medicines">
            <Row className="sticky-top bg-light pt-3 pb-4" style={{ top: '45px' }}>
                <Col xs="auto">
                    <Button size="sm" variant="primary" onClick={() => setAddDialogOpen(true)} className="mr-2">Dodaj lek</Button>
                </Col>
                <Col>
                    <InputGroup size="sm">
                        <InputGroup.Text className="d-none d-md-flex">Szukaj:</InputGroup.Text>
                        <Form.Control
                            type="text"
                            placeholder="Nazwa leku"
                            onChange={e => setNameFilter(e.target.value)}
                            value={nameFilter}
                        />
                        <Button variant="outline-secondary" onClick={() => setNameFilter('')}>X</Button>
                    </InputGroup>
                </Col>
                <Col xs="auto" className="d-flex align-items-center">
                    <Form.Switch
                        checked={!showAll}
                        label={showAll ? 'wszystkie' : 'aktywne'}
                        onChange={handleShowAllChange}
                    />
                </Col>
            </Row>
            <AddMedicineDialog
                visible={addDialogOpen}
                onSubmit={handleAdd}
                onCancel={() => setAddDialogOpen(false)}
            />
            <Row>
                <Col>
                    {visible.map(m => (
                        <Medicine
                            key={`medicine-${m.id}`}
                            {...m}
                            idOfMedicineDetails={props.selectedMedicineId}
                            medicineClick={props.onMedicineClick}
                            updateMedicine={props.onUpdateMedicine}
                            deleteMedicine={props.onDeleteMedicine}
                        />
                    ))}
                </Col>
            </Row>
        </Tab.Pane>
    );
}
