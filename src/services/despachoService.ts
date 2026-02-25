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
        numeroNota: d.numeroNota || '',
        pacienteId: d.pacienteId,
        nombre1: d.nombre1 || '',
        nombre2: d.nombre2 || '',
        apellido1: d.apellido1 || '',
        apellido2: d.apellido2 || '',
        nombreCompleto: d.nombreCompleto,
        telefonos: d.telefonos || '',
        genero: d.genero || '',
        ciudadResidencia: d.ciudadResidencia,
        entidadAseguradora: d.entidadAseguradora || '',
        atc: d.atc || '',
        medicamento: d.medicamento,
        duracionTratamiento: d.duracionTratamiento || '',
        eps: d.eps,
        municipio: d.municipio,
        dosis: d.dosis,
        ciclo: d.ciclo,
        diasEntrega: d.diasEntrega,
        fechaProgramada: d.fechaProgramada,
        confirmado: d.confirmado,
        fechaConfirmacion: d.fechaConfirmacion || '',
        observaciones: d.observaciones || '',
        modality: d.modality || 'Farmacia',
        domicilioVerificado: d.domicilioVerificado || false,
        timeline: d.timeline || [],
        evidencia: d.evidencia || '',
        geolocalizacion: d.geolocalizacion || null,
        estadoActual: d.estadoActual || (d.confirmado ? 'Entregado' : 'Pendiente'),
        motivo: d.motivo || '',
        modificadoPor: d.modificadoPor || '',
        ultimaModificacion: d.ultimaModificacion || '',
        statusRecall: d.statusRecall || 'Pendiente',
        observacionRecall: d.observacionRecall || '',
        // Seguimiento
        seguimientoEstado: d.seguimientoEstado || 'Pendiente',
        seguimientoFechaProgramada: d.seguimientoFechaProgramada || '',
        seguimientoRespuesta: d.seguimientoRespuesta || null,
        esCargaManual: d.esCargaManual || false,
        _updatedAt: new Date().toISOString(),
    };
}

