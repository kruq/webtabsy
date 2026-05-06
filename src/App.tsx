import React, { useState } from 'react';
import './App.css';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import Tab from 'react-bootstrap/Tab';
import AppHeader from './app/AppHeader';
import BottomNav from './app/BottomNav';
import { applyDoseAction } from './app/doseActions';
import MedicineListView from './app/MedicineListView';
import OverdueDosesView from './app/OverdueDosesView';
import { useMedicines } from './app/useMedicines';
import { useSyncTimer } from './app/useSyncTimer';
import OverdueDose from './models/OverdueDoses';
import OverdueDoseGroup from './models/OverdueDosesGroup';
import Schedule from './schedule.component';
import { updateMedicine as persistMedicine } from './services/medicine.service';

function App() {
    const {
        medicines,
        overdueGroups,
        errorMessage,
        showSpinner,
        refresh,
        addNewMedicine,
        saveMedicine,
        removeMedicine,
        setMedicines,
        setOverdueGroups,
    } = useMedicines();

    const [selectedMedicineId, setSelectedMedicineId] = useState('');
    const [showPermissionAlert, setShowPermissionAlert] = useState(false);

    const syncTimestamp = useSyncTimer(refresh);

    const handleMedicineClick = (id: string) => {
        setSelectedMedicineId(prev => (prev === id ? '' : id));
    };

    const runDoseAction = async (group: OverdueDoseGroup, dose: OverdueDose, action: 'skip' | 'confirm') => {
        const result = applyDoseAction(medicines, overdueGroups, group, dose, action);
        if (!result.medicineToPersist) return;
        if (action === 'confirm') dose.disabled = true;
        setMedicines(result.medicines);
        setOverdueGroups(result.overdueGroups);
        try {
            await persistMedicine(result.medicineToPersist);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <>
            {showSpinner && (
                <div
                    style={{
                        position: 'absolute', top: 0, left: 0, bottom: 0, right: 0,
                        backgroundColor: '#fafafc', zIndex: 1000,
                        display: 'flex', justifyContent: 'center', alignItems: 'start',
                        paddingTop: '40vh',
                    }}
                >
                    <h3><Spinner animation="border" variant="primary" /> Ładowanie...</h3>
                </div>
            )}
            <AppHeader
                syncTimestamp={syncTimestamp}
                errorMessage={errorMessage}
                showPermissionAlert={showPermissionAlert}
                onDismissPermissionAlert={() => setShowPermissionAlert(false)}
            />
            <Container className="position-relative pt-3">
                <div>{medicines.length === 0 && <span>Synchronizacja danych...</span>}</div>
                <Tab.Container defaultActiveKey="missingDoses">
                    <Row hidden={medicines.length === 0} style={{ paddingBottom: '60px' }}>
                        <Col>
                            <Tab.Content>
                                <OverdueDosesView
                                    medicines={medicines}
                                    groups={overdueGroups}
                                    onSkipDose={(g, d) => runDoseAction(g, d, 'skip')}
                                    onConfirmDose={(g, d) => runDoseAction(g, d, 'confirm')}
                                />
                                <MedicineListView
                                    medicines={medicines}
                                    selectedMedicineId={selectedMedicineId}
                                    onMedicineClick={handleMedicineClick}
                                    onAddMedicine={addNewMedicine}
                                    onUpdateMedicine={saveMedicine}
                                    onDeleteMedicine={removeMedicine}
                                />
                                <Tab.Pane eventKey="schedule">
                                    <Schedule medicines={medicines} />
                                </Tab.Pane>
                            </Tab.Content>
                        </Col>
                    </Row>
                    <BottomNav />
                </Tab.Container>
            </Container>
        </>
    );
}

export default App;
