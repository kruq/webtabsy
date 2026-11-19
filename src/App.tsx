import React, { useMemo, useRef, useState } from 'react';
import './App.css';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import Tab from 'react-bootstrap/Tab';
import AppHeader from './app/AppHeader';
import AuthScreen from './app/AuthScreen';
import ChangePasswordView from './app/ChangePasswordView';
import LoginView from './app/LoginView';
import { useAuth } from './app/useAuth';
import UsersView from './app/UsersView';
import AsNeededPanel from './app/AsNeededPanel';
import BottomNav from './app/BottomNav';
import { applyDoseAction, buildScheduledDoseLogEntry, buildUnscheduledDoseLogEntry } from './app/doseActions';
import DoseLogView from './app/DoseLogView';
import MedicineListView from './app/MedicineListView';
import OverdueDosesView from './app/OverdueDosesView';
import { PrescriptionDraft } from './app/PrescriptionDialog';
import { resolveNewMedicines } from './app/prescriptionDraft';
import { applyPrescriptionPurchase, PrescriptionItemPurchase } from './app/prescriptionPurchase';
import PrescriptionsView from './app/PrescriptionsView';
import { usePrescriptions } from './app/usePrescriptions';
import { useMedicines } from './app/useMedicines';
import { useSyncTimer } from './app/useSyncTimer';
import { useElementHeight } from './hooks/useElementHeight';
import IMedicine from './models/IMedicine';
import { AuthUser } from './services/auth.service';
import Prescription from './models/Prescription';
import OverdueDose from './models/OverdueDoses';
import OverdueDoseGroup from './models/OverdueDosesGroup';
import Schedule from './schedule.component';
import { tryAddDoseLogEntry } from './services/doseLog.service';
import { createMedicine, updateMedicine as persistMedicine } from './services/medicine.service';
import { subtractAmount } from './utils/fraction';
import { tabletsOnPrescriptions, upcomingPurchaseDeadlines } from './utils/prescriptionStatus';

const STATUS_TAB = 'missingDoses';
// Minimalny odstęp treści od dołu ekranu, zanim zmierzymy faktyczną wysokość dolnego paska.
const MIN_BOTTOM_PADDING_PX = 60;

interface MainAppProps {
    user: AuthUser;
    onLogout: () => void;
    onUserChanged: (user: AuthUser) => void;
}

