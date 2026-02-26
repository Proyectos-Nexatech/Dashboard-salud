import { collection, doc, setDoc, onSnapshot, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface AlertConfig {
    id: string;
    nombre: string;
    descripcion: string;
    activa: boolean;
    diasAnticipacion: number;
    frecuenciaReenvioHoras: number;
    canal: 'interno' | 'email' | 'ambos';
    mensaje: string;
    rolesPermitidos: string[];
}

const ALERTS_COLLECTION = 'alert_config';

export const DEFAULT_ALERTS: AlertConfig[] = [
    {
        id: 'medicamento_vencer',
        nombre: 'Medicamento por Vencer',
        descripcion: 'Avisa cuando un medicamento está próximo a su fecha de vencimiento.',
        activa: true,
        diasAnticipacion: 30,
        frecuenciaReenvioHoras: 24,
        canal: 'interno',
        mensaje: 'El medicamento {medicamento_nombre} (Lote: {lote}) vencerá en {dias} días.',
        rolesPermitidos: ['Administrador', 'Farmacia', 'Coordinador'],
    },
    {
        id: 'entrega_proxima',
        nombre: 'Entrega Próxima',
        descripcion: 'Notifica antes del día de entrega programada de un paciente.',
        activa: true,
        diasAnticipacion: 2,
        frecuenciaReenvioHoras: 12,
        canal: 'ambos',
        mensaje: 'Recordatorio: Entrega programada para el paciente {paciente_nombre} en {dias} días.',
        rolesPermitidos: ['Administrador', 'Coordinador'],
    },
    {
        id: 'sin_actividad_despacho',
        nombre: 'Sin Actividad de Despacho',
        descripcion: 'Alerta si un paciente no tiene registros de entrega en N días.',
        activa: false,
        diasAnticipacion: 15,
        frecuenciaReenvioHoras: 48,
        canal: 'interno',
        mensaje: 'El paciente {paciente_nombre} no ha registrado despachos en los últimos {dias} días.',
        rolesPermitidos: ['Administrador', 'Coordinador'],
    },
    {
        id: 'riesgo_alto_detectado',
        nombre: 'Riesgo Alto Detectado',
        descripcion: 'Notificación cuando un paciente supera el umbral de riesgo crítico.',
        activa: true,
        diasAnticipacion: 0,
        frecuenciaReenvioHoras: 24,
        canal: 'ambos',
        mensaje: '¡Urgente! El paciente {paciente_nombre} ha sido clasificado con riesgo ALTO.',
        rolesPermitidos: ['Administrador', 'Coordinador'],
    },
    {
        id: 'stock_bajo_medicamento',
        nombre: 'Stock Bajo de Medicamento',
        descripcion: 'Avisa cuando el stock de un medicamento baja del mínimo configurado.',
        activa: true,
        diasAnticipacion: 0,
        frecuenciaReenvioHoras: 12,
        canal: 'interno',
        mensaje: 'El stock del medicamento {medicamento_nombre} es bajo ({cantidad} unidades disponibles).',
        rolesPermitidos: ['Administrador', 'Farmacia', 'Coordinador'],
    },
    {
        id: 'ciclo_proximo_vencer',
        nombre: 'Ciclo Próximo a Vencer',
        descripcion: 'Alerta cuando un ciclo de tratamiento está a punto de terminar.',
        activa: true,
        diasAnticipacion: 7,
        frecuenciaReenvioHoras: 24,
        canal: 'interno',
        mensaje: 'El ciclo de tratamiento del paciente {paciente_nombre} finaliza en {dias} días.',
        rolesPermitidos: ['Administrador', 'Coordinador'],
    },
    {
        id: 'llamada_seguimiento',
        nombre: 'Llamada de Seguimiento',
        descripcion: 'Notifica si un paciente no recogió el medicamento tras N días de la entrega programada.',
        activa: true,
        diasAnticipacion: 5,
        frecuenciaReenvioHoras: 24,
        canal: 'interno',
        mensaje: 'El paciente {paciente_nombre} no ha recogido su medicación {dias} días después de la fecha programada. Requiere llamada de seguimiento.',
        rolesPermitidos: ['Administrador', 'Coordinador', 'Auxiliar'],
    }
];

export function subscribeToAlerts(callback: (alerts: AlertConfig[]) => void) {
    const q = query(collection(db, ALERTS_COLLECTION));
    return onSnapshot(q, (snap) => {
        const alerts = snap.docs.map(d => d.data() as AlertConfig);
        callback(alerts);
    });
}

export async function saveAlert(alert: AlertConfig) {
    const ref = doc(db, ALERTS_COLLECTION, alert.id);
    await setDoc(ref, alert, { merge: true });
}

export async function seedDefaultAlerts() {
    try {
        const snap = await getDocs(collection(db, ALERTS_COLLECTION));
        if (snap.empty) {
            console.log('Inicializando configuración de alertas por defecto...');
            for (const alert of DEFAULT_ALERTS) {
                await saveAlert(alert);
            }
        }
    } catch (err) {
        console.error('Error inicializando alertas:', err);
    }
}
