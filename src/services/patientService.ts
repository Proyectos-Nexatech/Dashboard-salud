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
import type { Prescripcion } from '../data/despachoTypes';

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
        servicio: p.servicio || '',
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
        servicio: data.servicio || '',
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

/**
 * Sync patients from prescriptions.
 * Creates new patients if they don't exist.
 */
export async function upsertPatientsFromPrescripciones(
    prescripciones: Prescripcion[],
    existingPatients: Paciente[]
): Promise<void> {
    const BATCH_LIMIT = 490;
    const operations: { docId: string; data: Record<string, any> }[] = [];

    // De-duplicate patients by ID in the current upload
    const uniqueIncoming = new Map<string, Prescripcion>();
    prescripciones.forEach(rx => {
        if (!uniqueIncoming.has(rx.pacienteId)) {
            uniqueIncoming.set(rx.pacienteId, rx);
        }
    });

    for (const rx of uniqueIncoming.values()) {
        const id = rx.pacienteId;
        const exists = existingPatients.find(p => p.numeroId === id);

        if (exists) {
            // User says: "if exists do nothing". 
            // However, we might want to update "servicio" if it's missing?
            // "verificar si ya existe no hacer nada, si no existe crearlo"
            continue;
        }

        // Create new patient
        const newPatient: Paciente = {
            id: Date.now() + Math.floor(Math.random() * 1000), // Temp internal ID
            nombre1: rx.nombre1,
            nombre2: rx.nombre2,
            apellido1: rx.apellido1,
            apellido2: rx.apellido2,
            nombreCompleto: rx.nombreCompleto,
            tipoId: 'CC', // Default
            numeroId: rx.pacienteId,
            eps: rx.eps,
            telefono: rx.telefonos,
            municipio: rx.municipio,
            fechaNacimiento: '',
            edad: 0,
            estado: 'AC ONC',
            medicamento: rx.medicamento,
            dosisEstandar: rx.dosis,
            diasAdministracion: rx.diasAdministracion,
            diasDescanso: rx.diasDescanso,
            entregas: {},
            servicio: rx.servicio
        };

        operations.push({ docId: id, data: toFirestoreDoc(newPatient) });
    }

    if (operations.length === 0) return;

    for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        const chunk = operations.slice(i, i + BATCH_LIMIT);
        for (const op of chunk) {
            const ref = doc(db, PATIENTS_COLLECTION, op.docId);
            batch.set(ref, op.data, { merge: true });
        }
        await batch.commit();
    }
    console.log(`✅ ${operations.length} nuevos pacientes creados.`);
}
