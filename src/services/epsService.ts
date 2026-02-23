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
import { EPS_LIST } from '../data/mockData';

const ENTIDADES_COLLECTION = 'entidades';

export interface EntidadInfo {
    nombre: string;
    tipo: 'EPS-S' | 'EPS-C' | 'Otro';
    nit?: string;
    activo: boolean;
    contrato: boolean;
}

/**
 * Normalize a name for document ID
 */
const normalize = (s: string) => s ? s.toUpperCase().replace(/\s+/g, ' ').trim() : '';

export function subscribeToEntidades(callback: (entidades: EntidadInfo[]) => void): Unsubscribe {
    const q = query(collection(db, ENTIDADES_COLLECTION), orderBy('nombre', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const entidades = snapshot.docs.map(doc => doc.data() as EntidadInfo);
        callback(entidades);
    });
}

export async function addEntidad(e: EntidadInfo): Promise<void> {
    const docId = normalize(e.nombre).replace(/[\\/\\.#\\$\\[\\]]/g, '_');
    const ref = doc(db, ENTIDADES_COLLECTION, docId);
    await setDoc(ref, e);
    console.log(`✅ Entidad creada: ${e.nombre}`);
}

export async function updateEntidad(e: EntidadInfo, originalNombre?: string): Promise<void> {
    const docId = originalNombre ? normalize(originalNombre).replace(/[\\/\\.#\\$\\[\\]]/g, '_') : normalize(e.nombre).replace(/[\\/\\.#\\$\\[\\]]/g, '_');

    if (originalNombre && normalize(originalNombre) !== normalize(e.nombre)) {
        // Name changed, delete old and create new
        await deleteDoc(doc(db, ENTIDADES_COLLECTION, docId));
        const newDocId = normalize(e.nombre).replace(/[\\/\\.#\\$\\[\\]]/g, '_');
        await setDoc(doc(db, ENTIDADES_COLLECTION, newDocId), e);
    } else {
        const ref = doc(db, ENTIDADES_COLLECTION, docId);
        await setDoc(ref, e, { merge: true });
    }
    console.log(`✅ Entidad actualizada: ${e.nombre}`);
}

export async function deleteEntidad(nombre: string): Promise<void> {
    const docId = normalize(nombre).replace(/[\\/\\.#\\$\\[\\]]/g, '_');
    const ref = doc(db, ENTIDADES_COLLECTION, docId);
    await deleteDoc(ref);
    console.log(`🗑️ Entidad eliminada: ${nombre}`);
}

export async function deleteEntidadesBatch(nombres: string[]): Promise<void> {
    const BATCH_LIMIT = 490;
    for (let i = 0; i < nombres.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        const chunk = nombres.slice(i, i + BATCH_LIMIT);
        for (const nombre of chunk) {
            const docId = normalize(nombre).replace(/[\\/\\.#\\$\\[\\]]/g, '_');
            const ref = doc(db, ENTIDADES_COLLECTION, docId);
            batch.delete(ref);
        }
        await batch.commit();
        console.log(`🗑️ Batch ${Math.floor(i / BATCH_LIMIT) + 1}: ${chunk.length} entidades eliminadas`);
    }
}

export async function seedEntidadesFromMock(): Promise<void> {
    const snapshot = await getDocs(collection(db, ENTIDADES_COLLECTION));
    if (snapshot.empty) {
        console.log('🌱 Seeding entidades from mock data...');
        const batch = writeBatch(db);
        EPS_LIST.forEach(name => {
            if (name === 'OTRO') return; // Skip "OTRO" or handle it specially if needed
            const docId = normalize(name).replace(/[\\/\\.#\\$\\[\\]]/g, '_');
            const ref = doc(db, ENTIDADES_COLLECTION, docId);
            const entidad: EntidadInfo = {
                nombre: name.toUpperCase(),
                tipo: 'EPS-S',
                activo: true,
                contrato: true
            };
            batch.set(ref, entidad);
        });
        await batch.commit();
        console.log('✅ Entidades seeded successfully');
    }
}
