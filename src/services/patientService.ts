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
import type { Paciente } from '../data/mockData';

const PATIENTS_COLLECTION = 'patients';

/**
 * Normalize a name for comparison (uppercase, trim, collapse spaces)
 */
const normalize = (s: string) => s ? s.toUpperCase().replace(/\s+/g, ' ').trim() : '';

/**
 * Convert Paciente object to a Firestore-safe plain object
 * (Firestore doesn't accept undefined values)
 */
function toFirestoreDoc(p: Paciente): Record<string, any> {
    return {
        id: p.id,
        nombre1: p.nombre1 || '',
        nombre2: p.nombre2 || '',
        apellido1: p.apellido1 || '',
        apellido2: p.apellido2 || '',
        nombreCompleto: p.nombreCompleto || '',
        tipoId: p.tipoId || '',
        numeroId: p.numeroId || '',
        eps: p.eps || '',
        telefono: p.telefono || '',
        municipio: p.municipio || '',
        entidad: p.entidad || '',
        fechaNacimiento: p.fechaNacimiento || '',
        edad: p.edad || 0,
        sexo: p.sexo || '',
        estado: p.estado || '',
        medicamento: p.medicamento || '',
        presentacionComercial: p.presentacionComercial || '',
        dosisEstandar: p.dosisEstandar || '',
        diasAdministracion: p.diasAdministracion || 0,
        diasDescanso: p.diasDescanso || 0,
        entregas: p.entregas || {},
        _nombreNorm: normalize(p.nombreCompleto), // For search indexing
        _updatedAt: new Date().toISOString()
    };
}

/**
 * Convert a Firestore document back to Paciente type
 */
function fromFirestoreDoc(data: Record<string, any>): Paciente {
    return {
        id: data.id || 0,
        nombre1: data.nombre1 || '',
        nombre2: data.nombre2 || '',
        apellido1: data.apellido1 || '',
        apellido2: data.apellido2 || '',
        nombreCompleto: data.nombreCompleto || '',
        tipoId: data.tipoId || '',
        numeroId: data.numeroId || '',
        eps: data.eps || '',
        telefono: data.telefono || '',
        municipio: data.municipio || '',
        entidad: data.entidad || '',
        fechaNacimiento: data.fechaNacimiento || '',
        edad: data.edad || 0,
        sexo: data.sexo || undefined,
        estado: data.estado || 'AC ONC',
        medicamento: data.medicamento || '',
        presentacionComercial: data.presentacionComercial || '',
        dosisEstandar: data.dosisEstandar || '',
        diasAdministracion: data.diasAdministracion || 0,
        diasDescanso: data.diasDescanso || 0,
        entregas: data.entregas || {},
    } as Paciente;
}

/**
 * Get all patients from Firestore
 */
export async function getAllPatients(): Promise<Paciente[]> {
    const snapshot = await getDocs(collection(db, PATIENTS_COLLECTION));
    return snapshot.docs.map(doc => fromFirestoreDoc(doc.data()));
}

/**
 * Subscribe to real-time patient updates
 */
export function subscribeToPatients(callback: (patients: Paciente[]) => void): Unsubscribe {
    const q = query(collection(db, PATIENTS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
        const patients = snapshot.docs.map(doc => fromFirestoreDoc(doc.data()));
        callback(patients);
    });
}

/**
 * Delete all documents in the patients collection (in batches of 490)
 */
async function clearAllPatients(): Promise<void> {
    const BATCH_LIMIT = 490;
    const snapshot = await getDocs(collection(db, PATIENTS_COLLECTION));
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + BATCH_LIMIT);
        for (const d of chunk) {
            batch.delete(d.ref);
        }
        await batch.commit();
    }
    console.log(`🗑️ Limpiados ${docs.length} documentos anteriores`);
}

/**
 * Sync patient data from Excel upload to Firestore.
 * REPLACES all existing data with the new Excel data.
 * Handles >500 patients by splitting into multiple batches.
 */
