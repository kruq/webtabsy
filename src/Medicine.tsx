import React, { useState } from 'react';
import IMedicine from './models/IMedicine';
import { deleteMedicine, updateMedicine } from './services/medicine.service';

interface IMedicineProps {
    medicine: IMedicine,
    idOfMedicineDetails: string;
    medicineClick: (medicineId: string) => void
}

export default function Medicine(props: IMedicineProps) {

    const [medicine, setMedicine] = useState(props.medicine);


    const handleMedicineTitleClick = () => {
        props.medicineClick(medicine.id);
    }


    const handleMedicineCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const m: IMedicine = { ...medicine };
        m.count = parseFloat(event.target.value);
        setMedicine(m);
    }

    const handleMedicineDoseChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const m: IMedicine = { ...medicine };
        m.dose = parseFloat(event.target.value);
        setMedicine(m);
    }

    const handleMedicineDeleteClick = () => {
        deleteMedicine(medicine);
    }

    const handleMedicineSave = () => {
        updateMedicine(medicine);
    }

    const handleMissedDose = () => {
        const m: IMedicine = { ...medicine };
        m.count--;
        setMedicine(m);
        updateMedicine(m);
    }


    return (
        <div>
            <h3 className="medicine-title">
                <button onClick={handleMissedDose}>Pominięto</button>
                <span onClick={() => handleMedicineTitleClick()}>{medicine.name}: <small>{medicine.count} tab.</small></span>
            </h3>
            <div hidden={medicine.id !== props.idOfMedicineDetails}>
                <p><button onClick={handleMedicineDeleteClick}>Usuń</button></p>
                <p>Ilość tabletek: <input type="number" value={medicine.count} onChange={(e) => handleMedicineCountChange(e)} /></p>
                <p>Dzienna dawka : <input type="number" value={medicine.dose} onChange={(e) => handleMedicineDoseChange(e)} /></p>
                <p><button onClick={handleMedicineSave}>Zapisz</button></p>
            </div>
        </div>
    );
}