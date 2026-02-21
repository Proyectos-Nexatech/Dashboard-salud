import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    writeBatch,
    onSnapshot,
    query,
    orderBy,
    type Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { MedicamentoInfo } from '../data/medicamentosData';
import { MEDICAMENTOS_LIST } from '../data/medicamentosData';

const MEDICAMENTOS_COLLECTION = 'medicamentos';

/**
 * Normalize a name for comparison
 */
const normalize = (s: string) => s ? s.toUpperCase().replace(/\s+/g, ' ').trim() : '';

export function subscribeToMedicamentos(callback: (meds: MedicamentoInfo[]) => void): Unsubscribe {
    const q = query(collection(db, MEDICAMENTOS_COLLECTION), orderBy('medicamento', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const meds = snapshot.docs.map(doc => doc.data() as MedicamentoInfo);
        callback(meds);
    });
}

export async function addMedicamento(m: MedicamentoInfo): Promise<void> {
    const docId = normalize(m.medicamento).replace(/[\\/\\.#\\$\\[\\]]/g, '_');
    const ref = doc(db, MEDICAMENTOS_COLLECTION, docId);
    await setDoc(ref, m);
    console.log(`✅ Medicamento creado: ${m.medicamento}`);
}

export async function updateMedicamento(m: MedicamentoInfo, originalName?: string): Promise<void> {
    const docId = originalName ? normalize(originalName).replace(/[\\/\\.#\\$\\[\\]]/g, '_') : normalize(m.medicamento).replace(/[\\/\\.#\\$\\[\\]]/g, '_');

    if (originalName && normalize(originalName) !== normalize(m.medicamento)) {
        // Name changed, delete old and create new
        await deleteDoc(doc(db, MEDICAMENTOS_COLLECTION, docId));
        const newDocId = normalize(m.medicamento).replace(/[\\/\\.#\\$\\[\\]]/g, '_');
        await setDoc(doc(db, MEDICAMENTOS_COLLECTION, newDocId), m);
    } else {
        const ref = doc(db, MEDICAMENTOS_COLLECTION, docId);
        await setDoc(ref, m, { merge: true });
    }
    console.log(`✅ Medicamento actualizado: ${m.medicamento}`);
}

export async function deleteMedicamento(name: string): Promise<void> {
    const docId = normalize(name).replace(/[\\/\\.#\\$\\[\\]]/g, '_');
    const ref = doc(db, MEDICAMENTOS_COLLECTION, docId);
    await deleteDoc(ref);
    console.log(`🗑️ Medicamento eliminado: ${name}`);
}

export async function deleteMedicamentosBatch(names: string[]): Promise<void> {
    const BATCH_LIMIT = 490;
    for (let i = 0; i < names.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        const chunk = names.slice(i, i + BATCH_LIMIT);
        for (const name of chunk) {
            const docId = normalize(name).replace(/[\\/\\.#\\$\\[\\]]/g, '_');
            const ref = doc(db, MEDICAMENTOS_COLLECTION, docId);
            batch.delete(ref);
        }
        await batch.commit();
        console.log(`🗑️ Batch ${Math.floor(i / BATCH_LIMIT) + 1}: ${chunk.length} medicamentos eliminados`);
    }
}

export async function seedMedicamentosFromMock(): Promise<void> {
    const snapshot = await getDocs(collection(db, MEDICAMENTOS_COLLECTION));
    if (snapshot.empty) {
        console.log('🌱 Seeding medicamentos from mock data...');
        const batch = writeBatch(db);
        MEDICAMENTOS_LIST.forEach(m => {
            const docId = normalize(m.medicamento).replace(/[\\/\\.#\\$\\[\\]]/g, '_');
            const ref = doc(db, MEDICAMENTOS_COLLECTION, docId);
            batch.set(ref, m);
        });
        await batch.commit();
        console.log('✅ Medicamentos seeded successfully');
    }
}
