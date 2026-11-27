import React, { useEffect, useMemo, useRef, useState } from 'react';
import _ from 'lodash';
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
import { applyDoseAction, buildUnscheduledDoseLogEntry, confirmAllDoses, withDoseTimes, withSavedDose } from './app/doseActions';
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
import Dose from './models/Dose';
import IMedicine from './models/IMedicine';
import { AuthUser, showsCurrentPackage, viewedUser } from './services/auth.service';
import Prescription from './models/Prescription';
import OverdueDose from './models/OverdueDoses';
import OverdueDoseGroup from './models/OverdueDosesGroup';
import Schedule from './schedule.component';
import { tryAddDoseLogEntry } from './services/doseLog.service';
import { ApiError } from './services/http';
import { recordDose } from './services/overdueDoses.service';
import { createMedicine, updateMedicine as persistMedicine } from './services/medicine.service';
import { subtractAmount } from './utils/fraction';
import { prescriptionEntries, tabletsOnPrescriptions, upcomingPurchaseDeadlines } from './utils/prescriptionStatus';
import { scrollToMedicineCard } from './utils/scrollToMedicine';
import { UnitsProvider } from './app/UnitsContext';

const STATUS_TAB = 'missingDoses';
const MEDICINES_TAB = 'medicines';
const PRESCRIPTIONS_TAB = 'prescriptions';
// Minimalny odstęp treści od dołu ekranu, zanim zmierzymy faktyczną wysokość dolnego paska.
const MIN_BOTTOM_PADDING_PX = 60;

interface MainAppProps {
    user: AuthUser;
    /** Czyje dane są wyświetlane: zalogowanego albo połączonego z nim użytkownika. */
    viewedUserId: string;
    onLogout: () => void;
    onUserChanged: (user: AuthUser) => void;
    onSwitchUser: (userId: string) => void;
    onConnectionsChanged: () => Promise<void>;
}

/**
 * Aplikacja zalogowanego użytkownika; montowana od nowa (key) przy zmianie zalogowanego i przy przełączeniu
 * na dane innego użytkownika, więc dane różnych kont nigdy się nie mieszają.
 */
