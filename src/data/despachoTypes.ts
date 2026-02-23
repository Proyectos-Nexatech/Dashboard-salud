// Gestión de Entregas
// =============================================

// --- INTERFACES ---

/** Prescripción cargada desde CSV o derivada de un Paciente */
export interface Prescripcion {
    pacienteId: string;        // CC o número de identificación
    nombreCompleto: string;
    medicamento: string;
    dosis: string;
    eps: string;
    municipio: string;
    diasAdministracion: number;
    diasDescanso: number;
    periodicidadDias?: number; // Si viene explícita en el CSV
}

/** Una entrega proyectada (fecha futura calculada) */
export interface EntregaProgramada {
    id: string;                // Generado: `${pacienteId}_${fechaIso}`
    pacienteId: string;
    nombreCompleto: string;
    medicamento: string;
    eps: string;
    municipio: string;
    dosis: string;
    ciclo: 'Mensual' | 'Quincenal' | 'Semanal';
    diasEntrega: number;
    fechaProgramada: string;   // ISO format: 'YYYY-MM-DD'
}

/** Un despacho concreto (puede estar pendiente o confirmado) */
export interface Despacho extends EntregaProgramada {
    confirmado: boolean;
    fechaConfirmacion?: string; // ISO format
    observaciones?: string;
    // Firestore doc id (se asigna después de save)
    firestoreId?: string;
    estadoActual?: 'Pendiente' | 'Confirmado' | 'Cancelado' | 'Pospuesto' | 'Suspendido';
    motivo?: string;
}

// --- CONFIGURACIÓN DE TRATAMIENTOS ---

/** Objeto de configuración: ciclo de entrega predefinido por medicamento */
export const ConfiguracionTratamientos: Record<
    string,
    { ciclo: 'Mensual' | 'Quincenal' | 'Semanal'; diasEntrega: number }
> = {
    // Oncológicos orales — ciclo mensual (30 días)
    'IMATINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'NILOTINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'DASATINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'PONATINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'BOSUTINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'ERLOTINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'GEFITINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'OSIMERTINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'AFATINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'LAPATINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'IBRUTINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'RUXOLITINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'LENALIDOMIDA': { ciclo: 'Mensual', diasEntrega: 28 },
    'POMALIDOMIDA': { ciclo: 'Mensual', diasEntrega: 28 },
    'TALIDOMIDA': { ciclo: 'Mensual', diasEntrega: 28 },
    'EVEROLIMUS': { ciclo: 'Mensual', diasEntrega: 30 },
    'TEMSIROLIMUS': { ciclo: 'Mensual', diasEntrega: 30 },
    'SUNITINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'SORAFENIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'PAZOPANIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'AXITINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'REGORAFENIB': { ciclo: 'Mensual', diasEntrega: 28 },
    'CABOZANTINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'VENETOCLAX': { ciclo: 'Mensual', diasEntrega: 28 },
    'OLAPARIB': { ciclo: 'Mensual', diasEntrega: 28 },
    'NIRAPARIB': { ciclo: 'Mensual', diasEntrega: 28 },
    'RUCAPARIB': { ciclo: 'Mensual', diasEntrega: 28 },
    'ALECTINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'CRIZOTINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'CERITINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'BRIGATINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'LORLATINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'PALBOCICLIB': { ciclo: 'Mensual', diasEntrega: 28 },
    'RIBOCICLIB': { ciclo: 'Mensual', diasEntrega: 28 },
    'ABEMACICLIB': { ciclo: 'Mensual', diasEntrega: 28 },
    'NERATINIB': { ciclo: 'Mensual', diasEntrega: 30 },
    'LETROZOL': { ciclo: 'Mensual', diasEntrega: 30 },

    // Quimioterapia oral — ciclo quincenal/mensual según protocolo
    'CAPECITABINA': { ciclo: 'Quincenal', diasEntrega: 14 },
    'TEMOZOLOMIDA': { ciclo: 'Mensual', diasEntrega: 28 },
    'METOTREXATO': { ciclo: 'Mensual', diasEntrega: 30 },
    'HIDROXIUREA': { ciclo: 'Mensual', diasEntrega: 30 },
    'CLORAMBUCILO': { ciclo: 'Quincenal', diasEntrega: 14 },
    'MELFALANO': { ciclo: 'Mensual', diasEntrega: 28 },
    'BUSULFANO': { ciclo: 'Mensual', diasEntrega: 28 },
    'LOMUSTINA': { ciclo: 'Mensual', diasEntrega: 42 },
    'PROCARBAZINA': { ciclo: 'Mensual', diasEntrega: 28 },

    // Inmunomoduladores / otros
    'AZATIOPRINA': { ciclo: 'Mensual', diasEntrega: 30 },
    'CICLOSPORINA': { ciclo: 'Mensual', diasEntrega: 30 },
    'MICOFENOLATO': { ciclo: 'Mensual', diasEntrega: 30 },
    'TACROLIMUS': { ciclo: 'Mensual', diasEntrega: 30 },

    // Fallback para medicamentos no listados
    'default': { ciclo: 'Mensual', diasEntrega: 30 },
};

/** Obtiene la configuración de ciclo de un medicamento (case-insensitive) */
export function getConfiguracionMedicamento(nombreMedicamento: string) {
    const key = nombreMedicamento.toUpperCase().trim();
    // Búsqueda exacta
    if (ConfiguracionTratamientos[key]) return ConfiguracionTratamientos[key];
    // Búsqueda parcial
    const found = Object.keys(ConfiguracionTratamientos).find(k =>
        k !== 'default' && key.includes(k)
    );
    return found ? ConfiguracionTratamientos[found] : ConfiguracionTratamientos['default'];
}
