import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    onSnapshot,
    query,
    orderBy,
    type Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Despacho } from '../data/despachoTypes';

const DESPACHOS_COLLECTION = 'despachos';

// ─── Conversores ─────────────────────────────────────────────────────────────

function toFirestoreDoc(d: Despacho): Record<string, unknown> {
    return {
        id: d.id,
        pacienteId: d.pacienteId,
        nombreCompleto: d.nombreCompleto,
        medicamento: d.medicamento,
        eps: d.eps,
        municipio: d.municipio,
        dosis: d.dosis,
        ciclo: d.ciclo,
        diasEntrega: d.diasEntrega,
        fechaProgramada: d.fechaProgramada,
        confirmado: d.confirmado,
        fechaConfirmacion: d.fechaConfirmacion || '',
        observaciones: d.observaciones || '',
        estadoActual: d.estadoActual || (d.confirmado ? 'Confirmado' : 'Pendiente'),
        motivo: d.motivo || '',
        _updatedAt: new Date().toISOString(),
    };
}

function fromFirestoreDoc(data: Record<string, unknown>, firestoreId: string): Despacho {
    return {
        firestoreId,
        id: String(data.id ?? ''),
        pacienteId: String(data.pacienteId ?? ''),
        nombreCompleto: String(data.nombreCompleto ?? ''),
        medicamento: String(data.medicamento ?? ''),
        eps: String(data.eps ?? ''),
        municipio: String(data.municipio ?? ''),
        dosis: String(data.dosis ?? ''),
        ciclo: (data.ciclo as Despacho['ciclo']) ?? 'Mensual',
        diasEntrega: Number(data.diasEntrega ?? 30),
        fechaProgramada: String(data.fechaProgramada ?? ''),
        confirmado: Boolean(data.confirmado),
        fechaConfirmacion: data.fechaConfirmacion ? String(data.fechaConfirmacion) : undefined,
        observaciones: data.observaciones ? String(data.observaciones) : undefined,
        estadoActual: (data.estadoActual as Despacho['estadoActual']) ?? (Boolean(data.confirmado) ? 'Confirmado' : 'Pendiente'),
        motivo: data.motivo ? String(data.motivo) : undefined,
    };
}

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * Suscripción en tiempo real a todos los despachos, ordenados por fecha.
 */
export function subscribeToDespachos(
    callback: (despachos: Despacho[]) => void
): Unsubscribe {
    const q = query(
        collection(db, DESPACHOS_COLLECTION),
        orderBy('fechaProgramada', 'asc')
    );
    return onSnapshot(q, (snap) => {
        const despachos = snap.docs.map(d =>
            fromFirestoreDoc(d.data() as Record<string, unknown>, d.id)
        );
        callback(despachos);
    });
}

/**
 * Agrega una lista de despachos a Firestore en batch.
 * Usa el campo `id` del despacho como document ID para evitar duplicados.
 */
export async function addDespachos(despachos: Despacho[]): Promise<void> {
    // Check existing to avoid duplicates
    const snap = await getDocs(collection(db, DESPACHOS_COLLECTION));
    const existing = new Set(snap.docs.map(d => d.id));

    let batch = writeBatch(db);
    let count = 0;

    for (const d of despachos) {
        if (!existing.has(d.id)) {
            const ref = doc(db, DESPACHOS_COLLECTION, d.id);
            batch.set(ref, toFirestoreDoc(d));
            count++;

            // Firestore batches limited to 500 ops
            if (count % 400 === 0) {
                await batch.commit();
                batch = writeBatch(db);
            }
        }
    }

    if (count % 400 !== 0) {
        await batch.commit();
    }
}

/**
 * Confirma un despacho: marca confirmado=true y guarda la fecha actual.
 */
export async function confirmarDespacho(
    firestoreId: string,
    observaciones?: string
): Promise<void> {
    const ref = doc(db, DESPACHOS_COLLECTION, firestoreId);
    await updateDoc(ref, {
        confirmado: true,
        estadoActual: 'Confirmado',
        fechaConfirmacion: new Date().toISOString().split('T')[0],
        observaciones: observaciones || '',
        _updatedAt: new Date().toISOString(),
    });
}

/**
 * Actualiza el estado de un despacho y opcionalmente añade un motivo u observaciones.
 */
export async function actualizarEstadoDespacho(
    firestoreId: string,
    nuevoEstado: Despacho['estadoActual'],
    motivo?: string,
    nuevaFecha?: string
): Promise<void> {
    const ref = doc(db, DESPACHOS_COLLECTION, firestoreId);
    const updates: any = {
        estadoActual: nuevoEstado,
        motivo: motivo || '',
        _updatedAt: new Date().toISOString(),
    };
    if (nuevaFecha) {
        updates.fechaProgramada = nuevaFecha;
    }
    // Si se cancela o suspende, nos aseguramos que confirmado sea false
    if (nuevoEstado === 'Cancelado' || nuevoEstado === 'Suspendido' || nuevoEstado === 'Pospuesto') {
        updates.confirmado = false;
    }
    await updateDoc(ref, updates);
}

/**
 * Elimina todos los despachos de un paciente (para re-generar hoja de ruta).
 */
export async function eliminarDespachosPaciente(pacienteId: string): Promise<void> {
    const snap = await getDocs(collection(db, DESPACHOS_COLLECTION));
    const batch = writeBatch(db);
    snap.docs.forEach(d => {
        if (d.data().pacienteId === pacienteId) {
            batch.delete(doc(db, DESPACHOS_COLLECTION, d.id));
        }
    });
    await batch.commit();
}

/**
 * Elimina todos los despachos en bulk (para reset completo).
 */
export async function eliminarTodosLosDespachos(): Promise<void> {
    const snap = await getDocs(collection(db, DESPACHOS_COLLECTION));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(doc(db, DESPACHOS_COLLECTION, d.id)));
    await batch.commit();
}