function MainApp({ user, viewedUserId, onLogout, onUserChanged, onSwitchUser, onConnectionsChanged }: MainAppProps) {
    const viewed = viewedUser(user, viewedUserId);
    const {
        medicines,
        overdueGroups,
        loaded,
        errorMessage,
        showSpinner,
        refresh,
        addNewMedicine,
        saveMedicine,
        removeMedicine,
        setMedicines,
        setOverdueGroups,
        trackWrite,
        reportError,
    } = useMedicines();

    const { prescriptions, specializations, doctors, savePrescription, removePrescription, addSpecialization, addDoctor, removeDoctor } =
        usePrescriptions();
    const prescriptionTablets = useMemo(() => tabletsOnPrescriptions(prescriptions), [prescriptions]);
    const prescriptionsByMedicine = useMemo(() => prescriptionEntries(prescriptions), [prescriptions]);

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

    // Przejście ze Statusu do karty leku: zakładka "Lista leków", karta rozwinięta, strona przewinięta do niej.
    const [medicineToReveal, setMedicineToReveal] = useState<string | undefined>(undefined);
    // Nowy klucz montuje listę leków od nowa - czyści wpisane wyszukiwanie, które mogłoby ukryć ten lek.
    const [medicineListKey, setMedicineListKey] = useState(0);

    const openMedicine = (id: string) => {
        setSelectedMedicineId(id);
        setMedicineListKey(key => key + 1);
        setActiveTab(MEDICINES_TAB);
        setMedicineToReveal(id);
    };

    useEffect(() => {
        if (!medicineToReveal || activeTab !== MEDICINES_TAB) return;
        scrollToMedicineCard(medicineToReveal);
        setMedicineToReveal(undefined);
    }, [medicineToReveal, activeTab]);

    const runDoseAction = async (
        group: OverdueDoseGroup,
        dose: OverdueDose,
        action: 'skip' | 'confirm',
        takenAmount?: number,
    ) => {
        // Natychmiast na ekranie (karta znika, ilość maleje); prawdziwy stan przychodzi z API.
        const result = applyDoseAction(medicines, overdueGroups, group, dose, action, takenAmount);
        if (!result.medicineToPersist) return;
        dose.disabled = true;
        setMedicines(result.medicines);
        setOverdueGroups(result.overdueGroups);
        try {
            // nextDoseDate zaległej dawki to konkretne wystąpienie (dzień i godzina), którego dotyczy kliknięcie.
            const saved = await trackWrite(() => recordDose(dose.id, action, dose.nextDoseDate, takenAmount));
            setMedicines(prev => prev.map(m => (m.id === saved.id ? saved : m)));
        } catch (e) {
            // 409: to wystąpienie było już obsłużone (np. drugie kliknięcie albo inne urządzenie) - API niczego
            // nie zmieniło, a odświeżenie po zapisie pokaże prawdziwy stan.
            if (!(e instanceof ApiError && e.status === 409)) reportError(e);
        }
    };

    /** „Potwierdź wszystkie”: od razu na ekranie, potem zapis każdej dawki po kolei (jak pojedyncze „Potwierdź”). */
    const confirmAllInGroup = async (group: OverdueDoseGroup) => {
        const result = confirmAllDoses(medicines, overdueGroups, group);
        if (!result.allConfirmed) return;
        result.confirmed.forEach(dose => { dose.disabled = true; });
        setMedicines(result.medicines);
        setOverdueGroups(result.overdueGroups);
        for (const dose of result.confirmed) {
            try {
                const saved = await trackWrite(() => recordDose(dose.id, 'confirm', dose.nextDoseDate, undefined));
                setMedicines(prev => prev.map(m => (m.id === saved.id ? saved : m)));
            } catch (e) {
                if (!(e instanceof ApiError && e.status === 409)) reportError(e);
            }
        }
    };

    /** Grafik: nowa godzina dla wszystkich dawek z jednej godziny - jeden zapis na lek (lek może mieć kilka takich dawek). */
    const saveScheduleTime = async (doses: { medicineId: string; doseId: string }[], time: string) => {
        const byMedicine = _.groupBy(doses, d => d.medicineId);
        for (const [medicineId, medicineDoses] of Object.entries(byMedicine)) {
            const medicine = medicines.find(m => m.id === medicineId);
            if (!medicine) continue;
            await saveMedicine(medicineId, { doses: withDoseTimes(medicine.doses, new Set(medicineDoses.map(d => d.doseId)), time) });
        }
    };

    const saveScheduleDose = async (medicineId: string, dose: Dose) => {
        const medicine = medicines.find(m => m.id === medicineId);
        if (!medicine) return;
        await saveMedicine(medicineId, { doses: withSavedDose(medicine.doses, dose) });
    };

    const takeAsNeeded = async (medicine: IMedicine, amount: number) => {
        if (amount <= 0 || amount > medicine.count) return;
        const takenAt = new Date();
        await saveMedicine(medicine.id, { count: subtractAmount(medicine.count, amount) });
        await trackWrite(() => tryAddDoseLogEntry(buildUnscheduledDoseLogEntry(medicine, amount, takenAt)));
    };

    const handleSavePrescription = async (draft: PrescriptionDraft) => {
        // Nowe leki z recepty trafiają na listę leków; po zapisie dane i tak są odświeżane (trackWrite).
        await trackWrite(async () => {
            const { items } = await resolveNewMedicines(draft.items, medicines, createMedicine);
            await savePrescription({ ...draft, items });
        });
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
            if (medicine && !medicine.ignoreQuantity && !medicine.count && medicine.doses.length > 0
                && window.confirm(`${medicine.name}: czy chcesz zresetować następny dzień dawkowania?`)) {
                resetDosesFor.add(id);
            }
        }

        const result = applyPrescriptionPurchase(prescription, medicines, purchases, purchaseDate, resetDosesFor);
        // Najpierw leki, potem recepta: błąd przy leku przerywa zapis, zanim recepta pokaże wykupione opakowania.
        await trackWrite(async () => {
            for (const medicine of result.medicines) {
                await persistMedicine(medicine);
            }
            await savePrescription(result.prescription);
        });
    };

    return (
        <UnitsProvider medicines={medicines}>
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
            {/* Nagłówek i treść w jednym elemencie ograniczonym do 960px (dolne menu jest przyklejone do okna
                przez position: fixed, więc ma to samo ograniczenie osobno). */}
            <div className="app-container">
            <AppHeader
                syncTimestamp={syncTimestamp}
                errorMessage={errorMessage}
                showPermissionAlert={showPermissionAlert}
                onDismissPermissionAlert={() => setShowPermissionAlert(false)}
                user={user}
                viewed={viewed}
                onLogout={onLogout}
                onUserChanged={onUserChanged}
                onSwitchUser={onSwitchUser}
            />
            <Container fluid className="position-relative pt-3">
                {/* Do pierwszego wczytania danych; pusta lista leków (nowy użytkownik) to już wczytane dane. */}
                <div>{!loaded && <span>Synchronizacja danych...</span>}</div>
                <Tab.Container activeKey={activeTab} onSelect={key => setActiveTab(key ?? STATUS_TAB)}>
                    <Row
                        hidden={!loaded}
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
                                    onConfirmAll={confirmAllInGroup}
                                    onOpenMedicine={openMedicine}
                                    showCurrentPackage={showsCurrentPackage(viewed)}
                                    prescriptionEntries={prescriptionsByMedicine}
                                    onSetRunningOut={(id, runningOut) => saveMedicine(id, { runningOut })}
                                    onOpenPrescriptions={() => setActiveTab(PRESCRIPTIONS_TAB)}
                                />
                                <MedicineListView
                                    key={medicineListKey}
                                    medicines={medicines}
                                    selectedMedicineId={selectedMedicineId}
                                    onMedicineClick={handleMedicineClick}
                                    onAddMedicine={addNewMedicine}
                                    onUpdateMedicine={saveMedicine}
                                    onDeleteMedicine={removeMedicine}
                                    tabletsOnPrescriptions={prescriptionTablets}
                                />
                                <Tab.Pane eventKey="schedule">
                                    <Schedule medicines={medicines} onSaveDose={saveScheduleDose} onSaveTime={saveScheduleTime} />
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
                                        onDeleteDoctor={removeDoctor}
                                        onPurchase={handlePrescriptionPurchase}
                                    />
                                </Tab.Pane>
                                {/* Montowany przy każdym wejściu w zakładkę, żeby pokazać świeże wpisy. */}
                                <Tab.Pane eventKey="doseLog" mountOnEnter unmountOnExit>
                                    <DoseLogView />
                                </Tab.Pane>
                                {user.isAdmin && (
                                    <Tab.Pane eventKey="users" mountOnEnter unmountOnExit>
                                        <UsersView currentUserId={user.id} onConnectionsChanged={onConnectionsChanged} />
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
            </div>
        </UnitsProvider>
    );
}

function App() {
    const { state, login, logout, setUser, retry, switchUser, reloadUser } = useAuth();

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
            return (
                <MainApp
                    key={`${state.user.id}/${state.viewedUserId}`}
                    user={state.user}
                    viewedUserId={state.viewedUserId}
                    onLogout={logout}
                    onUserChanged={setUser}
                    onSwitchUser={switchUser}
                    onConnectionsChanged={reloadUser}
                />
            );
    }
}

export default App;