function fromFirestoreDoc(data: Record<string, unknown>, firestoreId: string): Despacho {
    return {
        firestoreId,
        id: String(data.id ?? ''),
        numeroNota: String(data.numeroNota ?? ''),
        pacienteId: String(data.pacienteId ?? ''),
        nombre1: String(data.nombre1 ?? ''),
        nombre2: String(data.nombre2 ?? ''),
        apellido1: String(data.apellido1 ?? ''),
        apellido2: String(data.apellido2 ?? ''),
        nombreCompleto: String(data.nombreCompleto ?? ''),
        telefonos: String(data.telefonos ?? ''),
        genero: String(data.genero ?? ''),
        ciudadResidencia: String(data.ciudadResidencia ?? ''),
        entidadAseguradora: String(data.entidadAseguradora ?? ''),
        atc: String(data.atc ?? ''),
        medicamento: String(data.medicamento ?? ''),
        duracionTratamiento: String(data.duracionTratamiento ?? ''),
        eps: String(data.eps ?? ''),
        municipio: String(data.municipio ?? ''),
        dosis: String(data.dosis ?? ''),
        ciclo: (data.ciclo as Despacho['ciclo']) ?? 'Mensual',
        diasEntrega: Number(data.diasEntrega ?? 30),
        fechaProgramada: String(data.fechaProgramada ?? ''),
        confirmado: Boolean(data.confirmado),
        fechaConfirmacion: data.fechaConfirmacion ? String(data.fechaConfirmacion) : undefined,
        observaciones: data.observaciones ? String(data.observaciones) : undefined,
        modality: data.modality as any,
        domicilioVerificado: Boolean(data.domicilioVerificado),
        timeline: (data.timeline as any[]) || [],
        evidencia: (data.evidencia || data.firma) as string,
        geolocalizacion: data.geolocalizacion as any,
        estadoActual: (data.estadoActual as Despacho['estadoActual']) ?? (Boolean(data.confirmado) ? 'Entregado' : 'Pendiente'),
        motivo: data.motivo ? String(data.motivo) : undefined,
        modificadoPor: data.modificadoPor ? String(data.modificadoPor) : undefined,
        ultimaModificacion: data.ultimaModificacion ? String(data.ultimaModificacion) : undefined,
        statusRecall: data.statusRecall as Despacho['statusRecall'],
        observacionRecall: data.observacionRecall as string,
        // Seguimiento Post-Entrega
        seguimientoEstado: data.seguimientoEstado as Despacho['seguimientoEstado'],
        seguimientoFechaProgramada: data.seguimientoFechaProgramada as string,
        seguimientoRespuesta: data.seguimientoRespuesta as Despacho['seguimientoRespuesta'],
        esCargaManual: Boolean(data.esCargaManual),
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
 * @param onProgress Callback opcional para monitorear el progreso (0 a 100)
 */
/**
 * Alias para addDespachos que refleja mejor la sincronización con el CSV.
 */
export const sincronizarHojaRutaConFirestore = addDespachos;

export async function addDespachos(
    despachos: Despacho[],
    onProgress?: (progress: number) => void
): Promise<void> {
    const total = despachos.length;
    if (total === 0) return;

    // Para evitar leer miles de documentos (ahorro de quota), 
    // procesamos en bloques y enviamos.
    let batch = writeBatch(db);
    let count = 0;
    let processed = 0;

    for (const d of despachos) {
        const ref = doc(db, DESPACHOS_COLLECTION, d.id);
        batch.set(ref, toFirestoreDoc(d), { merge: true });
        count++;
        processed++;

        // Firestore batches limited to 500 ops
        if (count >= 400) {
            await batch.commit();
            await new Promise(r => setTimeout(r, 200)); // Pequeña pausa para no saturar la cuota de escritura por segundo
            batch = writeBatch(db);
            count = 0;
            if (onProgress) onProgress(Math.round((processed / total) * 100));
        }
    }

    if (count > 0) {
        await batch.commit();
        if (onProgress) onProgress(100);
    }
}

/**
 * Confirma un despacho: marca confirmado=true y guarda la fecha actual.
 */
export async function confirmarDespacho(
    firestoreId: string,
    observaciones?: string,
    fechaConfirmacion?: string,
    usuario?: string,
    extra?: Partial<Despacho>
): Promise<void> {
    const ref = doc(db, DESPACHOS_COLLECTION, firestoreId);
    const now = new Date().toISOString();
    const updates: any = {
        confirmado: true,
        estadoActual: extra?.estadoActual || 'Entregado',
        fechaConfirmacion: fechaConfirmacion || now.split('T')[0],
        observaciones: observaciones || '',
        modificadoPor: usuario || '',
        ultimaModificacion: now,
        _updatedAt: now,
        ...extra
    };

    await updateDoc(ref, updates);
}

/**
 * Actualiza el estado de un despacho y opcionalmente añade un motivo u observaciones.
 */
export async function actualizarEstadoDespacho(
    firestoreId: string,
    nuevoEstado: Despacho['estadoActual'],
    motivo?: string,
    nuevaFecha?: string,
    usuario?: string,
    existingTimeline: any[] = []
): Promise<void> {
    const ref = doc(db, DESPACHOS_COLLECTION, firestoreId);
    const now = new Date().toISOString();

    // Si el estado es uno de los hitos técnicos, lo añadimos al timeline
    const trackingStates = ['Despachado', 'En Camino', 'Entregado (Domicilio)', 'Entregado (Farmacia)'];
    let updatedTimeline = [...existingTimeline];

    if (nuevoEstado && trackingStates.includes(nuevoEstado as string)) {
        updatedTimeline.push({
            hito: nuevoEstado,
            timestamp: now,
            usuario: usuario || 'Sistema'
        });
    }

    const updates: any = {
        estadoActual: nuevoEstado,
        motivo: motivo || '',
        modificadoPor: usuario || '',
        ultimaModificacion: now,
        _updatedAt: now,
        timeline: updatedTimeline
    };
    if (nuevaFecha) {
        updates.fechaProgramada = nuevaFecha;
    }
    // Si se cancela o pospone, nos aseguramos que confirmado sea false
    if (nuevoEstado === 'Cancelado' || nuevoEstado === 'Pospuesto') {
        updates.confirmado = false;
    }

    // Si el nuevo estado es una forma de "Entregado", marcamos confirmado
    if (nuevoEstado?.includes('Entregado')) {
        updates.confirmado = true;
        updates.fechaConfirmacion = now.split('T')[0];
    }

    await updateDoc(ref, updates);
}

/**
 * Elimina todos los despachos de un paciente (para re-generar hoja de ruta).
 */
export async function eliminarDespachosPaciente(pacienteId: string): Promise<void> {
    const snap = await getDocs(collection(db, DESPACHOS_COLLECTION));
    let batch = writeBatch(db);
    let count = 0;

    for (const d of snap.docs) {
        if (d.data().pacienteId === pacienteId) {
            batch.delete(doc(db, DESPACHOS_COLLECTION, d.id));
            count++;
            if (count >= 400) {
                await batch.commit();
                batch = writeBatch(db);
                count = 0;
            }
        }
    }
    if (count > 0) await batch.commit();
}

/**
 * Elimina todos los despachos en bulk (para reset completo).
 */
export async function eliminarTodosLosDespachos(onProgress?: (progress: number) => void): Promise<void> {
    const snap = await getDocs(collection(db, DESPACHOS_COLLECTION));
    const total = snap.docs.length;
    if (total === 0) return;

    let batch = writeBatch(db);
    let count = 0;
    let processed = 0;

    for (const d of snap.docs) {
        batch.delete(doc(db, DESPACHOS_COLLECTION, d.id));
        count++;
        processed++;

        if (count >= 400) {
            await batch.commit();
            await new Promise(r => setTimeout(r, 100)); // Pausa suave
            batch = writeBatch(db);
            count = 0;
            if (onProgress) onProgress(Math.round((processed / total) * 100));
        }
    }
    if (count > 0) {
        await batch.commit();
        if (onProgress) onProgress(100);
    }
}

/**
 * Registra una acción de gestión sobre un paciente en rescate (Grupo B).
 */
export async function gestionarRescate(
    firestoreId: string,
    nuevoStatus: Despacho['statusRecall'],
    observacion: string,
    usuario?: string
): Promise<void> {
    const ref = doc(db, DESPACHOS_COLLECTION, firestoreId);
    const now = new Date().toISOString();

    const updates: any = {
        statusRecall: nuevoStatus,
        observacionRecall: observacion,
        modificadoPor: usuario || 'Sistema',
        ultimaModificacion: now,
        _updatedAt: now,
    };

    // Si la gestión implica que ya no está pendiente de entrega por alguna razón específica
    // o si se reprograma, el estadoActual del despacho debería reflejarlo en ControlDespachos.
    // Aquí solo actualizamos los campos de recall por ahora.

    await updateDoc(ref, updates);
}
/**
 * Registra una cita de seguimiento post-entrega.
 */
export async function agendarSeguimiento(
    firestoreId: string,
    fecha: string,
    usuario?: string
): Promise<void> {
    const ref = doc(db, DESPACHOS_COLLECTION, firestoreId);
    const now = new Date().toISOString();

    await updateDoc(ref, {
        seguimientoEstado: 'Programado',
        seguimientoFechaProgramada: fecha,
        modificadoPor: usuario || 'Sistema',
        ultimaModificacion: now,
        _updatedAt: now
    });
}

/**
 * Registra la respuesta clínica de un paciente al tratamiento.
 */
export async function registrarRespuestaTratamiento(
    firestoreId: string,
    respuesta: any, // TreatmentResponse
    usuario?: string
): Promise<void> {
    const ref = doc(db, DESPACHOS_COLLECTION, firestoreId);
    const now = new Date().toISOString();

    await updateDoc(ref, {
        seguimientoEstado: 'Completado',
        seguimientoRespuesta: respuesta,
        modificadoPor: usuario || 'Sistema',
        ultimaModificacion: now,
        _updatedAt: now
    });
}
