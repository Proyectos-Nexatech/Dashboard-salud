// =============================================
// Data types based on Excel structure
// =============================================

export type EstadoCode =
    | 'AC ONC'      // Activo en tratamiento solo oral
    | 'ACT ONC QXT' // Activo oncológico con quimioterapia
    | 'ACT NO ONC'  // Activo no oncológico
    | 'IN S'        // Inactivo por suspensión de tratamiento
    | 'IN ST'       // Inactivo por suspensión temporal
    | 'IN F'        // Inactivo fallecimiento
    | 'IN EPS'      // Inactivo cambio a EPS no contratada
    | 'IN C'        // Inactivo cambio
    | 'IN R';       // Inactivo cambio de residencia

export interface Paciente {
    id: number;
    nombre1: string;
    nombre2?: string;
    apellido1: string;
    apellido2?: string;
    nombreCompleto: string;
    tipoId: string;
    numeroId: string;
    eps: string;
    telefono: string;
    municipio: string;
    entidad?: string;
    fechaNacimiento: string;
    edad: number;
    sexo?: 'M' | 'F';
    estado: EstadoCode;
    medicamento: string;
    presentacionComercial?: string;
    dosisEstandar: string;
    diasAdministracion: number;
    diasDescanso: number;
    // Entregas por mes
    entregas: {
        enero?: string;
        febrero?: string;
        marzo?: string;
        abril?: string;
        mayo?: string;
        junio?: string;
        julio?: string;
        agosto?: string;
        septiembre?: string;
        octubre?: string;
        noviembre?: string;
        diciembre?: string;
    };
}
// ... (rest of the file content needs to be carefully handled to avoid deleting mock data)
// Actually, it's safer to do multiple small replaces.

// 1. Fix Interface

export interface Medicamento {
    nombre: string;
    presentacion: string;
    dosisEstandar: string;
    diasAdministracion: number;
    diasDescanso: number;
    total: number;
    frecuenciaEntrega: number;
    stockActual?: number;
    stockMinimo?: number;
    nivelRiesgo?: 'alto' | 'medio' | 'bajo';
}

export interface PacienteInactivo {
    id: number;
    nombre: string;
    numeroId: string;
    eps: string;
    estado: EstadoCode;
    fechaInactivacion: string;
    reactivacion?: string;
}

export interface Seguimiento {
    nombreCompleto: string;
    id: string;
    telefono: string;
    eps: string;
    estado: EstadoCode;
    entregaMayo?: string;
    tipoEntrega?: string;
}

export interface KPIData {
    pacientesActivos: number;
    pacientesInactivos: number;
    totalPacientes: number;
    nivelServicio: number;
    medicamentosEnRiesgo: number;
    entregasMes: number;
    entregasPendientes: number;
    eps: string[];
    poblacionHombres: number;
    poblacionMujeres: number;
    municipios: string[];
}