export async function syncExcelData(
    newPacientes: Paciente[],
    existingPatients: Paciente[]
): Promise<void> {
    // Step 1: Clear existing data so we don't accumulate duplicates
    await clearAllPatients();

    const BATCH_LIMIT = 490;
    const operations: { docId: string; data: Record<string, any> }[] = [];

    for (const newP of newPacientes) {
        // 1. Try to find existing patient by ID
        let existingP: Paciente | undefined;
        if (newP.numeroId) {
            existingP = existingPatients.find(p => p.numeroId === newP.numeroId);
        }

        // 2. Fallback: find by normalized name
        if (!existingP && newP.nombreCompleto) {
            const newName = normalize(newP.nombreCompleto);
            existingP = existingPatients.find(p => normalize(p.nombreCompleto) === newName);
        }

        // Build the document ID
        let docId: string;
        if (existingP && existingP.numeroId) {
            docId = existingP.numeroId;
        } else if (newP.numeroId) {
            docId = newP.numeroId;
        } else {
            docId = normalize(newP.nombreCompleto).replace(/[\/\.#\$\[\]]/g, '_');
        }

        // Merge: keep existing data where new data is empty
        const merged: Paciente = existingP ? {
            ...existingP,
            ...newP,
            numeroId: newP.numeroId || existingP.numeroId,
            nombreCompleto: newP.nombreCompleto || existingP.nombreCompleto,
            fechaNacimiento: (newP.fechaNacimiento && newP.fechaNacimiento !== 'N/A') ? newP.fechaNacimiento : existingP.fechaNacimiento,
            telefono: (newP.telefono && newP.telefono !== 'N/A') ? newP.telefono : existingP.telefono,
            edad: newP.edad || existingP.edad,
            sexo: newP.sexo || existingP.sexo,
            municipio: newP.municipio || existingP.municipio,
            eps: newP.eps || existingP.eps,
            entidad: newP.entidad || existingP.entidad,
            entregas: { ...existingP.entregas, ...newP.entregas },
        } : newP;

        operations.push({ docId, data: toFirestoreDoc(merged) });
    }

    // Split into batches of BATCH_LIMIT
    for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        const chunk = operations.slice(i, i + BATCH_LIMIT);
        for (const op of chunk) {
            const ref = doc(db, PATIENTS_COLLECTION, op.docId);
            batch.set(ref, op.data, { merge: true });
        }
        await batch.commit();
        console.log(`✅ Batch ${Math.floor(i / BATCH_LIMIT) + 1} committed (${chunk.length} patients)`);
    }

    console.log(`✅ Total: ${operations.length} pacientes sincronizados`);
}

/**
 * Seed Firestore with initial mock data (run once to populate).
 * Handles >500 patients by splitting into multiple batches.
 */
export async function seedFromMockData(mockPatients: Paciente[]): Promise<void> {
    const BATCH_LIMIT = 490;

    for (let i = 0; i < mockPatients.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        const chunk = mockPatients.slice(i, i + BATCH_LIMIT);
        for (const p of chunk) {
            const docId = p.numeroId || normalize(p.nombreCompleto).replace(/[\/\.#\$\[\]]/g, '_');
            const ref = doc(db, PATIENTS_COLLECTION, docId);
            batch.set(ref, toFirestoreDoc(p));
        }
        await batch.commit();
        console.log(`✅ Seed batch ${Math.floor(i / BATCH_LIMIT) + 1} committed (${chunk.length} patients)`);
    }

    console.log(`✅ Total seed: ${mockPatients.length} pacientes`);
}

/**
 * Add a single patient to Firestore
 */
export async function addPatient(p: Paciente): Promise<void> {
    const docId = p.numeroId || normalize(p.nombreCompleto).replace(/[\/\.#\$\[\]]/g, '_');
    const ref = doc(db, PATIENTS_COLLECTION, docId);
    await setDoc(ref, toFirestoreDoc(p));
    console.log(`✅ Paciente creado: ${p.nombreCompleto} (${docId})`);
}

/**
 * Update a single patient in Firestore
 */
export async function updatePatient(p: Paciente, originalNumeroId?: string): Promise<void> {
    const docId = originalNumeroId || p.numeroId || normalize(p.nombreCompleto).replace(/[\/\.#\$\[\]]/g, '_');

    // If the ID changed, delete the old doc and create a new one
    if (originalNumeroId && originalNumeroId !== p.numeroId) {
        await deleteDoc(doc(db, PATIENTS_COLLECTION, originalNumeroId));
        const newDocId = p.numeroId || normalize(p.nombreCompleto).replace(/[\/\.#\$\[\]]/g, '_');
        await setDoc(doc(db, PATIENTS_COLLECTION, newDocId), toFirestoreDoc(p));
    } else {
        const ref = doc(db, PATIENTS_COLLECTION, docId);
        await setDoc(ref, toFirestoreDoc(p), { merge: true });
    }
    console.log(`✅ Paciente actualizado: ${p.nombreCompleto}`);
}

/**
 * Delete a single patient from Firestore
 */
export async function deletePatient(numeroId: string): Promise<void> {
    const ref = doc(db, PATIENTS_COLLECTION, numeroId);
    await deleteDoc(ref);
    console.log(`🗑️ Paciente eliminado: ${numeroId}`);
}

/**
 * Delete multiple patients from Firestore (batch)
 */
export async function deletePatientsBatch(numeroIds: string[]): Promise<void> {
    const BATCH_LIMIT = 490;
    for (let i = 0; i < numeroIds.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        const chunk = numeroIds.slice(i, i + BATCH_LIMIT);
        for (const id of chunk) {
            const ref = doc(db, PATIENTS_COLLECTION, id);
            batch.delete(ref);
        }
        await batch.commit();
        console.log(`🗑️ Batch ${Math.floor(i / BATCH_LIMIT) + 1}: ${chunk.length} pacientes eliminados`);
    }
    console.log(`🗑️ Total eliminados: ${numeroIds.length} pacientes`);
}
