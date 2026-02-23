import type { Prescripcion, EntregaProgramada, Despacho } from '../data/despachoTypes';
import { getConfiguracionMedicamento } from '../data/despachoTypes';
import { MEDICAMENTOS_LIST, type MedicamentoInfo } from '../data/medicamentosData';
import type { Paciente } from '../data/mockData';

/**
 * Convierte el texto de un archivo CSV en una lista de Prescripciones.
 */
export function parseCsvPrescripciones(csvText: string, medicamentosDB: MedicamentoInfo[] = []): {
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

    const ALIASES = {
        'nota': ['numero_nota', 'nota', 'nro_nota'],
        'id': ['identificaci', 'documento', 'cedula', 'identificacion', 'numero_de_ident', 'nro_ident', 'paciente_id'],
        'n1': ['nombre_1', 'primer_nombre', 'nombre1', 'names'],
        'n2': ['nombre_2', 'segundo_nombre', 'nombre2'],
        'a1': ['apellido_1', 'primer_apellido', 'apellido1', 'apellidos'],
        'a2': ['apellido_2', 'segundo_apellido', 'apellido2'],
        'tel': ['telefonos', 'telefono', 'celular', 'movil'],
        'gen': ['genero', 'sexo', 'sex'],
        'ciudad': ['ciudad_de_residencia', 'ciudad', 'municipio', 'localidad'],
        'entidad': ['entidad_aseguradora', 'eps', 'aseguradora', 'entidad'],
        'atc': ['atc', 'codigo_atc', 'code_atc'],
        'med': ['medicamento', 'producto', 'descripcion', 'insumo'],
        'dur': ['duracion_de_tratamiento', 'duracion', 'tratamiento_dias']
    };

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
            norm.forEach((h, i) => {
                if (h && headerMap[h] === undefined) {
                    headerMap[h] = i;
                }
            });
            console.log("Cabecera encontrada en línea:", j, "Separador:", sep);
            break;
        }
    }

    if (headerRowIndex === -1) {
        return { prescripciones: [], errores: ['No se encontró cabecera válida.'] };
    }

    const prescripciones: Prescripcion[] = [];
    const listToUse = medicamentosDB.length > 0 ? medicamentosDB : MEDICAMENTOS_LIST;
    console.log(`Iniciando parseo. Medicamentos disponibles en DB: ${listToUse.length}`);

    // --- ESCANEO DE DATOS PARA DETECCIÓN DE COLUMNAS PRECISA ---
    let autoAtcCol = -1;
    let autoMedCol = -1;
    let autoIdCol = -1;

    // Escaneamos las primeras 50 filas buscando qué columna tiene códigos que SÍ están en nuestra DB
    for (let k = headerRowIndex + 1; k < Math.min(lines.length, headerRowIndex + 50); k++) {
        const row = parseCSVRow(lines[k], separator);
        for (let idx = 0; idx < row.length; idx++) {
            const val = (row[idx] || '').replace(/["']+/g, '').toUpperCase().trim();
            if (!val) continue;

            // Detectar ATC (Si coincide con DB)
            if (autoAtcCol === -1 && listToUse.some(m => (m.atc || '').toUpperCase() === val)) {
                autoAtcCol = idx;
                console.log(`¡Columna ATC detectada! Es la Col ${idx} (Ej: ${val})`);
            }

            // Detectar Nombre Med (Si coincide con DB Y NO ES ATC)
            if (autoMedCol === -1 && idx !== autoAtcCol && listToUse.some(m => (m.medicamento || '').toUpperCase() === val)) {
                autoMedCol = idx;
                console.log(`¡Columna MEDICAMENTO detectada! Es la Col ${idx} (Ej: ${val})`);
            }

            // Detectar ID (Si parece un número de cédula/documento de 7 a 12 dígitos)
            if (autoIdCol === -1 && /^\d{7,12}$/.test(val)) {
                autoIdCol = idx;
                console.log(`¡Columna ID detectada! Es la Col ${idx} (Ej: ${val})`);
            }
        }
        if (autoAtcCol !== -1 && autoMedCol !== -1 && autoIdCol !== -1) break;
    }

    // Asegurar que no colisionen en el fallback o mapeo final
    const finalAtcIdx = autoAtcCol !== -1 ? autoAtcCol : (headerMap['atc'] ?? headerMap['codigo_atc'] ?? 27);
    const finalMedIdx = autoMedCol !== -1 ? autoMedCol : (headerMap['medicamento'] ?? headerMap['descripcion'] ?? 28);

    // Si no detectamos ID por dato, usamos el buscador de alias mejorado
    const findIdIdx = () => {
        if (autoIdCol !== -1) return autoIdCol;
        for (const [h, idx] of Object.entries(headerMap)) {
            if (ALIASES.id.some(a => h.includes(a))) return idx;
        }
        return 4; // Fallback extremo
    };
    const finalIdIdx = findIdIdx();

    console.log(`MAPEADO FINAL -> ATC: Col ${finalAtcIdx}, MED: Col ${finalMedIdx}, ID: Col ${finalIdIdx}`);

    // Stickiness: Guardar último paciente encontrado
    let ultimoPaciente: any = null;

    for (let i = headerRowIndex + 1; i < lines.length; i++) {
        const fullRow = parseCSVRow(lines[i], separator);
        if (fullRow.length < 2) continue;

        try {
            const getByAlias = (key: string): string => {
                if (key === 'atc' && finalAtcIdx !== -1) return (fullRow[finalAtcIdx] || '').replace(/^"|"$/g, '').trim();
                if (key === 'med' && finalMedIdx !== -1) return (fullRow[finalMedIdx] || '').replace(/^"|"$/g, '').trim();
                if (key === 'id' && finalIdIdx !== -1) return (fullRow[finalIdIdx] || '').replace(/^"|"$|[^\d]/g, '').trim();

                const candidates = ALIASES[key as keyof typeof ALIASES] || [key];
                for (const h of Object.keys(headerMap)) {
                    if (candidates.some(c => h === c || h.includes(c))) {
                        const idx = headerMap[h];
                        if (fullRow[idx] !== undefined) {
                            return String(fullRow[idx]).replace(/^"|"$/g, '').trim();
                        }
                    }
                }
                return '';
            };

            const idxNota = headerMap['nota'] ?? headerMap['numero_nota'] ?? headerMap['nro_nota'] ?? 0;
            const notaVal = (fullRow[idxNota] || '').toString().replace(/^"|"$/g, '').trim();

            const atcInputRaw = getByAlias('atc');
            const atcInput = atcInputRaw.replace(/["']+/g, '').toUpperCase().trim();

            const pMedRaw = getByAlias('med');
            const pMedClean = pMedRaw.replace(/["']+/g, '').toUpperCase().trim();

            const pId = getByAlias('id');
            const pN1 = getByAlias('n1');

            if (i <= headerRowIndex + 10) {
                console.log(`Fila ${i} -> CSV ATC: "${atcInput}", Med: "${pMedClean}", PacienteID: "${pId}", Nombre: "${pN1}"`);
            }

            if (!atcInput && !pMedClean) continue;

            // 1. INTENTO DE MATCH POR ATC
            let finalMatch = listToUse.find(m => {
                const dbAtc = (m.atc || '').toString().replace(/["']+/g, '').toUpperCase().trim();
                return dbAtc !== '' && dbAtc === atcInput;
            });

            // 2. INTENTO DE MATCH POR NOMBRE (Fallback)
            if (!finalMatch && pMedClean) {
                finalMatch = listToUse.find(m => {
                    const dbName = (m.medicamento || '').toUpperCase().trim();
                    if (!dbName) return false;
                    if (dbName === pMedClean || dbName.includes(pMedClean) || pMedClean.includes(dbName)) return true;
                    const wordsInput = pMedClean.split(/[\s,xX*+()\-]+/).filter(w => w.length > 3);
                    const wordsDB = dbName.split(/[\s,xX*+()\-]+/).filter(w => w.length > 3);
                    const matches = wordsInput.filter(w => wordsDB.includes(w));
                    return matches.length >= 2 || (matches.length === 1 && matches[0].length > 8);
                });
            }

            if (!finalMatch) {
                if (i <= headerRowIndex + 10) {
                    console.log(`Fila ${i}: Sin coincidencia Técnica en DB Medicamentos.`);
                }
                continue;
            }

            // --- GESTIÓN DE PACIENTE (STICKY LOGIC) ---
            if (pId && pN1) {
                ultimoPaciente = {
                    id: pId,
                    n1: pN1,
                    n2: getByAlias('n2'),
                    a1: getByAlias('a1'),
                    a2: getByAlias('a2'),
                    tel: getByAlias('tel'),
                    gen: getByAlias('gen'),
                    ciudad: getByAlias('ciudad'),
                    entidad: getByAlias('entidad'),
                    dur: getByAlias('dur')
                };
            }

            if (!ultimoPaciente) continue;

            const nombreFinal = [ultimoPaciente.n1, ultimoPaciente.n2, ultimoPaciente.a1, ultimoPaciente.a2].filter(Boolean).join(' ').trim().toUpperCase();

            prescripciones.push({
                numeroNota: notaVal,
                pacienteId: ultimoPaciente.id,
                nombre1: ultimoPaciente.n1,
                nombre2: ultimoPaciente.n2,
                apellido1: ultimoPaciente.a1,
                apellido2: ultimoPaciente.a2,
                nombreCompleto: nombreFinal,
                telefonos: ultimoPaciente.tel,
                genero: ultimoPaciente.gen,
                ciudadResidencia: ultimoPaciente.ciudad,
                entidadAseguradora: ultimoPaciente.entidad,
                atc: atcInput || (finalMatch.atc || ''),
                medicamento: pMedClean || finalMatch.medicamento,
                duracionTratamiento: ultimoPaciente.dur,
                dosis: finalMatch.dosisEstandar || '',
                municipio: ultimoPaciente.ciudad,
                eps: ultimoPaciente.entidad,
                diasAdministracion: finalMatch.diasAdministracion || 30,
                diasDescanso: finalMatch.diasDescanso || 0,
            });
        } catch (e) {
            console.warn("Error en fila:", i, e);
        }
    }

    console.log("Carga completada. Prescripciones válidas:", prescripciones.length);
    return { prescripciones, errores };
}

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

export function generarHojaRuta(
    prescripciones: Prescripcion[],
    pacientes: Paciente[] = [],
    mesesProyeccion: number = 6
): Despacho[] {
    const despachos: Despacho[] = [];
    const hoy = new Date();

    for (const rx of prescripciones) {
        const config = getConfiguracionMedicamento(rx.medicamento);
        const diasCiclo = rx.periodicidadDias || config.diasEntrega || 30;

        let fechaEntrega = new Date(hoy);
        fechaEntrega.setDate(fechaEntrega.getDate() + diasCiclo);

        const fechaLimite = new Date(hoy);
        fechaLimite.setMonth(fechaLimite.getMonth() + mesesProyeccion);

        while (fechaEntrega <= fechaLimite) {
            const fechaIso = fechaEntrega.toISOString().split('T')[0];
            despachos.push({
                id: `${rx.pacienteId}_${fechaIso.replace(/-/g, '')}_${rx.atc}`,
                numeroNota: rx.numeroNota,
                pacienteId: rx.pacienteId,
                nombre1: rx.nombre1,
                nombre2: rx.nombre2,
                apellido1: rx.apellido1,
                apellido2: rx.apellido2,
                nombreCompleto: rx.nombreCompleto,
                telefonos: rx.telefonos,
                genero: rx.genero,
                ciudadResidencia: rx.ciudadResidencia,
                entidadAseguradora: rx.entidadAseguradora,
                atc: rx.atc,
                medicamento: rx.medicamento,
                duracionTratamiento: rx.duracionTratamiento,
                eps: rx.eps,
                municipio: rx.municipio,
                dosis: rx.dosis,
                ciclo: config.ciclo,
                diasEntrega: diasCiclo,
                fechaProgramada: fechaIso,
                confirmado: false,
            });
            fechaEntrega.setDate(fechaEntrega.getDate() + diasCiclo);
        }
    }

    return despachos.sort((a, b) => a.fechaProgramada.localeCompare(b.fechaProgramada));
}

export function generarHojaRutaDesdePacientes(
    pacientes: Paciente[],
    mesesProyeccion: number = 6
): Despacho[] {
    const prescripciones: Prescripcion[] = pacientes
        .filter(p => (p.estado || '').startsWith('AC'))
        .map(p => ({
            pacienteId: p.numeroId || String(p.id),
            numeroNota: '',
            nombre1: p.nombreCompleto.split(' ')[0] || '',
            nombre2: '',
            apellido1: p.nombreCompleto.split(' ')[1] || '',
            apellido2: '',
            nombreCompleto: p.nombreCompleto,
            telefonos: '',
            genero: '',
            ciudadResidencia: p.municipio,
            entidadAseguradora: p.eps,
            atc: '',
            medicamento: p.medicamento,
            duracionTratamiento: 'Indefinido',
            dosis: p.dosisEstandar,
            municipio: p.municipio,
            eps: p.eps,
            diasAdministracion: 30,
            diasDescanso: 0,
        }));

    return generarHojaRuta(prescripciones, pacientes, mesesProyeccion);
}

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

export function esEntregaUrgente(isoDate: string): boolean {
    const hoy = new Date();
    const [y, m, d] = isoDate.split('-').map(Number);
    const fecha = new Date(y, m - 1, d);
    const diffMs = fecha.getTime() - hoy.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
}

export function esEntregaVencida(despacho: Despacho): boolean {
    if (despacho.confirmado) return false;
    const hoy = new Date();
    const [y, m, d] = despacho.fechaProgramada.split('-').map(Number);
    const fecha = new Date(y, m - 1, d);
    return fecha < hoy;
}
