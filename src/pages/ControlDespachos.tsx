import { useState, useRef, useMemo, useCallback } from 'react';
import {
    PackageCheck, Upload, CheckCircle2, Clock, AlertTriangle,
    Search, Filter, ChevronDown, RefreshCw, Trash2, X, FileText,
    Calendar, User, Pill, MapPin, TrendingUp, BarChart2, ChevronLeft, ChevronRight,
    XCircle, PauseCircle, RotateCcw
} from 'lucide-react';
import type { Despacho } from '../data/despachoTypes';
import type { Paciente } from '../data/mockData';
import {
    parseCsvPrescripciones,
    generarHojaRuta,
    generarHojaRutaDesdePacientes,
    formatFechaEntrega,
    esEntregaUrgente,
    esEntregaVencida,
} from '../utils/despachoUtils';
import {
    addDespachos,
    confirmarDespacho as confirmarDespachoFS,
    eliminarTodosLosDespachos,
    actualizarEstadoDespacho,
} from '../services/despachoService';
import DespachoCalendar from '../components/DespachoCalendar';

interface ControlDespachosProps {
    pacientes: Paciente[];
    despachos: Despacho[];
    onRefresh?: () => void;
}

type FiltroEstado = 'todos' | 'pendientes' | 'confirmados' | 'vencidos' | 'urgentes' | 'cancelados' | 'pospuestos' | 'suspendidos';

// ─── Badge de estado ──────────────────────────────────────────────────────────

