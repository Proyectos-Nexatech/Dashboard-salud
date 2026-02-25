// Gestión de Entregas
// =============================================

// --- INTERFACES ---

/** Prescripción cargada desde CSV o derivada de un Paciente */
export interface Prescripcion {
    numeroNota: string;
    pacienteId: string;
    nombre1: string;
    nombre2: string;
    apellido1: string;
    apellido2: string;
    nombreCompleto: string;
    telefonos: string;
    genero: string;
    ciudadResidencia: string;
    entidadAseguradora: string;
    atc: string;
    medicamento: string;
    duracionTratamiento: string;
    dosis: string;
    municipio: string;
    eps: string;
    diasAdministracion: number;
    diasDescanso: number;
    servicio?: string;
    periodicidadDias?: number;
    esCargaManual?: boolean;
}

/** Una entrega proyectada (fecha futura calculada) */
export interface EntregaProgramada {
    id: string;
    numeroNota: string;
    pacienteId: string;
    nombre1: string;
    nombre2: string;
    apellido1: string;
    apellido2: string;
    nombreCompleto: string;
    telefonos: string;
    genero: string;
    ciudadResidencia: string;
    entidadAseguradora: string;
    atc: string;
    medicamento: string;
    duracionTratamiento: string;
    eps: string;
    municipio: string;
    dosis: string;
    ciclo: 'Mensual' | 'Quincenal' | 'Semanal';
    diasEntrega: number;
    fechaProgramada: string;
}

/** Un despacho concreto (puede estar pendiente o confirmado) */
export interface Despacho extends EntregaProgramada {
    confirmado: boolean;
    modality?: 'Farmacia' | 'Domicilio';
    domicilioVerificado?: boolean;
    timeline?: Array<{
        hito: 'Despachado' | 'En Camino' | 'Entregado (Domicilio)' | 'Entregado (Farmacia)';
        timestamp: string;
        usuario: string;
    }>;
    evidencia?: string; // Base64 (Firma o Foto)
    firma?: string; // Deprecated: usar evidencia
    geolocalizacion?: {
        lat: number;
        lng: number;
    };
    fechaConfirmacion?: string;
    observaciones?: string;
    firestoreId?: string;
    estadoActual?: 'Pendiente' | 'Agendado' | 'Despachado' | 'En Camino' | 'Entregado' | 'Entregado (Domicilio)' | 'Entregado (Farmacia)' | 'Cancelado' | 'Pospuesto';
    motivo?: string;
    modificadoPor?: string;
    ultimaModificacion?: string;
    statusRecall?: 'Pendiente' | 'Llamado' | 'Rescatado' | 'Anulado';
    observacionRecall?: string;

    // --- SEGUIMIENTO POST-ENTREGA ---
    seguimientoEstado?: 'Pendiente' | 'Programado' | 'Completado' | 'No Requerido';
    seguimientoFechaProgramada?: string;
    seguimientoRespuesta?: TreatmentResponse;
    esCargaManual?: boolean;
}

export interface TreatmentResponse {
    tolerancia: 'Buena' | 'Regular' | 'Mala';
    efectosAdversos: string;
    mejoraClinica: 'Si' | 'No' | 'Parcial';
    observaciones: string;
    fechaRegistro: string;
    registradoPor: string;
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