/** Aplikacja zalogowanego użytkownika; montowana od nowa (key) przy zmianie użytkownika, więc dane się nie mieszają. */
function MainApp({ user, onLogout, onUserChanged }: MainAppProps) {
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

    const { prescriptions, specializations, doctors, savePrescription, removePrescription, addSpecialization, addDoctor } =
        usePrescriptions();
    const prescriptionTablets = useMemo(() => tabletsOnPrescriptions(prescriptions), [prescriptions]);

    const [selectedMedicineId, setSelectedMedicineId] = useState('');
    const [showPermissionAlert, setShowPermissionAlert] = useState(false);
    const [activeTab, setActiveTab] = useState(STATUS_TAB);
    // Dolny pasek jest fixed i rośnie z panelem leków doraźnych - treść musi kończyć się nad nim.
    const bottomNavRef = useRef<HTMLDivElement>(null);
    const bottomNavHeight = useElementHeight(bottomNavRef);

    const syncTimestamp = useSyncTimer(refresh);

    const handleMedicineClick = (id: string) => {
        setSelectedMedicineId(prev => (prev === id ? '' : id));
    };

    const runDoseAction = async (
        group: OverdueDoseGroup,
        dose: OverdueDose,
        action: 'skip' | 'confirm',
        takenAmount?: number,
    ) => {
        const result = applyDoseAction(medicines, overdueGroups, group, dose, action, takenAmount);
        if (!result.medicineToPersist) return;
        if (action === 'confirm') dose.disabled = true;
        setMedicines(result.medicines);
        setOverdueGroups(result.overdueGroups);
        try {
            await persistMedicine(result.medicineToPersist);
        } catch (e) {
            console.error(e);
            return;
        }
        await tryAddDoseLogEntry(buildScheduledDoseLogEntry(result.medicineToPersist, dose, action, takenAmount));
    };

    const takeAsNeeded = async (medicine: IMedicine, amount: number) => {
        if (amount <= 0 || amount > medicine.count) return;
        const takenAt = new Date();
        await saveMedicine(medicine.id, { count: subtractAmount(medicine.count, amount) });
        await tryAddDoseLogEntry(buildUnscheduledDoseLogEntry(medicine, amount, takenAt));
    };

    const handleSavePrescription = async (draft: PrescriptionDraft) => {
        const { items, createdAny } = await resolveNewMedicines(draft.items, medicines, createMedicine);
        await savePrescription({ ...draft, items });
        if (createdAny) await refresh();
    };

    const handlePrescriptionPurchase = async (
        prescription: Prescription,
        purchaseDate: Date,
        purchases: PrescriptionItemPurchase[],
    ) => {
        // Jak przy zwykłym kupowaniu: lek, który się skończył, może zacząć dawkowanie od nowa.
        const medicineIds = new Set(
            purchases
                .map(p => prescription.items.find(i => i.id === p.itemId)?.medicineId)
                .filter((id): id is string => Boolean(id)),
        );
        const resetDosesFor = new Set<string>();
        for (const id of Array.from(medicineIds)) {
            const medicine = medicines.find(m => m.id === id);
            if (medicine && !medicine.count && medicine.doses.length > 0
                && window.confirm(`${medicine.name}: czy chcesz zresetować następny dzień dawkowania?`)) {
                resetDosesFor.add(id);
            }
        }

        const result = applyPrescriptionPurchase(prescription, medicines, purchases, purchaseDate, resetDosesFor);
        // Najpierw leki, potem recepta: błąd przy leku przerywa zapis, zanim recepta pokaże wykupione opakowania.
        for (const medicine of result.medicines) {
            await persistMedicine(medicine);
        }
        await savePrescription(result.prescription);
        await refresh();
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
                userName={user.name}
                onLogout={onLogout}
                onUserChanged={onUserChanged}
            />
            <Container className="position-relative pt-3">
                <div>{medicines.length === 0 && <span>Synchronizacja danych...</span>}</div>
                <Tab.Container activeKey={activeTab} onSelect={key => setActiveTab(key ?? STATUS_TAB)}>
                    <Row
                        hidden={medicines.length === 0}
                        style={{ paddingBottom: `${Math.max(MIN_BOTTOM_PADDING_PX, bottomNavHeight)}px` }}
                    >
                        <Col>
                            <Tab.Content>
                                <OverdueDosesView
                                    medicines={medicines}
                                    groups={overdueGroups}
                                    purchaseDeadlines={upcomingPurchaseDeadlines(prescriptions)}
                                    onSkipDose={(g, d) => runDoseAction(g, d, 'skip')}
                                    onConfirmDose={(g, d, amount) => runDoseAction(g, d, 'confirm', amount)}
                                />
                                <MedicineListView
                                    medicines={medicines}
                                    selectedMedicineId={selectedMedicineId}
                                    onMedicineClick={handleMedicineClick}
                                    onAddMedicine={addNewMedicine}
                                    onUpdateMedicine={saveMedicine}
                                    onDeleteMedicine={removeMedicine}
                                    tabletsOnPrescriptions={prescriptionTablets}
                                />
                                <Tab.Pane eventKey="schedule">
                                    <Schedule medicines={medicines} />
                                </Tab.Pane>
                                <Tab.Pane eventKey="prescriptions">
                                    <PrescriptionsView
                                        prescriptions={prescriptions}
                                        medicines={medicines}
                                        specializations={specializations}
                                        doctors={doctors}
                                        onSave={handleSavePrescription}
                                        onDelete={removePrescription}
                                        onAddSpecialization={addSpecialization}
                                        onAddDoctor={addDoctor}
                                        onPurchase={handlePrescriptionPurchase}
                                    />
                                </Tab.Pane>
                                {/* Montowany przy każdym wejściu w zakładkę, żeby pokazać świeże wpisy. */}
                                <Tab.Pane eventKey="doseLog" mountOnEnter unmountOnExit>
                                    <DoseLogView />
                                </Tab.Pane>
                                {user.isAdmin && (
                                    <Tab.Pane eventKey="users" mountOnEnter unmountOnExit>
                                        <UsersView />
                                    </Tab.Pane>
                                )}
                            </Tab.Content>
                        </Col>
                    </Row>
                    <BottomNav ref={bottomNavRef} showUsers={user.isAdmin}>
                        {activeTab === STATUS_TAB && <AsNeededPanel medicines={medicines} onTake={takeAsNeeded} />}
                    </BottomNav>
                </Tab.Container>
            </Container>
        </>
    );
}

function App() {
    const { state, login, logout, setUser, retry } = useAuth();

    switch (state.status) {
        case 'loading':
            return (
                <div className="text-center" style={{ paddingTop: '40vh' }}>
                    <Spinner animation="border" variant="primary" />
                </div>
            );
        case 'offline':
            return (
                <AuthScreen>
                    <p className="text-danger">Brak połączenia z serwerem.</p>
                    <Button className="w-100" onClick={retry}>Spróbuj ponownie</Button>
                </AuthScreen>
            );
        case 'loggedOut':
            return <LoginView onLogin={login} />;
        case 'mustChangePassword':
            return <ChangePasswordView user={state.user} onChanged={setUser} onLogout={logout} />;
        case 'ready':
            return <MainApp key={state.user.id} user={state.user} onLogout={logout} onUserChanged={setUser} />;
    }
}

export default App;
