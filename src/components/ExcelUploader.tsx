import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Paciente, EstadoCode } from '../data/mockData';

interface ExcelUploaderProps {
    onDataLoaded: (pacientes: Paciente[], year?: number) => void;
    compact?: boolean;
}

export default function ExcelUploader({ onDataLoaded, compact = false }: ExcelUploaderProps) {
    const [dragging, setDragging] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [fileName, setFileName] = useState('');

    const processFile = (file: File) => {
        setStatus('loading');
        setFileName(file.name);
        setMessage('Procesando...');

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });

                // Logic to find sheet and parse data (reused)
                const sheetName = workbook.SheetNames.find((n: string) =>
                    n.includes('NUEVA ESTRUCTURA') || n.includes('BASE DE DATOS') || n.includes('Hoja2')
                ) || workbook.SheetNames[0];

                const sheet = workbook.Sheets[sheetName];
                const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

                // Find header
                let headerIdx = -1;
                for (let i = 0; i < Math.min(rows.length, 20); i++) {
                    if (rows[i]?.some((c: any) =>
                        String(c).toUpperCase().includes('NOMBRE') ||
                        String(c).toUpperCase().includes('PACIENTE') ||
                        String(c).toUpperCase().includes('MEDICAMENTO') ||
                        String(c).toUpperCase().includes('IDENTIFICACION') ||
                        String(c).toUpperCase().includes('CEDULA')
                    )) {
                        headerIdx = i; break;
                    }
                }

                if (headerIdx === -1) throw new Error("No se encontró fila de encabezados válida");

                const headers = rows[headerIdx].map((h: any) => String(h || '').trim().toUpperCase());
                console.log('📋 Encabezados detectados:', headers.filter((h: string) => h));

                // Smart column finder: uses word boundary matching to avoid false positives
                // e.g. 'ID' should NOT match 'ENTIDAD'
                const getCol = (row: any[], ...names: string[]) => {
                    for (const name of names) {
                        const idx = headers.findIndex((h: string) => {
                            // Exact match
                            if (h === name) return true;
                            // Word boundary match: the name must be surrounded by non-alphanumeric chars or start/end
                            const regex = new RegExp('(^|[^A-Z0-9])' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^A-Z0-9]|$)');
                            return regex.test(h);
                        });
                        if (idx >= 0) return row[idx];
                    }
                    return null;
                };

                const dataRows = rows.slice(headerIdx + 1);
                const pacientes: Paciente[] = dataRows.map((row: any[], i: number) => {
                    // Mapeo detallado
                    const nombreFull = String(getCol(row, 'NOMBRE COMPLETO', 'PACIENTE', 'NOMBRE') || '').trim();
                    if (!nombreFull) return null;

                    // ID - Use specific keywords first, then generic 'ID' (safe with word-boundary matching)
                    const numeroId = String(getCol(row, 'CEDULA', 'CÉDULA', 'IDENTIFICACION', 'IDENTIFICACIÓN', 'ID', 'NRO IDENTIFICACION', 'NO. IDENTIFICACION', 'DOCUMENTO', 'CC', 'NRO DOC', 'NUM DOC', 'NUMERO IDENTIFICACION', 'NO IDENTIFICACION') || '').trim();
                    // Debug: log first patient's ID
                    if (i === 0) console.log('🔍 Primer paciente - Nombre:', nombreFull, '| ID detectado:', numeroId);

                    // Fechas y Edad
                    let fechaNacimiento = '';
                    let edad = 0;

                    // Intento obtener edad directa
                    const valEdad = getCol(row, 'EDAD', 'AÑOS');
                    if (valEdad) edad = parseInt(String(valEdad)) || 0;

                    // Intento obtener fecha nacimiento - Expanded matching
                    const valNac = getCol(row, 'FECHA NACIMIENTO', 'NACIMIENTO', 'FN', 'F. NAC', 'FECHA_NAC', 'F.N.', 'NAC', 'FECHA NAC');
                    if (valNac) {
                        let dateNac: Date | null = null;
                        if (valNac instanceof Date) {
                            dateNac = valNac;
                        } else if (typeof valNac === 'string') {
                            const cleanDate = valNac.trim();
                            // Intentar parseo nativo
                            const tryDate = new Date(cleanDate);
                            if (!isNaN(tryDate.getTime())) {
                                dateNac = tryDate;
                            } else {
                                // Intentar DD/MM/YYYY manual
                                const parts = cleanDate.split('/');
                                if (parts.length === 3) {
                                    const day = parseInt(parts[0]);
                                    const month = parseInt(parts[1]) - 1;
                                    const year = parseInt(parts[2]);
                                    const manualDate = new Date(year, month, day);
                                    if (!isNaN(manualDate.getTime())) dateNac = manualDate;
                                }
                            }
                        }

                        if (dateNac && !isNaN(dateNac.getTime())) {
                            fechaNacimiento = dateNac.toISOString().split('T')[0];
                            // Recalcular edad si no venía o era 0
                            if (!edad) {
                                const diff = Date.now() - dateNac.getTime();
                                edad = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
                            }
                        }
                    }

                    // Sexo / Genero
                    const valSexo = String(getCol(row, 'SEXO', 'GENERO') || '').toUpperCase();
                    // Detectar Femenino por 'F', 'MUJ', 'FEM'
                    const isWoman = valSexo.startsWith('F') || valSexo.startsWith('MUJ') || valSexo.includes('FEM');
                    // Fallback visual si vacio: alternar (solo para demo visual si falta data)
                    const sexo: 'M' | 'F' = valSexo ? (isWoman ? 'F' : 'M') : ((i % 2 !== 0) ? 'F' : 'M');

                    // Datos contacto
                    const telefono = String(getCol(row, 'TELEFONO', 'CELULAR', 'MOVIL', 'CONTACTO', 'TEL', 'CEL', 'TELF') || '').trim();
                    const municipio = String(getCol(row, 'MUNICIPIO', 'CIUDAD', 'RESIDENCIA') || '').trim();
                    const eps = String(getCol(row, 'EPS', 'ASEGURADORA') || '').replace(/\s+/g, ' ').trim();
                    const entidad = String(getCol(row, 'ENTIDAD', 'IPS', 'CONTRATO') || '').trim();

                    // Estado
                    // Mapeo simple de texto a codigo si es necesario, o pasar directo
                    let rawEstado = String(getCol(row, 'ESTADO') || 'AC').trim().toUpperCase();
                    // Normalizar algunos comunes si vienen texto completo
                    if (rawEstado.includes('ACTIVO') && rawEstado.includes('QUIMIO')) rawEstado = 'ACT ONC QXT';
                    else if (rawEstado.includes('ACTIVO') && rawEstado.includes('NO ONC')) rawEstado = 'ACT NO ONC';
                    else if (rawEstado.includes('ACTIVO')) rawEstado = 'AC ONC';
                    else if (rawEstado.includes('SUSPEN')) rawEstado = 'IN S';
                    else if (rawEstado.includes('FALLECI')) rawEstado = 'IN F';

                    const estado = rawEstado as EstadoCode;

                    // Tratamiento
                    const medicamento = String(getCol(row, 'MEDICAMENTO', 'MOLECULA', 'PRINCIPIO') || '').trim();
                    const dosisEstandar = String(getCol(row, 'DOSIS', 'POSOLOGIA', 'CONCENTRACION') || '').trim();
                    const diasAdministracion = parseInt(String(getCol(row, 'ADMINISTRACION', 'DIAS TOMA') || '0')) || 0;
                    const diasDescanso = parseInt(String(getCol(row, 'DESCANSO') || '0')) || 0;

                    // Entregas Meses
                    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
                    const entregas: any = {};
                    meses.forEach(m => {
                        const val = getCol(row, m);
                        if (val !== undefined && val !== null && String(val).trim() !== '') {
                            entregas[m.toLowerCase()] = String(val).trim();
                        }
                    });

                    // Split name into parts for nombre1/apellido1
                    const nameParts = nombreFull.split(/\s+/);
                    const nombre1 = nameParts[0] || '';
                    const nombre2 = nameParts.length > 2 ? nameParts[1] : '';
                    const apellido1 = nameParts.length > 2 ? nameParts[2] : (nameParts[1] || '');
                    const apellido2 = nameParts.length > 3 ? nameParts.slice(3).join(' ') : '';

                    return {
                        id: i + 1,
                        nombre1,
                        nombre2,
                        apellido1,
                        apellido2,
                        nombreCompleto: nombreFull,
                        tipoId: 'CC', // Default
                        numeroId,
                        eps,
                        telefono,
                        municipio,
                        entidad,
                        fechaNacimiento,
                        edad,
                        sexo,
                        estado,
                        medicamento,
                        presentacionComercial: '',
                        dosisEstandar,
                        diasAdministracion,
                        diasDescanso,
                        entregas
                    };

                }).filter(Boolean) as Paciente[];

                // Detect Year from headers
                const headerStr = headers.join(' ');
                const yearMatch = headerStr.match(/202[0-9]/);
                const detectedYear = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();

                // Pass extra data if possible or store in localStorage/state
                // Since onDataLoaded only takes Paciente[], we need a way to pass the year.
                // We'll dispatch a custom event or use a second argument if we update the interface.
                // For now, let's attach it to the first patient as metadata? No, dirty.
                // Let's modify App.tsx to accept the year. But here I can update onDataLoaded call if I update the prop type.

                // Hack: We can use a global state or callback.
                // I will update the interface to accept the year.
                // But first let's update this file, assuming the prop will change.
                // Actually, I can't change the component prop if I don't update the interface in the file.
                // I will update the interface below.

                // @ts-ignore
                onDataLoaded(pacientes, detectedYear);
                setStatus('success');
                setMessage('Carga completa');
                setTimeout(() => setStatus('idle'), 3000);
            } catch (err) {
                console.error(err);
                setStatus('error');
                setMessage('Error formato');
                setTimeout(() => setStatus('idle'), 3000);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            processFile(file);
        }
    }, []);

    if (compact) {
        return (
            <div>
                <input
                    type="file"
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                    id="header-upload"
                    onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                />
                <label
                    htmlFor="header-upload"
                    className="btn-primary"
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        cursor: 'pointer', padding: '8px 16px', fontSize: 13,
                        background: status === 'error' ? '#ef4444' : status === 'success' ? '#05cd99' : 'var(--primary)',
                        color: 'white', borderRadius: 12, border: 'none', boxShadow: 'none'
                    }}
                >
                    {status === 'loading' ? <FileSpreadsheet className="animate-pulse" size={16} /> : <Upload size={16} />}
                    {status === 'loading' ? 'Cargando...' : status === 'success' ? '¡Listo!' : status === 'error' ? 'Error' : 'Cargar Excel'}
                </label>
            </div>
        );
    }

    return (
        <div
            className={`upload-zone ${dragging ? 'dragging' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.xlsx,.xls';
                input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) processFile(file);
                };
                input.click();
            }}
        >
            <div className="upload-zone-icon">
                {status === 'success' ? <CheckCircle size={28} /> :
                    status === 'error' ? <AlertCircle size={28} style={{ color: '#ef4444' }} /> :
                        status === 'loading' ? <FileSpreadsheet size={28} style={{ animation: 'pulse 1s infinite' }} /> :
                            <Upload size={28} />}
            </div>

            {status === 'idle' && (
                <>
                    <h3>Cargar Matriz Excel</h3>
                    <p>Arrastra tu archivo <span className="highlight">MATRIZ TRATAMIENTO ORAL</span> aquí</p>
                    <p style={{ marginTop: 8, fontSize: 12 }}>o <span className="highlight">haz clic para seleccionar</span></p>
                </>
            )}

            {status === 'loading' && (
                <>
                    <h3>Procesando...</h3>
                    <p>{fileName}</p>
                </>
            )}

            {status === 'success' && (
                <>
                    <h3 style={{ color: 'var(--accent)' }}>¡Cargado exitosamente!</h3>
                    <p style={{ color: 'var(--gray-600)' }}>{message}</p>
                </>
            )}

            {status === 'error' && (
                <>
                    <h3 style={{ color: '#ef4444' }}>Error al cargar</h3>
                    <p style={{ color: 'var(--gray-600)', fontSize: 13 }}>{message}</p>
                </>
            )}
        </div>
    );
}