function EstadoBadge({ despacho }: { despacho: Despacho }) {
    const estado = despacho.estadoActual || (despacho.confirmado ? 'Confirmado' : 'Pendiente');

    if (estado === 'Confirmado') {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: '#dcfce7', color: '#15803d', padding: '3px 10px',
                borderRadius: 20, fontSize: 11, fontWeight: 700
            }}>
                <CheckCircle2 size={12} />Confirmado
            </span>
        );
    }

    if (estado === 'Cancelado') {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: '#fee2e2', color: '#dc2626', padding: '3px 10px',
                borderRadius: 20, fontSize: 11, fontWeight: 700
            }}>
                <XCircle size={12} />Cancelado
            </span>
        );
    }

    if (estado === 'Suspendido') {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: '#fce7f3', color: '#db2777', padding: '3px 10px',
                borderRadius: 20, fontSize: 11, fontWeight: 700
            }}>
                <PauseCircle size={12} />Suspendido
            </span>
        );
    }

    if (estado === 'Pospuesto') {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: '#fef3c7', color: '#b45309', padding: '3px 10px',
                borderRadius: 20, fontSize: 11, fontWeight: 700
            }}>
                <RotateCcw size={12} />Pospuesto
            </span>
        );
    }

    // Si es Pendiente (o no tiene estadoActual definido), evaluamos vencimiento/urgencia
    if (esEntregaVencida(despacho)) {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: '#fee2e2', color: '#dc2626', padding: '3px 10px',
                borderRadius: 20, fontSize: 11, fontWeight: 700
            }}>
                <AlertTriangle size={12} />Vencido
            </span>
        );
    }
    if (esEntregaUrgente(despacho.fechaProgramada)) {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: '#fef3c7', color: '#b45309', padding: '3px 10px',
                borderRadius: 20, fontSize: 11, fontWeight: 700
            }}>
                <AlertTriangle size={12} />Urgente
            </span>
        );
    }
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: '#eff6ff', color: '#2563eb', padding: '3px 10px',
            borderRadius: 20, fontSize: 11, fontWeight: 700
        }}>
            <Clock size={12} />Pendiente
        </span>
    );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color }: {
    icon: React.ReactNode; label: string; value: string | number;
    sub?: string; color: string;
}) {
    return (
        <div style={{
            background: 'white', borderRadius: 14, padding: '18px 20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid var(--gray-100)',
            display: 'flex', alignItems: 'center', gap: 16, minWidth: 0,
        }}>
            <div style={{
                width: 44, height: 44, borderRadius: 12, background: color + '20',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color, flexShrink: 0,
            }}>{icon}</div>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1.1 }}>{value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color, marginTop: 2 }}>{label}</div>
                {sub && <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 1 }}>{sub}</div>}
            </div>
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ControlDespachos({ pacientes, despachos, onRefresh }: ControlDespachosProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'error' | 'info'; msg: string } | null>(null);
    const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
    const [actionModal, setActionModal] = useState<{
        type: 'Cancelar' | 'Posponer' | 'Suspender';
        despacho: Despacho;
    } | null>(null);
    const [actionValue, setActionValue] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
    const [filtroCiclo, setFiltroCiclo] = useState('');
    const [filtroEps, setFiltroEps] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [obsModal, setObsModal] = useState<{ id: string; firestoreId: string } | null>(null);
    const [observaciones, setObservaciones] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showCalendar, setShowCalendar] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortCol, setSortCol] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    // ── Estadísticas ──────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = despachos.length;
        const confirmados = despachos.filter(d => d.confirmado).length;
        const vencidos = despachos.filter(d => esEntregaVencida(d)).length;
        const urgentes = despachos.filter(d => !d.confirmado && esEntregaUrgente(d.fechaProgramada)).length;
        const adherencia = total > 0 ? Math.round((confirmados / total) * 100) : 0;
        return { total, confirmados, vencidos, urgentes, adherencia };
    }, [despachos]);

    // ── Listas para filtros ───────────────────────────────────────────────────
    const epsList = useMemo(() =>
        [...new Set(despachos.map(d => d.eps).filter(Boolean))].sort(),
        [despachos]
    );

    // ── Despachos filtrados ───────────────────────────────────────────────────
    const despachosFiltrados = useMemo(() => {
        const q = busqueda.toLowerCase();
        let filtered = despachos.filter(d => {
            if (q && !d.nombreCompleto.toLowerCase().includes(q) &&
                !d.medicamento.toLowerCase().includes(q) &&
                !d.municipio.toLowerCase().includes(q)) return false;
            if (filtroEps && d.eps !== filtroEps) return false;
            if (filtroCiclo && d.ciclo !== filtroCiclo) return false;
            if (filtroEstado === 'confirmados' && !d.confirmado && d.estadoActual !== 'Confirmado') return false;

            if (filtroEstado === 'pendientes') {
                // Un pendiente NO puede estar confirmado, ni cancelado, ni suspendido, ni ser vencido
                const isFinalizado = d.confirmado || d.estadoActual === 'Confirmado' || d.estadoActual === 'Cancelado' || d.estadoActual === 'Suspendido' || d.estadoActual === 'Pospuesto';
                if (isFinalizado || esEntregaVencida(d)) return false;
            }

            if (filtroEstado === 'vencidos') {
                // Solo vencidos que no estén confirmados ni cancelados
                if (!esEntregaVencida(d) || d.confirmado || d.estadoActual === 'Confirmado' || d.estadoActual === 'Cancelado') return false;
            }

            if (filtroEstado === 'urgentes') {
                // Urgentes que no estén confirmados ni cancelados/suspendidos
                const isFinalizado = d.confirmado || d.estadoActual === 'Confirmado' || d.estadoActual === 'Cancelado' || d.estadoActual === 'Suspendido' || d.estadoActual === 'Pospuesto';
                if (!(esEntregaUrgente(d.fechaProgramada) && !isFinalizado)) return false;
            }

            if (filtroEstado === 'cancelados' && d.estadoActual !== 'Cancelado') return false;
            if (filtroEstado === 'pospuestos' && d.estadoActual !== 'Pospuesto') return false;
            if (filtroEstado === 'suspendidos' && d.estadoActual !== 'Suspendido') return false;

            return true;
        });

        // Ordenar: Más recientes arriba (orden base)
        filtered.sort((a, b) => b.fechaProgramada.localeCompare(a.fechaProgramada));

        // Ordenar por columna seleccionada si existe
        if (sortCol) {
            filtered.sort((a, b) => {
                let valA = '';
                let valB = '';
                if (sortCol === 'fecha') { valA = a.fechaProgramada; valB = b.fechaProgramada; }
                else if (sortCol === 'paciente') { valA = a.nombreCompleto; valB = b.nombreCompleto; }
                else if (sortCol === 'medicamento') { valA = a.medicamento; valB = b.medicamento; }
                else if (sortCol === 'eps') { valA = a.eps || ''; valB = b.eps || ''; }
                else if (sortCol === 'ciclo') { valA = a.ciclo || ''; valB = b.ciclo || ''; }
                else if (sortCol === 'estado') { valA = a.estadoActual || (a.confirmado ? 'Confirmado' : 'Pendiente'); valB = b.estadoActual || (b.confirmado ? 'Confirmado' : 'Pendiente'); }
                const cmp = valA.localeCompare(valB, 'es', { sensitivity: 'base' });
                return sortDir === 'asc' ? cmp : -cmp;
            });
        }

        return filtered;
    }, [despachos, busqueda, filtroEstado, filtroCiclo, filtroEps, sortCol, sortDir]);

    // ── Paginación ────────────────────────────────────────────────────────────
    const totalPages = Math.ceil(despachosFiltrados.length / itemsPerPage);
    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return despachosFiltrados.slice(start, start + itemsPerPage);
    }, [despachosFiltrados, currentPage, itemsPerPage]);

    // Reset page when filters or page-size change
    useMemo(() => {
        setCurrentPage(1);
    }, [busqueda, filtroEstado, filtroCiclo, filtroEps, itemsPerPage]);

    // ── Ordenamiento ──────────────────────────────────────────────────────────
    const handleSort = (col: string) => {
        if (sortCol === col) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortCol(col);
            setSortDir('asc');
        }
        setCurrentPage(1);
    };

    const sortIcon = (col: string) => {
        if (sortCol !== col) return <span style={{ opacity: 0.3, marginLeft: 4 }}>⇅</span>;
        return <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
    };

    // ── Mostrar feedback ──────────────────────────────────────────────────────
    const mostrarFeedback = (tipo: 'ok' | 'error' | 'info', msg: string) => {
        setFeedback({ tipo, msg });
        setTimeout(() => setFeedback(null), 5000);
    };

    // ── Procesar CSV ──────────────────────────────────────────────────────────
    const procesarCsv = useCallback(async (file: File) => {
        if (!file.name.endsWith('.csv')) {
            mostrarFeedback('error', 'Solo se aceptan archivos .csv');
            return;
        }
        setLoading(true);
        try {
            const text = await file.text();
            const { prescripciones, errores } = parseCsvPrescripciones(text);
            if (errores.length > 0 && prescripciones.length === 0) {
                mostrarFeedback('error', errores[0]);
                return;
            }
            const nuevosDespachos = generarHojaRuta(prescripciones, pacientes, 6);
            await addDespachos(nuevosDespachos);
            mostrarFeedback('ok',
                `✅ ${nuevosDespachos.length} entregas generadas desde ${prescripciones.length} prescripciones.` +
                (errores.length > 0 ? ` (${errores.length} advertencias)` : '')
            );
            onRefresh?.();
        } catch (err) {
            mostrarFeedback('error', 'Error al procesar el archivo CSV.');
            console.error(err);
        } finally {
            setLoading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    }, [pacientes, onRefresh]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) procesarCsv(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) procesarCsv(file);
    };

    // ── Generar desde pacientes existentes ────────────────────────────────────
    const generarDesdePacientes = async () => {
        setLoading(true);
        try {
            const nuevos = generarHojaRutaDesdePacientes(pacientes, 6);
            await addDespachos(nuevos);
            mostrarFeedback('ok', `✅ ${nuevos.length} entregas generadas desde ${pacientes.filter(p => p.estado.startsWith('AC')).length} pacientes activos.`);
            onRefresh?.();
        } catch {
            mostrarFeedback('error', 'Error al generar la hoja de ruta.');
        } finally {
            setLoading(false);
        }
    };

    // ── Confirmar despacho ────────────────────────────────────────────────────
    const handleConfirmar = async (despacho: Despacho) => {
        if (!despacho.firestoreId) {
            mostrarFeedback('error', 'No se puede confirmar: falta el ID de Firestore.');
            return;
        }
        setObsModal({ id: despacho.id, firestoreId: despacho.firestoreId });
    };

    const confirmar = async () => {
        if (!obsModal) return;
        setConfirmandoId(obsModal.id);
        try {
            await confirmarDespachoFS(obsModal.firestoreId, observaciones);
            mostrarFeedback('ok', '✅ Despacho confirmado exitosamente.');
            onRefresh?.();
        } catch {
            mostrarFeedback('error', 'Error al confirmar el despacho.');
        } finally {
            setConfirmandoId(null);
            setObsModal(null);
            setObservaciones('');
        }
    };

    const ejecutarAccion = async () => {
        if (!actionModal) return;
        if (!actionValue && actionModal.type !== 'Suspender') {
            mostrarFeedback('error', 'Por favor completa la información requerida.');
            return;
        }

        setActionLoading(true);
        try {
            const { type, despacho } = actionModal;
            if (!despacho.firestoreId) throw new Error('No FS ID');

            if (type === 'Posponer') {
                await actualizarEstadoDespacho(despacho.firestoreId, 'Pospuesto', 'Reprogramación', actionValue);
            } else if (type === 'Cancelar') {
                await actualizarEstadoDespacho(despacho.firestoreId, 'Cancelado', actionValue);
            } else if (type === 'Suspender') {
                await actualizarEstadoDespacho(despacho.firestoreId, 'Suspendido', actionValue);
            }

            mostrarFeedback('ok', `✅ Despacho ${type.toLowerCase()} con éxito.`);
            onRefresh?.();
            setActionModal(null);
            setActionValue('');
        } catch (err) {
            console.error(err);
            mostrarFeedback('error', 'Error al ejecutar la acción.');
        } finally {
            setActionLoading(false);
        }
    };

    // ── Limpiar todo ──────────────────────────────────────────────────────────
    const limpiarTodo = async () => {
        if (!window.confirm('¿Deseas eliminar TODOS los despachos programados? Esta acción no se puede deshacer.')) return;
        setLoading(true);
        try {
            await eliminarTodosLosDespachos();
            mostrarFeedback('info', 'Todos los despachos han sido eliminados.');
            onRefresh?.();
        } catch {
            mostrarFeedback('error', 'Error al eliminar los despachos.');
        } finally {
            setLoading(false);
        }
    };

    // ─── RENDER ───────────────────────────────────────────────────────────────
    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {showCalendar && (
                <DespachoCalendar
                    despachos={despachos}
                    onClose={() => setShowCalendar(false)}
                    onConfirm={async (id, obs) => {
                        const d = despachos.find(x => x.id === id);
                        if (d?.firestoreId) {
                            try {
                                await confirmarDespachoFS(d.firestoreId, obs);
                                mostrarFeedback('ok', '✅ Despacho confirmado desde el calendario.');
                                onRefresh?.();
                            } catch {
                                mostrarFeedback('error', 'Error al confirmar desde el calendario.');
                            }
                        }
                    }}
                    onUpdateStatus={async (id, estado, motivo, fecha) => {
                        const d = despachos.find(x => x.id === id);
                        if (d?.firestoreId) {
                            try {
                                await actualizarEstadoDespacho(d.firestoreId, estado, motivo, fecha);
                                mostrarFeedback('ok', `✅ Estado actualizado a ${estado} desde el calendario.`);
                                onRefresh?.();
                            } catch {
                                mostrarFeedback('error', 'Error al actualizar estado desde el calendario.');
                            }
                        }
                    }}
                />
            )}

            {/* Feedback Toast */}
            {feedback && (
                <div style={{
                    position: 'fixed', top: 80, right: 24, zIndex: 9999,
                    background: feedback.tipo === 'ok' ? '#15803d' : feedback.tipo === 'error' ? '#dc2626' : '#2563eb',
                    color: 'white', padding: '12px 20px', borderRadius: 12,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)', fontSize: 13,
                    maxWidth: 420, display: 'flex', gap: 12, alignItems: 'center',
                }}>
                    <span style={{ flex: 1 }}>{feedback.msg}</span>
                    <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Modal de Observaciones */}
            {obsModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '80px 16px',
                }}>
                    <div style={{
                        background: 'white', borderRadius: 16, padding: 28, width: '100%',
                        maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 8 }}>
                            Confirmar Despacho
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>
                            Agrega observaciones opcionales antes de confirmar.
                        </p>
                        <textarea
                            placeholder="Observaciones (opcional)..."
                            value={observaciones}
                            onChange={e => setObservaciones(e.target.value)}
                            style={{
                                width: '100%', minHeight: 80, borderRadius: 10, padding: '10px 12px',
                                border: '1.5px solid var(--gray-200)', fontSize: 13, resize: 'vertical',
                                fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
                            }}
                        />
                        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setObsModal(null); setObservaciones(''); }}
                                style={{
                                    padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--gray-200)',
                                    background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                                    color: 'var(--gray-700)'
                                }}>
                                Cancelar
                            </button>
                            <button
                                onClick={confirmar}
                                style={{
                                    padding: '9px 18px', borderRadius: 10, border: 'none',
                                    background: '#16a34a', color: 'white', cursor: 'pointer',
                                    fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7,
                                }}>
                                <CheckCircle2 size={15} />Confirmar Despacho
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ KPI Cards ═════════════════════════════════════════════════ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
                <KpiCard icon={<BarChart2 size={20} />} label="Total Programadas" value={stats.total} color="#6366f1" />
                <KpiCard icon={<CheckCircle2 size={20} />} label="Entregas Efectivas" value={stats.confirmados}
                    sub={`de ${stats.total} programadas`} color="#16a34a" />
                <KpiCard icon={<Clock size={20} />} label="Pendientes" value={stats.total - stats.confirmados - stats.vencidos} color="#2563eb" />
                <KpiCard icon={<AlertTriangle size={20} />} label="Vencidas" value={stats.vencidos} color="#dc2626" />
                <KpiCard icon={<TrendingUp size={20} />} label="% Adherencia" value={`${stats.adherencia}%`}
                    sub="Efectivas vs. Programadas" color="#f59e0b" />
            </div>

            {/* ═══ Barra de Acciones ══════════════════════════════════════════ */}
            <div style={{
                background: 'white', borderRadius: 14, padding: '18px 20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid var(--gray-100)',
                display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
            }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
                        Cargar Prescripciones
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--gray-500)', margin: '2px 0 0' }}>
                        Sube un CSV o genera desde los pacientes activos del sistema.
                    </p>
                </div>

                {/* Drop Zone CSV */}
                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    style={{
                        border: `2px dashed ${dragOver ? '#6366f1' : 'var(--gray-200)'}`,
                        borderRadius: 12, padding: '12px 20px', cursor: 'pointer',
                        background: dragOver ? '#f5f3ff' : '#fafafa',
                        display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
                        color: dragOver ? '#6366f1' : 'var(--gray-600)', transition: 'all 0.2s',
                        minWidth: 180,
                    }}>
                    <Upload size={18} />
                    <span>Subir CSV <span style={{ color: 'var(--gray-400)', fontSize: 11 }}>(o arrastrar aquí)</span></span>
                    <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />
                </div>

                <button
                    onClick={() => setShowCalendar(true)}
                    style={{
                        padding: '12px 18px', borderRadius: 12, border: 'none',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white', cursor: 'pointer',
                        fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                    <Calendar size={16} />
                    CALENDARIO
                </button>

                <button
                    onClick={generarDesdePacientes}
                    disabled={loading}
                    style={{
                        padding: '12px 18px', borderRadius: 12, border: 'none',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
                        opacity: loading ? 0.7 : 1,
                    }}>
                    <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    Generar desde Pacientes
                </button>

                {despachos.length > 0 && (
                    <button
                        onClick={limpiarTodo}
                        disabled={loading}
                        style={{
                            padding: '12px 16px', borderRadius: 12,
                            border: '1.5px solid #fee2e2', background: '#fff5f5',
                            color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 7,
                        }}>
                        <Trash2 size={14} />Limpiar
                    </button>
                )}
            </div>

            {/* ═══ Filtros ════════════════════════════════════════════════════ */}
            <div style={{
                background: 'white', borderRadius: 14, padding: '14px 18px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid var(--gray-100)',
                display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
            }}>
                {/* Búsqueda */}
                <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                    <input
                        type="text" placeholder="Buscar paciente, medicamento..."
                        value={busqueda} onChange={e => setBusqueda(e.target.value)}
                        style={{
                            width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10,
                            border: '1.5px solid var(--gray-200)', fontSize: 13, outline: 'none',
                            boxSizing: 'border-box',
                        }} />
                </div>

                {/* Estado */}
                <div style={{ position: 'relative' }}>
                    <Filter size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                    <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value as FiltroEstado)} style={{ padding: '9px 32px 9px 28px', borderRadius: 10, border: '1.5px solid var(--gray-200)', fontSize: 13, cursor: 'pointer', outline: 'none', appearance: 'none', background: 'white' }}>
                        <option value="todos">Todos los estados</option>
                        <option value="pendientes">Pendientes</option>
                        <option value="urgentes">Urgentes (7 días)</option>
                        <option value="confirmados">Confirmados</option>
                        <option value="cancelados">Cancelados</option>
                        <option value="pospuestos">Pospuestos</option>
                        <option value="suspendidos">Suspendidos</option>
                        <option value="vencidos">Vencidos</option>
                    </select>
                    <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
                </div>

                {/* Ciclo */}
                <div style={{ position: 'relative' }}>
                    <select value={filtroCiclo} onChange={e => setFiltroCiclo(e.target.value)} style={{ padding: '9px 32px 9px 12px', borderRadius: 10, border: '1.5px solid var(--gray-200)', fontSize: 13, cursor: 'pointer', outline: 'none', appearance: 'none', background: 'white' }}>
                        <option value="">Todos los ciclos</option>
                        <option value="Mensual">Mensual</option>
                        <option value="Quincenal">Quincenal</option>
                        <option value="Semanal">Semanal</option>
                    </select>
                    <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
                </div>

                {/* EPS */}
                {epsList.length > 0 && (
                    <div style={{ position: 'relative' }}>
                        <select value={filtroEps} onChange={e => setFiltroEps(e.target.value)} style={{ padding: '9px 32px 9px 12px', borderRadius: 10, border: '1.5px solid var(--gray-200)', fontSize: 13, cursor: 'pointer', outline: 'none', appearance: 'none', background: 'white', maxWidth: 220 }}>
                            <option value="">Todas las EPS</option>
                            {epsList.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                        <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
                    </div>
                )}

                {/* Selector de registros por página */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                    <span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 500 }}>Mostrar</span>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={itemsPerPage}
                            onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            style={{
                                padding: '7px 32px 7px 12px', borderRadius: 10,
                                border: '1.5px solid #c7d2fe', fontSize: 12,
                                fontWeight: 700, color: '#4f46e5',
                                background: '#eef2ff',
                                cursor: 'pointer', outline: 'none', appearance: 'none',
                            }}
                        >
                            <option value={10}>10 / página</option>
                            <option value={25}>25 / página</option>
                            <option value={50}>50 / página</option>
                            <option value={100}>100 / página</option>
                        </select>
                        <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#4f46e5', pointerEvents: 'none' }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                        {despachosFiltrados.length} de {despachos.length} entregas
                    </span>
                </div>
            </div>

            {/* ═══ Tabla de Despachos ═════════════════════════════════════════ */}
            <div style={{
                background: 'white', borderRadius: 14, padding: 0,
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid var(--gray-100)',
                overflow: 'hidden',
            }}>
                {despachos.length === 0 ? (
                    <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                        <PackageCheck size={48} style={{ color: 'var(--gray-300)', marginBottom: 12 }} />
                        <h3 style={{ color: 'var(--gray-600)', marginBottom: 6 }}>No hay entregas programadas</h3>
                        <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>
                            Sube un CSV de prescripciones o haz clic en "Generar desde Pacientes" para comenzar.
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--gray-100)' }}>
                                    {([
                                        { key: 'fecha', label: 'Fecha Programada' },
                                        { key: 'paciente', label: 'Paciente' },
                                        { key: 'medicamento', label: 'Medicamento' },
                                        { key: 'eps', label: 'EPS / Ciudad' },
                                        { key: 'ciclo', label: 'Ciclo' },
                                        { key: 'estado', label: 'Estado' },
                                        { key: null, label: 'Acciones' },
                                    ] as { key: string | null; label: string }[]).map(col => (
                                        <th
                                            key={col.label}
                                            onClick={col.key ? () => handleSort(col.key!) : undefined}
                                            style={{
                                                padding: '12px 14px',
                                                textAlign: 'center',
                                                fontSize: 11, fontWeight: 700,
                                                color: sortCol === col.key ? 'var(--primary)' : 'var(--gray-500)',
                                                textTransform: 'uppercase',
                                                letterSpacing: 0.5, whiteSpace: 'nowrap',
                                                cursor: col.key ? 'pointer' : 'default',
                                                userSelect: 'none',
                                                transition: 'color 0.15s',
                                            }}
                                        >
                                            {col.label}{col.key ? sortIcon(col.key) : null}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((d, i) => {
                                    const isVencido = esEntregaVencida(d);
                                    const isUrgente = esEntregaUrgente(d.fechaProgramada);
                                    const rowBg = d.confirmado ? '#f0fdf4' : isVencido ? '#fff5f5' : isUrgente ? '#fffbeb' : i % 2 === 0 ? 'white' : '#fafafa';

                                    return (
                                        <tr key={d.id} style={{ background: rowBg, borderBottom: '1px solid var(--gray-100)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '11px 14px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center' }}>
                                                    <Calendar size={14} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontWeight: 700, color: 'var(--gray-800)' }}>{d.fechaProgramada}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{formatFechaEntrega(d.fechaProgramada)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '11px 14px', textAlign: 'left' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'flex-start' }}>
                                                    <User size={14} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                                                    <div style={{ textAlign: 'left' }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--gray-800)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.nombreCompleto}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{d.pacienteId}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '11px 14px', textAlign: 'left' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'flex-start' }}>
                                                    <Pill size={14} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                                                    <div style={{ textAlign: 'left' }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--gray-800)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.medicamento}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{d.dosis}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '11px 14px', textAlign: 'left' }}>
                                                <div style={{ textAlign: 'left' }}>
                                                    <div style={{ fontWeight: 500, color: 'var(--gray-700)', fontSize: 12 }}>{d.eps || '—'}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--gray-400)', justifyContent: 'flex-start' }}>
                                                        <MapPin size={11} />{d.municipio || '—'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                                    background: d.ciclo === 'Quincenal' ? '#fef3c7' : d.ciclo === 'Semanal' ? '#ede9fe' : '#eff6ff',
                                                    color: d.ciclo === 'Quincenal' ? '#b45309' : d.ciclo === 'Semanal' ? '#7c3aed' : '#2563eb',
                                                    display: 'inline-block'
                                                }}>
                                                    {d.ciclo}
                                                </span>
                                            </td>
                                            <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    <EstadoBadge despacho={d} />
                                                    {d.confirmado && d.fechaConfirmacion && (
                                                        <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 2 }}>
                                                            {d.fechaConfirmacion}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                                                {!d.confirmado ? (
                                                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => handleConfirmar(d)}
                                                            disabled={confirmandoId === d.id}
                                                            style={{
                                                                padding: '6px 10px', borderRadius: 8, border: 'none',
                                                                background: '#16a34a', color: 'white', cursor: 'pointer',
                                                                fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
                                                                opacity: confirmandoId === d.id ? 0.6 : 1, transition: 'all 0.2s',
                                                            }}
                                                            title="Confirmar Entrega"
                                                        >
                                                            Confirmar
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setActionModal({ type: 'Cancelar', despacho: d });
                                                                setActionValue('Paciente no requiere medicamento');
                                                            }}
                                                            style={{
                                                                padding: '6px 10px', borderRadius: 8, border: '1px solid #dc2626',
                                                                background: 'transparent', color: '#dc2626', cursor: 'pointer',
                                                                fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
                                                            }}
                                                            title="Cancelar Entrega"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            onClick={() => setActionModal({ type: 'Posponer', despacho: d })}
                                                            style={{
                                                                padding: '6px 10px', borderRadius: 8, border: '1px solid #2563eb',
                                                                background: 'transparent', color: '#2563eb', cursor: 'pointer',
                                                                fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
                                                            }}
                                                            title="Posponer Entrega"
                                                        >
                                                            Posponer
                                                        </button>
                                                        <button
                                                            onClick={() => setActionModal({ type: 'Suspender', despacho: d })}
                                                            style={{
                                                                padding: '6px 10px', borderRadius: 8, border: '1px solid #4b5563',
                                                                background: 'transparent', color: '#4b5563', cursor: 'pointer',
                                                                fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
                                                            }}
                                                            title="Suspender Entrega"
                                                        >
                                                            Suspender
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                                        <span style={{ fontSize: 12, color: d.estadoActual === 'Cancelado' ? '#dc2626' : d.estadoActual === 'Suspendido' ? '#4b5563' : '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                                                            {d.estadoActual === 'Cancelado' ? '✕ Cancelado' : d.estadoActual === 'Suspendido' ? '⏸ Suspendido' : '✓ Despachado'}
                                                        </span>
                                                        {d.motivo && <span style={{ fontSize: 10, color: 'var(--gray-500)', fontStyle: 'italic', textAlign: 'center' }}>{d.motivo}</span>}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Controles de Paginación */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 16, padding: '12px 16px', borderTop: '1px solid var(--gray-100)',
                            background: '#f8fafc', flexWrap: 'wrap',
                        }}>
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
                                    borderRadius: 8, border: '1.5px solid var(--gray-200)',
                                    background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    fontSize: 12, fontWeight: 600, color: 'var(--gray-600)',
                                    opacity: currentPage === 1 ? 0.5 : 1,
                                }}>
                                <ChevronLeft size={16} /> Anterior
                            </button>

                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>
                                Página {currentPage} de {Math.max(1, totalPages)}
                            </span>

                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
                                    borderRadius: 8, border: '1.5px solid var(--gray-200)',
                                    background: 'white', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                                    fontSize: 12, fontWeight: 600, color: 'var(--gray-600)',
                                    opacity: currentPage >= totalPages ? 0.5 : 1,
                                }}>
                                Siguiente <ChevronRight size={16} />
                            </button>
                        </div>
                        {despachosFiltrados.length === 0 && (
                            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                                No hay entregas que coincidan con los filtros aplicados.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ═══ Modal de Acciones (Cancelar/Posponer/Suspender) ═══ */}
            {actionModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700, color: 'var(--gray-900)' }}>
                            {actionModal.type} Despacho
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 20 }}>
                            {actionModal.type === 'Posponer'
                                ? 'Selecciona la nueva fecha para esta entrega:'
                                : `Indica el motivo para ${actionModal.type.toLowerCase()} esta programación:`}
                        </p>

                        {actionModal.type === 'Posponer' ? (
                            <input
                                type="date"
                                value={actionValue}
                                onChange={(e) => setActionValue(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid var(--gray-200)', marginBottom: 20, outline: 'none' }}
                            />
                        ) : (
                            <select
                                value={actionValue}
                                onChange={(e) => setActionValue(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid var(--gray-200)', marginBottom: 20, outline: 'none', background: 'white' }}
                            >
                                <option value="">Seleccione un motivo...</option>
                                {actionModal.type === 'Cancelar' ? (
                                    <>
                                        <option value="Paciente fallecido">Paciente fallecido</option>
                                        <option value="Error en prescripción">Error en prescripción</option>
                                        <option value="Duplicado">Duplicado</option>
                                        <option value="Paciente trasladado">Paciente trasladado</option>
                                        <option value="Paciente no requiere medicamento">Paciente no requiere medicamento</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="Falta de inventario (Stock-out)">Falta de inventario (Stock-out)</option>
                                        <option value="Dirección incorrecta">Dirección incorrecta</option>
                                        <option value="Documentación incompleta">Documentación incompleta</option>
                                        <option value="Paciente solicita pausa">Paciente solicita pausa</option>
                                    </>
                                )}
                            </select>
                        )}

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setActionModal(null)}
                                style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--gray-200)', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                            >
                                Volver
                            </button>
                            <button
                                onClick={ejecutarAccion}
                                disabled={actionLoading}
                                style={{
                                    padding: '10px 16px', borderRadius: 10, border: 'none',
                                    background: actionModal.type === 'Cancelar' ? '#dc2626' : actionModal.type === 'Posponer' ? '#2563eb' : '#4b5563',
                                    color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                    opacity: actionLoading ? 0.7 : 1
                                }}
                            >
                                {actionLoading ? 'Procesando...' : `Confirmar ${actionModal.type}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Leyenda ════════════════════════════════════════════════════ */}
            {despachos.length > 0 && (
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--gray-500)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: '#dcfce7', display: 'inline-block' }} />Confirmado
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: '#fef3c7', display: 'inline-block' }} />Urgente (≤7 días)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: '#fee2e2', display: 'inline-block' }} />Vencido
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'inline-block' }} />Pendiente
                    </span>
                </div>
            )}
        </div>
    );
}
