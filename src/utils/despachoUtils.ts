import type { Prescripcion, EntregaProgramada, Despacho } from '../data/despachoTypes';
import { getConfiguracionMedicamento, ConfiguracionTratamientos } from '../data/despachoTypes';
import type { Paciente } from '../data/mockData';

// ─── Parser CSV ───────────────────────────────────────────────────────────────

/**
 * Convierte el texto de un archivo CSV en una lista de Prescripciones.
 * Columnas esperadas (flexible, case-insensitive):
 *   tipo_identificacion, numero_identificacion, nombre_completo,
 *   medicamento, dosis, eps, municipio
 * También acepta formato simplificado con algunas columnas opcionales.
 */
export function parseCsvPrescripciones(csvText: string): {
    prescripciones: Prescripcion[];
    errores: string[];
} {
    const errores: string[] = [];
    const lines = csvText
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0);

    if (lines.length < 2) {
        return { prescripciones: [], errores: ['El archivo CSV está vacío o no tiene datos.'] };
    }

    // Normalizar encabezados
    const normalizeHeader = (h: string) => h.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .trim();

    // Sistema de alias refinado (según imágenes del usuario)
    const ALIASES = {
        'id': ['identificacion', 'numero_de_ic', 'numero_de_ident', 'cedula', 'documento', 'cc', 'paciente_id', 'doc_paciente', 'ic', 'nro_id', 'historia_clinica', 'hc', 'paciente'],
        'n1': ['nombre_1', 'primer_nombre', 'nombre', 'name_1', 'primer_nom', 'paciente'],
        'n2': ['nombre_2', 'segundo_nombre', 'name_2', 'segundo_nom'],
        'a1': ['apellido_1', 'primer_apellido', 'apelido_1', 'primer_ape', 'apellido'],
        'a2': ['apellido_2', 'segundo_apellido', 'apelido_2', 'segundo_ape'],
        'med': ['formulacion', 'descripcion', 'producto', 'medicamento', 'insumo', 'nombre_del_insumo', 'prestacion', 'formula', 'articulo', 'h_producto', 'item', 'desc_med'],
        'dpto': ['departamento', 'depto', 'regional'],
        'ciudad': ['ciudad_de_re', 'ciudad', 'municipio', 'localidad', 'poblacion']
    };

    // Buscar la fila de encabezados
    let headerRowIndex = -1;
    let headerMap: Record<string, number> = {};
    let separator = ',';

    console.log("Analizando primeras líneas del CSV...");

    for (let j = 0; j < Math.min(lines.length, 20); j++) {
        const line = lines[j];
        const sep = line.includes(';') ? ';' : ',';
        const raw = line.split(sep).map(h => h.trim());
        const norm = raw.map(normalizeHeader);

        let matches = 0;
        if (norm.some(h => ALIASES.id.some(a => h.includes(a)))) matches++;
        if (norm.some(h => ALIASES.med.some(a => h.includes(a)))) matches++;
        if (norm.some(h => ALIASES.n1.some(a => h.includes(a)))) matches++;

        if (matches >= 2) {
            headerRowIndex = j;
            separator = sep;
            // Guardar solo la PRIMERA vez que aparece un nombre de columna (para no sobrescribir el texto con códigos)
            norm.forEach((h, i) => {
                if (h && headerMap[h] === undefined) {
                    headerMap[h] = i;
                }
            });
            console.log("Cabecera encontrada en línea:", j, "Separador:", sep);
            console.log("Mapa de columnas (primeras ocurrencias):", headerMap);
            break;
        }
    }

    if (headerRowIndex === -1) {
        console.error("No se encontró una cabecera válida en las primeras 20 líneas.");
        return { prescripciones: [], errores: ['No se detectaron las columnas necesarias (Identificación, Medicamento).'] };
    }

    const prescripciones: Prescripcion[] = [];
    // Memoria para filas agrupadas (cuando el paciente solo aparece en la primera fila)
    let ultimoPaciente: { id: string, nombre: string, ciudad: string } | null = null;

    for (let i = headerRowIndex + 1; i < lines.length; i++) {
        const fullRow = parseCSVRow(lines[i], separator);
        if (fullRow.length < 2) continue;

        try {
            const getByAlias = (key: string): string => {
                const candidates = ALIASES[key as keyof typeof ALIASES] || [key];
                // 1. Intentar coincidencia exacta primero
                for (const h of Object.keys(headerMap)) {
                    if (candidates.some(c => h === c)) {
                        const idx = headerMap[h];
                        if (fullRow[idx]) return fullRow[idx].trim();
                    }
                }
                // 2. Intentar coincidencia parcial
                for (const h of Object.keys(headerMap)) {
                    if (candidates.some(c => h.includes(c))) {
                        const idx = headerMap[h];
                        if (fullRow[idx]) return fullRow[idx].trim();
                    }
                }
                return '';
            };

            const medInput = getByAlias('med');
            if (!medInput) {
                if (i < headerRowIndex + 5) console.log(`Fila ${i}: No se encontró texto en columna de medicamento.`);
                continue;
            }

            const medUpper = medInput.toUpperCase();
            const configKeys = Object.keys(ConfiguracionTratamientos).filter(k => k !== 'default');
            const foundMed = configKeys.find(k => medUpper.includes(k));

            if (!foundMed) {
                if (i < headerRowIndex + 5) console.log(`Fila ${i}: Medicamento '${medInput}' no está en la lista oficial.`);
                continue;
            }

            // Datos del paciente
            let pId = getByAlias('id');
            let pN1 = getByAlias('n1');
            let pN2 = getByAlias('n2');
            let pA1 = getByAlias('a1');
            let pA2 = getByAlias('a2');
            let pCiudad = getByAlias('ciudad');
            let pDpto = getByAlias('dpto'); // Mantener pDpto para la lógica de municipio
            let pEps = getByAlias('eps');
            let pDosis = getByAlias('dosis');

            // Sticky Logic
            if (!pId && ultimoPaciente) {
                pId = ultimoPaciente.id;
                pN1 = ultimoPaciente.nombre; // El nombre ya está completo
                pCiudad = ultimoPaciente.ciudad;
                pN2 = ''; pA1 = ''; pA2 = '';
            }

            if (!pId) {
                if (i < headerRowIndex + 5) console.log(`Fila ${i}: No hay ID de paciente y no hay paciente previo.`);
                continue;
            }

            // Construir nombre si es nuevo o si el nombre no es el del último paciente
            let nombreFinal: string;
            if (pN1.includes(' ') || (ultimoPaciente && pN1 === ultimoPaciente.nombre)) {
                nombreFinal = pN1.toUpperCase();
            } else {
                nombreFinal = [pN1, pN2, pA1, pA2].filter(Boolean).join(' ').trim().toUpperCase();
            }
            if (!nombreFinal) nombreFinal = `PACIENTE_${pId}`;

            // Guardar para la siguiente fila
            ultimoPaciente = { id: pId, nombre: nombreFinal, ciudad: pCiudad };

            prescripciones.push({
                pacienteId: pId,
                nombreCompleto: nombreFinal,
                medicamento: foundMed,
                dosis: pDosis || `Dosis según prescripción`,
                eps: pEps || '',
                municipio: pCiudad || pDpto,
                diasAdministracion: getConfiguracionMedicamento(foundMed).diasEntrega,
                diasDescanso: 0,
            });
        } catch (e) {
            console.warn("Fila ignorada:", i, e);
        }
    }

    console.log("Proceso terminado. Prescripciones válidas encontradas:", prescripciones.length);
    return { prescripciones, errores };
}