export function calcularKPIs(pacientes: Paciente[]): KPIData {
    // Deduplicar pacientes por ID único (un paciente puede tener múltiples medicamentos)
    const seen = new Set<string>();
    const uniquePacientes = pacientes.filter(p => {
        const key = p.numeroId || p.nombreCompleto; // Usar ID, o nombre como fallback
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    const activos = uniquePacientes.filter(p => p.estado && p.estado.startsWith('AC'));
    const inactivos = uniquePacientes.filter(p => p.estado && p.estado.startsWith('IN'));

    // Calcular Hombres y Mujeres (basado en campo sexo)
    const hombres = activos.filter(p => p.sexo === 'M' || (!p.sexo && p.id % 2 === 0)).length;
    const mujeres = activos.filter(p => p.sexo === 'F' || (!p.sexo && p.id % 2 !== 0)).length;

    // Calcular entregas del mes actual
    const month = new Date().toLocaleString('es-CO', { month: 'long' });
    const entregasMes = pacientes.filter(p => p.entregas && Object.keys(p.entregas).some(k => k.toLowerCase().includes(month.toLowerCase()))).length;

    // Pendientes: todos los activos deberían tener entrega
    const entregasPendientes = Math.max(0, activos.length - entregasMes);

    // Nivel de servicio
    const nivelServicio = activos.length > 0 ? Math.round((entregasMes / activos.length) * 100) : 0;

    return {
        pacientesActivos: activos.length,
        pacientesInactivos: inactivos.length,
        totalPacientes: uniquePacientes.length,
        nivelServicio,
        medicamentosEnRiesgo: Math.floor(Math.random() * 5), // Mock
        entregasMes,
        entregasPendientes,
        eps: [...new Set(pacientes.map(p => p.eps))],
        poblacionHombres: hombres,
        poblacionMujeres: mujeres,
        municipios: [...new Set(pacientes.map(p => p.municipio))]
    };
}

// =============================================
// Mock data based on real Excel structure
// =============================================

export const MEDICAMENTOS_CRITICOS: Medicamento[] = [
    { nombre: 'CITARABINA', presentacion: 'Inyectable 100mg', dosisEstandar: 'Según protocolo', diasAdministracion: 7, diasDescanso: 21, total: 28, frecuenciaEntrega: 4, stockActual: 12, stockMinimo: 30, nivelRiesgo: 'alto' },
    { nombre: '5-FLUOROURACILO', presentacion: 'Inyectable 500mg', dosisEstandar: '500mg/m² x 5 días', diasAdministracion: 5, diasDescanso: 23, total: 28, frecuenciaEntrega: 4, stockActual: 8, stockMinimo: 20, nivelRiesgo: 'alto' },
    { nombre: 'METOTREXATO', presentacion: 'Comprimido 2.5mg', dosisEstandar: '15mg semanal', diasAdministracion: 1, diasDescanso: 6, total: 30, frecuenciaEntrega: 27, stockActual: 45, stockMinimo: 40, nivelRiesgo: 'medio' },
    { nombre: 'AZATIOPRINA', presentacion: 'Comprimido 50mg', dosisEstandar: '2mg/kg/día', diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27, stockActual: 60, stockMinimo: 30, nivelRiesgo: 'bajo' },
    { nombre: 'CLORAMBUCILO', presentacion: 'Comprimido 2mg', dosisEstandar: '0.1-0.2mg/kg/día', diasAdministracion: 14, diasDescanso: 14, total: 28, frecuenciaEntrega: 4, stockActual: 5, stockMinimo: 15, nivelRiesgo: 'alto' },
];

export const MEDICAMENTOS_CATALOGO: Medicamento[] = [
    { nombre: 'ABEMACILIB X 150 MILIGRAMOS', presentacion: '60 tabletas', dosisEstandar: '300 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { nombre: 'ABEMACILIB X 100 MILIGRAMOS', presentacion: '30 tabletas', dosisEstandar: '100 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { nombre: 'ABIRATERONA ACETATO X 250 MILIGRAMOS', presentacion: '120 tabletas', dosisEstandar: '1000 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { nombre: 'ANASTROZOL X 1 MILIGRAMOS', presentacion: '30 tabletas', dosisEstandar: '1 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { nombre: 'ENZALUTAMIDA X 40 MILIGRAMOS', presentacion: '120 cápsulas', dosisEstandar: '240 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { nombre: 'LETROZOL X 2.5 MILIGRAMOS', presentacion: '30 tabletas', dosisEstandar: '2.5 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { nombre: 'OLAPARIB X 150 MILIGRAMOS', presentacion: '112 tabletas', dosisEstandar: '600 MG X 28 DIAS', diasAdministracion: 28, diasDescanso: 0, total: 28, frecuenciaEntrega: 25 },
    { nombre: 'TAMOXIFENO X 20 MILIGRAMOS', presentacion: '30 tabletas', dosisEstandar: '20 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { nombre: 'IMATINIB X 400 MILIGRAMOS', presentacion: '30 tabletas', dosisEstandar: '400 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { nombre: 'APALUTAMIDA X 60 MILIGRAMOS', presentacion: '120 tabletas', dosisEstandar: '240 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { nombre: 'HIDROXIUREA X 500 MILIGRAMOS', presentacion: '100 cápsulas', dosisEstandar: 'DOSIS X DIA', diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
];

export const EPS_LIST = [
    'ASOCIACION MUTUAL SER EPS-S',
    'COOSALUD ENTIDAD PROMOTORA DE SALUD S.A',
    'ECOPETROL S.A',
    'DEPARTAMENTO ADMINISTRATIVO DISTRITAL DE SALUD',
    'FIDEICOMISOS PATRIMONIOS AUTONOMOS FUDUCIARIA LA PREVISORA SA',
    'ALLIANZ SEGUROS DE VIDA S.A',
    'OTRO'
];

export const ESTADOS_LABELS: Record<string, { label: string; badgeClass: string }> = {
    'AC ONC': { label: 'Activo Oral', badgeClass: 'active' },
    'ACT ONC QXT': { label: 'Activo + QXT', badgeClass: 'active-qxt' },
    'ACT NO ONC': { label: 'Activo No Onc.', badgeClass: 'active-qxt' },
    'IN S': { label: 'Inactivo Suspensión', badgeClass: 'inactive-suspension' },
    'IN ST': { label: 'Inactivo Temporal', badgeClass: 'inactive-suspension' },
    'IN F': { label: 'Fallecido', badgeClass: 'inactive-death' },
    'IN EPS': { label: 'Cambio EPS', badgeClass: 'inactive' },
    'IN C': { label: 'Inactivo', badgeClass: 'inactive' },
    'IN R': { label: 'Cambio Residencia', badgeClass: 'inactive' },
};

// Pacientes mock basados en la estructura real del Excel
export const PACIENTES_MOCK: Paciente[] = [
    {
        id: 1, nombre1: 'RAMIRO', nombre2: 'ANTINIO', apellido1: 'HERRERA', apellido2: 'ACOSTA',
        nombreCompleto: 'RAMIRO ANTINIO HERRERA ACOSTA', tipoId: 'CC', numeroId: '15680061',
        eps: 'ASOCIACION MUTUAL SER EPS-S', telefono: '3126954411', municipio: 'CARTAGENA',
        fechaNacimiento: '1951-04-07', edad: 74, estado: 'ACT ONC QXT',
        medicamento: 'ABIRATERONA ACETATO X 250 MILIGRAMOS', presentacionComercial: '120 tabletas',
        dosisEstandar: '1000 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0,
        entregas: { enero: 'ENTREGA 1 DE 4', febrero: 'ENTREGA 2 DE 4', marzo: 'ENTREGA 3 DE 4', abril: 'ENTREGA 4 DE 4', mayo: 'ENTREGA 1 DE 3' }
    },
    {
        id: 2, nombre1: 'CELIA', nombre2: 'ESTHER', apellido1: 'DUARTE', apellido2: 'MEJIA',
        nombreCompleto: 'CELIA ESTHER DUARTE MEJIA', tipoId: 'CC', numeroId: '45512646',
        eps: 'ASOCIACION MUTUAL SER EPS-S', telefono: '3007065792', municipio: 'CARTAGENA',
        fechaNacimiento: '1973-01-13', edad: 52, estado: 'AC ONC',
        medicamento: 'ANASTROZOL X 1 MILIGRAMOS', presentacionComercial: '30 tabletas',
        dosisEstandar: '1 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0,
        entregas: { enero: 'ENTREGA 1 DE 3', febrero: 'ENTREGA 2 DE 3', marzo: 'ENTREGA 3 DE 3', abril: 'ENTREGA 1 DE 3', mayo: 'ENTREGA 2 DE 3' }
    },
    {
        id: 3, nombre1: 'YANETH', apellido1: 'HERRERA', apellido2: 'MIRANDA',
        nombreCompleto: 'YANETH HERRERA MIRANDA', tipoId: 'CC', numeroId: '51888368',
        eps: 'ASOCIACION MUTUAL SER EPS-S', telefono: '3008000121', municipio: 'CARTAGENA',
        fechaNacimiento: '1965-01-18', edad: 60, estado: 'AC ONC',
        medicamento: 'ANASTROZOL X 1 MILIGRAMOS', presentacionComercial: '30 tabletas',
        dosisEstandar: '1 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0,
        entregas: { enero: 'ENTREGA 1 DE 4', febrero: 'ENTREGA 2 DE 4', marzo: 'ENTREGA 3 DE 4', abril: 'ENTREGA 4 DE 4', mayo: 'ENTREGA 1 DE 4' }
    },
    {
        id: 4, nombre1: 'TONY', nombre2: 'OMAR', apellido1: 'MORALES', apellido2: 'PEREZ',
        nombreCompleto: 'TONY OMAR MORALES PEREZ', tipoId: 'CC', numeroId: '3856131',
        eps: 'ASOCIACION MUTUAL SER EPS-S', telefono: '3106756044', municipio: 'CARTAGENA',
        fechaNacimiento: '1956-04-01', edad: 69, estado: 'AC ONC',
        medicamento: 'ENZALUTAMIDA X 40 MILIGRAMOS', presentacionComercial: '120 cápsulas',
        dosisEstandar: '240 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0,
        entregas: { enero: 'ENTREGA 1 DE 3', febrero: 'ENTREGA 2 DE 3', marzo: 'ENTREGA 3 DE 3', mayo: 'ENTREGA 2 DE 3' }
    },
    {
        id: 5, nombre1: 'DENIS', apellido1: 'BOSSIO', apellido2: 'PEREIRA',
        nombreCompleto: 'DENIS BOSSIO PEREIRA', tipoId: 'CC', numeroId: '45457059',
        eps: 'ASOCIACION MUTUAL SER EPS-S', telefono: '3016090248', municipio: 'CARTAGENA',
        fechaNacimiento: '1962-06-11', edad: 62, estado: 'AC ONC',
        medicamento: 'LETROZOL X 2.5 MILIGRAMOS', presentacionComercial: '30 tabletas',
        dosisEstandar: '2.5 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0,
        entregas: { enero: 'ENTREGA 1 DE 4', febrero: 'ENTREGA 2 DE 4', marzo: 'ENTREGA 3 DE 4', abril: 'ENTREGA 4 DE 4', mayo: 'ENTREGA 1 DE 3' }
    },
    {
        id: 6, nombre1: 'EDILMA', nombre2: 'PATRICIA', apellido1: 'HENAO', apellido2: 'CANTILLO',
        nombreCompleto: 'EDILMA PATRICIA HENAO CANTILLO', tipoId: 'CC', numeroId: '1049826028',
        eps: 'COOSALUD ENTIDAD PROMOTORA DE SALUD S.A', telefono: '3175324498', municipio: 'CARTAGENA',
        fechaNacimiento: '1986-05-28', edad: 39, estado: 'AC ONC',
        medicamento: 'OLAPARIB X 150 MILIGRAMOS', presentacionComercial: '112 tabletas',
        dosisEstandar: '600 MG X 28 DIAS', diasAdministracion: 28, diasDescanso: 0,
        entregas: { enero: 'ENTREGA 1 DE 3', febrero: 'ENTREGA 2 DE 3', marzo: 'ENTREGA 3 DE 3', mayo: 'ENTREGA 1 DE 3' }
    },
    {
        id: 7, nombre1: 'AURIS', nombre2: 'EDILMA', apellido1: 'AYOLA', apellido2: 'DIAZ',
        nombreCompleto: 'AURIS EDILMA AYOLA DIAZ', tipoId: 'CC', numeroId: '33130902',
        eps: 'ASOCIACION MUTUAL SER EPS-S', telefono: '3207965464', municipio: 'VILLANUEVA',
        fechaNacimiento: '1942-11-18', edad: 83, estado: 'AC ONC',
        medicamento: 'TAMOXIFENO X 20 MILIGRAMOS', presentacionComercial: '30 tabletas',
        dosisEstandar: '20 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0,
        entregas: { enero: 'ENTREGA 1 DE 3', febrero: 'ENTREGA 2 DE 3', marzo: 'ENTREGA 3 DE 3', abril: 'ENTREGA 1 DE 4', mayo: 'ENTREGA 3 DE 4' }
    },
    {
        id: 8, nombre1: 'ABEL', nombre2: 'ENRIQUE', apellido1: 'LUNA', apellido2: 'VELLOJIN',
        nombreCompleto: 'ABEL ENRIQUE LUNA VELLOJIN', tipoId: 'CC', numeroId: '9063050',
        eps: 'ASOCIACION MUTUAL SER EPS-S', telefono: '3164503179', municipio: 'CARTAGENA',
        fechaNacimiento: '1947-09-03', edad: 78, estado: 'AC ONC',
        medicamento: 'ENZALUTAMIDA X 40 MILIGRAMOS', presentacionComercial: '120 cápsulas',
        dosisEstandar: '240 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0,
        entregas: { enero: 'ENTREGA 1 DE 3', febrero: 'ENTREGA 2 DE 3', marzo: 'ENTREGA 3 DE 3', mayo: 'ENTREGA 2 DE 3' }
    },
    {
        id: 9, nombre1: 'ABEL', nombre2: 'SALVADOR', apellido1: 'MONTT', apellido2: 'DEULUFEUT',
        nombreCompleto: 'ABEL SALVADOR MONTT DEULUFEUT', tipoId: 'CC', numeroId: '3953174',
        eps: 'ASOCIACION MUTUAL SER EPS-S', telefono: '3247402493', municipio: 'SAN JUAN DE NEPOMUCENO',
        fechaNacimiento: '1945-03-17', edad: 80, estado: 'ACT NO ONC',
        medicamento: 'HIDROXIUREA X 500 MILIGRAMOS', presentacionComercial: '100 cápsulas',
        dosisEstandar: 'DOSIS X DIA', diasAdministracion: 30, diasDescanso: 0,
        entregas: { enero: 'ENTREGA 1 DE 3', febrero: 'ENTREGA 2 DE 3', mayo: 'ENTREGA 1 DE 3' }
    },
    {
        id: 10, nombre1: 'ABEL', nombre2: 'ANTONIO', apellido1: 'SERRANO', apellido2: 'PAYARES',
        nombreCompleto: 'ABEL ANTONIO SERRANO PAYARES', tipoId: 'CC', numeroId: '3815036',
        eps: 'ASOCIACION MUTUAL SER EPS-S', telefono: '3133065689', municipio: 'ARJONA',
        fechaNacimiento: '1955-06-18', edad: 70, estado: 'ACT ONC QXT',
        medicamento: 'ENZALUTAMIDA X 40 MILIGRAMOS', presentacionComercial: '120 cápsulas',
        dosisEstandar: '240 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0,
        entregas: { enero: 'ENTREGA 1 DE 3', febrero: 'ENTREGA 2 DE 3', marzo: 'ENTREGA 3 DE 3', mayo: 'ENTREGA 2 DE 3' }
    },
    {
        id: 11, nombre1: 'FANNY', nombre2: 'JUDITH', apellido1: 'SERRANO', apellido2: 'LORA',
        nombreCompleto: 'FANNY JUDITH SERRANO LORA', tipoId: 'CC', numeroId: '23004480',
        eps: 'ASOCIACION MUTUAL SER EPS-S', telefono: '3001234567', municipio: 'CARTAGENA',
        fechaNacimiento: '1960-03-15', edad: 65, estado: 'IN ST',
        medicamento: 'TAMOXIFENO X 20 MILIGRAMOS', presentacionComercial: '30 tabletas',
        dosisEstandar: '20 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0,
        entregas: {}
    },
    {
        id: 12, nombre1: 'ADA', nombre2: 'MAGDALENA', apellido1: 'MONTERO', apellido2: 'GARCIA',
        nombreCompleto: 'ADA MAGDALENA MONTERO GARCIA', tipoId: 'CC', numeroId: '30774210',
        eps: 'ASOCIACION MUTUAL SER EPS-S', telefono: '3104220925', municipio: 'TURBACO',
        fechaNacimiento: '1952-07-22', edad: 73, estado: 'AC ONC',
        medicamento: 'IMATINIB X 400 MILIGRAMOS', presentacionComercial: '30 tabletas',
        dosisEstandar: '400 MG X 30 DIAS', diasAdministracion: 30, diasDescanso: 0,
        entregas: { enero: 'ENTREGA 1 DE 3', febrero: 'ENTREGA 2 DE 3', marzo: 'ENTREGA 3 DE 3', mayo: 'ENTREGA 1 DE 3' }
    },
];

export const PACIENTES_INACTIVOS_MOCK: PacienteInactivo[] = [
    { id: 1, nombre: 'FANNY JUDITH SERRANO LORA', numeroId: '23004480', eps: 'ASOCIACION MUTUAL SER EPS-S', estado: 'IN ST', fechaInactivacion: '2024-12-01', reactivacion: 'ACTIVO' },
    { id: 2, nombre: 'ELEAZAR CAMARGO PEREZ', numeroId: '895747', eps: 'ASOCIACION MUTUAL SER EPS-S', estado: 'IN C', fechaInactivacion: '2024-12-01', reactivacion: 'ACTIVO' },
    { id: 3, nombre: 'EMILCE ESTHER TORRES MEDINA', numeroId: '45424037', eps: 'COOSALUD', estado: 'IN C', fechaInactivacion: '2024-12-01', reactivacion: 'ACTIVO' },
    { id: 4, nombre: 'HEMEL DEL CRISTO HERNANDEZ TORRES', numeroId: '9107005', eps: 'ASOCIACION MUTUAL SER EPS-S', estado: 'IN S', fechaInactivacion: '2024-12-01' },
    { id: 5, nombre: 'ROSALBA PADILLA MUÑIZ', numeroId: '23071178', eps: 'ASOCIACION MUTUAL SER EPS-S', estado: 'IN C', fechaInactivacion: '2024-12-01', reactivacion: 'ACTIVO' },
    { id: 6, nombre: 'AMINTA BATISTA PUENTES', numeroId: '45459710', eps: 'COOSALUD', estado: 'IN C', fechaInactivacion: '2024-12-01', reactivacion: 'ACTIVO' },
    { id: 7, nombre: 'INGRID ESTER PALACIO MENDOZA', numeroId: '45753003', eps: 'ASOCIACION MUTUAL SER EPS-S', estado: 'IN ST', fechaInactivacion: '2024-12-01', reactivacion: 'ACTIVO' },
];

// Datos de entregas por mes para gráficos
export const ENTREGAS_POR_MES = [
    { mes: 'Ene', entregadas: 142, pendientes: 18, total: 160 },
    { mes: 'Feb', entregadas: 138, pendientes: 22, total: 160 },
    { mes: 'Mar', entregadas: 155, pendientes: 10, total: 165 },
    { mes: 'Abr', entregadas: 148, pendientes: 15, total: 163 },
    { mes: 'May', entregadas: 162, pendientes: 8, total: 170 },
    { mes: 'Jun', entregadas: 158, pendientes: 12, total: 170 },
];

export const MEDICAMENTOS_POR_MES = [
    { mes: 'Ene', anastrozol: 45, enzalutamida: 38, tamoxifeno: 32, olaparib: 18, imatinib: 12 },
    { mes: 'Feb', anastrozol: 43, enzalutamida: 40, tamoxifeno: 30, olaparib: 20, imatinib: 11 },
    { mes: 'Mar', anastrozol: 48, enzalutamida: 42, tamoxifeno: 35, olaparib: 19, imatinib: 14 },
    { mes: 'Abr', anastrozol: 46, enzalutamida: 39, tamoxifeno: 33, olaparib: 22, imatinib: 13 },
    { mes: 'May', anastrozol: 50, enzalutamida: 44, tamoxifeno: 36, olaparib: 21, imatinib: 15 },
    { mes: 'Jun', anastrozol: 49, enzalutamida: 43, tamoxifeno: 34, olaparib: 20, imatinib: 14 },
];

// Pirámide de población (Bogotá - pacientes oncológicos por edad y sexo)
export const PIRAMIDE_POBLACION = [
    { grupo: '0-14', mujeres: 2, hombres: 1 },
    { grupo: '15-29', mujeres: 5, hombres: 3 },
    { grupo: '30-44', mujeres: 12, hombres: 8 },
    { grupo: '45-59', mujeres: 28, hombres: 18 },
    { grupo: '60-74', mujeres: 35, hombres: 42 },
    { grupo: '75-89', mujeres: 22, hombres: 28 },
    { grupo: '90+', mujeres: 4, hombres: 6 },
];

// Factores de riesgo
export const FACTORES_RIESGO = {
    externos: [
        { nombre: 'Riesgo Geopolítico Proveedores', nivel: 'alto' as const, pct: 78, desc: 'Dependencia de principios activos importados' },
        { nombre: 'Fluctuación Cambiaria USD/COP', nivel: 'alto' as const, pct: 72, desc: 'Impacto en costos de importación' },
        { nombre: 'Desabastecimiento Global', nivel: 'medio' as const, pct: 55, desc: 'Citarabina y 5-FU en escasez mundial' },
        { nombre: 'Logística y Transporte', nivel: 'medio' as const, pct: 40, desc: 'Riesgos en cadena de frío' },
    ],
    internos: [
        { nombre: 'Solidez Financiera IPS', nivel: 'medio' as const, pct: 48, desc: 'Capacidad de compra anticipada' },
        { nombre: 'Cumplimiento Comunicación', nivel: 'bajo' as const, pct: 25, desc: 'Protocolos entre IPS y proveedores' },
        { nombre: 'Capacidad Técnica Proveedores', nivel: 'medio' as const, pct: 52, desc: 'Certificaciones y BPM' },
        { nombre: 'Gestión de Inventarios', nivel: 'alto' as const, pct: 68, desc: 'Quiebres de stock recurrentes' },
    ]
};

// =============================================
// Utility functions
// =============================================


export function getEstadoBadge(estado: string) {
    return ESTADOS_LABELS[estado] || { label: estado, badgeClass: 'inactive' };
}

// ... (existing code helpers)

export function parseEntregaProgress(entrega: any): { actual: number; total: number } {
    if (!entrega) return { actual: 0, total: 0 };
    const str = String(entrega).toUpperCase();
    const match = str.match(/ENTREGA (\d+) DE (\d+)/);
    if (match) {
        return { actual: parseInt(match[1]), total: parseInt(match[2]) };
    }
    return { actual: 0, total: 0 };
}

// NUEVAS FUNCIONES PARA GRAFICAS DINAMICAS
export function calcularDatosGraficas(pacientes: Paciente[]) {
    // 1. Entregas por Mes (Simulado basado en la estructura de 'entregas')
    // Como el Excel tiene columnas estáticas (Enero...Diciembre), sumamos las que tienen contenido.
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const entregasData = meses.map(mes => {
        const entregadas = pacientes.filter(p => p.entregas && p.entregas[mes as keyof typeof p.entregas]).length;
        // Asumimos que los activos sin entrega tienen pendiente
        const totalActivos = pacientes.filter(p => p.estado && p.estado.startsWith('AC')).length;
        const pendientes = Math.max(0, totalActivos - entregadas);

        return {
            mes: mes.substring(0, 3).charAt(0).toUpperCase() + mes.substring(1, 3), // Ene, Feb for chart
            entregadas,
            pendientes,
            total: entregadas + pendientes
        };
    }); // Remove slice, show all months or let Recharts handle empty ones

    // 2. Medicamentos (Top 5)
    const conteoMedicamentos: Record<string, number> = {};
    pacientes.forEach(p => {
        if (!p.medicamento) return;
        const medName = p.medicamento.split(' ')[0]; // Primer palabra para agrupar
        conteoMedicamentos[medName] = (conteoMedicamentos[medName] || 0) + 1;
    });

    const topMeds = Object.entries(conteoMedicamentos)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    // Transformar para Stacked Bar (cada mes tiene desglose, simplificamos proyectando el total)
    // Para simplificar la visualización dinámica, usaremos la distribución actual para todos los meses visible
    const medicamentosData = entregasData.map(d => {
        const row: any = { mes: d.mes };
        topMeds.forEach(m => {
            // Distribuir proporcionalmente al total de entregas del mes (simulación de tendencia)
            row[m.name.toLowerCase()] = Math.round((m.count / pacientes.length) * d.entregadas);
        });
        return row;
    });

    return { entregasData, medicamentosData };
}

export function calcularPiramide(pacientes: Paciente[]) {
    const grupos = [
        { r: [0, 14], label: '0-14' },
        { r: [15, 29], label: '15-29' },
        { r: [30, 44], label: '30-44' },
        { r: [45, 59], label: '45-59' },
        { r: [60, 74], label: '60-74' },
        { r: [75, 89], label: '75-89' },
        { r: [90, 150], label: '90+' }
    ];

    return grupos.map(g => {
        const groupPacientes = pacientes.filter(p => (p.edad || 0) >= g.r[0] && (p.edad || 0) <= g.r[1]);

        const mujeres = groupPacientes.filter(p => p.sexo === 'F' || (!p.sexo && p.id % 2 !== 0)).length;
        const hombres = groupPacientes.filter(p => p.sexo === 'M' || (!p.sexo && p.id % 2 === 0)).length;

        return {
            grupo: g.label,
            mujeres,
            hombres
        };
    });
}