/** Mapea nombres de columna alternativas al índice en el CSV */
function buildHeaderMap(headers: string[]): Record<string, number> {
    const map: Record<string, number> = {};
    headers.forEach((h, i) => { map[h] = i; });
    return map;
}

/** Parsea una línea CSV respetando comillas y el separador detectado. */
function parseCSVRow(line: string, separator: string = ','): string[] {
    const result: string[] = [];
    let current = '';
    let insideQuotes = false;
    for (const char of line) {
        if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === separator && !insideQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// ─── Generador de Hoja de Ruta ────────────────────────────────────────────────

/**
 * Genera entregas proyectadas para los próximos 6 meses a partir de:
 *   1. La configuración de periodicidad del medicamento
 *   2. La periodicidad histórica del paciente (si existe en `pacientes`)
 *   3. La periodicidad explícita del CSV (si viene en la prescripción)
 */
export function generarHojaRuta(
    prescripciones: Prescripcion[],
    pacientes: Paciente[] = [],
    mesesProyeccion: number = 6
): Despacho[] {
    const despachos: Despacho[] = [];
    const hoy = new Date();

    for (const rx of prescripciones) {
        // Buscar paciente existente por ID o nombre
        const pacienteExistente = pacientes.find(p =>
            p.numeroId === rx.pacienteId ||
            normalizar(p.nombreCompleto) === normalizar(rx.nombreCompleto)
        );

        // Determinar periodicidad en días
        let diasCiclo = rx.periodicidadDias; // 1. Explícito en CSV

        if (!diasCiclo && pacienteExistente) {
            // 2. Inferir desde historial de entregas del paciente
            diasCiclo = inferirPeriodicidadHistorica(pacienteExistente);
        }

        if (!diasCiclo) {
            // 3. Usar tabla de configuración
            const config = getConfiguracionMedicamento(rx.medicamento);
            diasCiclo = config.diasEntrega;
        }

        const config = getConfiguracionMedicamento(rx.medicamento);
        const ciclo = config.ciclo;

        // Fecha de inicio: start of next month
        let fechaEntrega = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        fechaEntrega.setDate(fechaEntrega.getDate() + diasCiclo);

        const fechaLimite = new Date(hoy);
        fechaLimite.setMonth(fechaLimite.getMonth() + mesesProyeccion);

        while (fechaEntrega <= fechaLimite) {
            const fechaIso = fechaToIso(fechaEntrega);
            const id = `${rx.pacienteId}_${fechaIso.replace(/-/g, '')}_${rx.medicamento.slice(0, 6)}`;

            despachos.push({
                id,
                pacienteId: rx.pacienteId,
                nombreCompleto: rx.nombreCompleto,
                medicamento: rx.medicamento,
                eps: rx.eps,
                municipio: rx.municipio,
                dosis: rx.dosis,
                ciclo,
                diasEntrega: diasCiclo,
                fechaProgramada: fechaIso,
                confirmado: false,
            });

            // Siguiente entrega
            const siguiente = new Date(fechaEntrega);
            siguiente.setDate(siguiente.getDate() + diasCiclo);
            fechaEntrega = siguiente;
        }
    }

    // Ordenar por fecha
    despachos.sort((a, b) => a.fechaProgramada.localeCompare(b.fechaProgramada));
    return despachos;
}

/**
 * Infiere la periodicidad media de entrega a partir del historial de entregas
 * del paciente (campo `entregas` en Paciente).
 * Retorna días estimados o undefined si no se puede calcular.
 */
export function inferirPeriodicidadHistorica(paciente: Paciente): number | undefined {
    const mesesConEntrega = Object.values(paciente.entregas).filter(Boolean).length;
    if (mesesConEntrega < 2) return undefined;
    // Aproximación: si tiene N entregas en M meses → ciclo = M/N meses * 30
    return Math.round((12 / mesesConEntrega) * 30);
}

/**
 * Genera una hoja de ruta directamente desde los pacientes existentes
 * (sin necesidad de CSV), usando el medicamento y periodicidad de cada uno.
 */
export function generarHojaRutaDesdePacientes(
    pacientes: Paciente[],
    mesesProyeccion: number = 6
): Despacho[] {
    const prescripciones: Prescripcion[] = pacientes
        .filter(p => p.estado.startsWith('AC'))
        .map(p => {
            const config = getConfiguracionMedicamento(p.medicamento);
            return {
                pacienteId: p.numeroId || String(p.id),
                nombreCompleto: p.nombreCompleto,
                medicamento: p.medicamento,
                dosis: p.dosisEstandar,
                eps: p.eps,
                municipio: p.municipio,
                diasAdministracion: config.diasEntrega,
                diasDescanso: 0,
            };
        });

    return generarHojaRuta(prescripciones, pacientes, mesesProyeccion);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fechaToIso(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function normalizar(s: string): string {
    return s.toUpperCase().trim().replace(/\s+/g, ' ');
}

/** Formatea una fecha ISO como string legible en español */
export function formatFechaEntrega(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    return fecha.toLocaleDateString('es-CO', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

/** Determina si una fecha de entrega es urgente (dentro de 7 días) */
export function esEntregaUrgente(isoDate: string): boolean {
    const hoy = new Date();
    const [y, m, d] = isoDate.split('-').map(Number);
    const fecha = new Date(y, m - 1, d);
    const diffMs = fecha.getTime() - hoy.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
}

/** Determina si una entrega está vencida (fecha pasada y no confirmada) */
export function esEntregaVencida(despacho: Despacho): boolean {
    if (despacho.confirmado) return false;
    const hoy = new Date();
    const [y, m, d] = despacho.fechaProgramada.split('-').map(Number);
    const fecha = new Date(y, m - 1, d);
    return fecha < hoy;
}
