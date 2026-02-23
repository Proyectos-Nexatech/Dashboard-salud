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
import type { MedicamentoInfo } from '../data/medicamentosData';

interface ControlDespachosProps {
    pacientes: Paciente[];
    medicamentos: MedicamentoInfo[];
    despachos: Despacho[];
    onRefresh?: () => void;
}

type FiltroEstado = 'todos' | 'pendientes' | 'agendados' | 'entregados' | 'vencidos' | 'urgentes' | 'cancelados' | 'pospuestos';

// ─── Badge de estado ──────────────────────────────────────────────────────────

function EstadoBadge({ despacho }: { despacho: Despacho }) {
    const estado = despacho.estadoActual || (despacho.confirmado ? 'Entregado' : 'Pendiente');

    if (estado === 'Entregado') {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: '#dcfce7', color: '#15803d', padding: '3px 10px',
                borderRadius: 20, fontSize: 11, fontWeight: 700
            }}>
                <CheckCircle2 size={12} />Entregado
            </span>
        );
    }

    if (estado === 'Agendado') {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: '#e0f2fe', color: '#0369a1', padding: '3px 10px',
                borderRadius: 20, fontSize: 11, fontWeight: 700
            }}>
                <Calendar size={12} />Agendado
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

export default function ControlDespachos({ pacientes, medicamentos, despachos, onRefresh }: ControlDespachosProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'error' | 'info'; msg: string } | null>(null);
    const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
    const [actionModal, setActionModal] = useState<{
        type: 'Cancelar' | 'Posponer' | 'Agendar' | 'Entregar';
        despacho: Despacho;
    } | null>(null);
    const [actionValue, setActionValue] = useState('');
    const [actionDate, setActionDate] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
    const [filtroCiclo, setFiltroCiclo] = useState('');
    const [filtroEps, setFiltroEps] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showCalendar, setShowCalendar] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortCol, setSortCol] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    // ── Estadísticas ──────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = despachos.length;
        const entregados = despachos.filter(d => d.confirmado || d.estadoActual === 'Entregado').length;
        const vencidos = despachos.filter(d => esEntregaVencida(d)).length;
        const urgentes = despachos.filter(d => !(d.confirmado || d.estadoActual === 'Entregado') && esEntregaUrgente(d.fechaProgramada)).length;
        const adherencia = total > 0 ? Math.round((entregados / total) * 100) : 0;
        return { total, entregados, vencidos, urgentes, adherencia };
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

            const estado = d.estadoActual || (d.confirmado ? 'Entregado' : 'Pendiente');

            if (filtroEstado === 'entregados' && estado !== 'Entregado') return false;
            if (filtroEstado === 'agendados' && estado !== 'Agendado') return false;

            if (filtroEstado === 'pendientes') {
                if (estado !== 'Pendiente' || esEntregaVencida(d)) return false;
            }

            if (filtroEstado === 'vencidos') {
                if (!esEntregaVencida(d) || d.confirmado || estado === 'Entregado' || estado === 'Cancelado') return false;
            }

            if (filtroEstado === 'urgentes') {
                const isFinalizado = d.confirmado || estado === 'Entregado' || estado === 'Cancelado' || estado === 'Pospuesto';
                if (!(esEntregaUrgente(d.fechaProgramada) && !isFinalizado)) return false;
            }

            if (filtroEstado === 'cancelados' && estado !== 'Cancelado') return false;
            if (filtroEstado === 'pospuestos' && estado !== 'Pospuesto') return false;

            return true;

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
                else if (sortCol === 'estado') { valA = a.estadoActual || (a.confirmado ? 'Entregado' : 'Pendiente'); valB = b.estadoActual || (b.confirmado ? 'Entregado' : 'Pendiente'); }
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
            const { prescripciones, errores } = parseCsvPrescripciones(text, medicamentos);
            if (errores.length > 0 && prescripciones.length === 0) {
                mostrarFeedback('error', errores[0]);
                return;
            }
            setUploadProgress(1); // Inicia
            const nuevosDespachos = generarHojaRuta(prescripciones, pacientes, 1);
            await addDespachos(nuevosDespachos, (p) => setUploadProgress(p));
            mostrarFeedback('ok',
                `✅ ${nuevosDespachos.length} entregas generadas desde ${prescripciones.length} prescripciones.` +
                (errores.length > 0 ? ` (${errores.length} advertencias)` : '')
            );
            setUploadProgress(0);
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
            setUploadProgress(1);
            const nuevos = generarHojaRutaDesdePacientes(pacientes, 1);
            await addDespachos(nuevos, (p) => setUploadProgress(p));
            mostrarFeedback('ok', `✅ ${nuevos.length} entregas generadas desde ${pacientes.filter(p => p.estado.startsWith('AC')).length} pacientes activos.`);
            setUploadProgress(0);
            onRefresh?.();
        } catch {
            setUploadProgress(0);
            mostrarFeedback('error', 'Error al generar la hoja de ruta.');
        } finally {
            setLoading(false);
        }
    };

    // ── Confirmar despacho ────────────────────────────────────────────────────
    // Confirmación simple para agendar
    const confirmarAgendamiento = async (despacho: Despacho) => {
        setActionModal({ type: 'Agendar', despacho });
        setActionValue('');
        setActionDate(new Date().toISOString().split('T')[0]);
    };

    const ejecutarAccion = async () => {
        if (!actionModal) return;
        if (!actionValue && (actionModal.type === 'Cancelar' || actionModal.type === 'Posponer')) {
            mostrarFeedback('error', 'Por favor completa la información requerida.');
            return;
        }

        setActionLoading(true);
        try {
            const { type, despacho } = actionModal;
            if (!despacho.firestoreId) throw new Error('No FS ID');

            if (type === 'Posponer') {
                await actualizarEstadoDespacho(despacho.firestoreId, 'Pospuesto', actionValue, actionDate);
            } else if (type === 'Cancelar') {
                await actualizarEstadoDespacho(despacho.firestoreId, 'Cancelado', actionValue);
            } else if (type === 'Agendar') {
                await actualizarEstadoDespacho(despacho.firestoreId, 'Agendado', actionValue, actionDate);
            } else if (type === 'Entregar') {
                await confirmarDespachoFS(despacho.firestoreId, actionValue, actionDate);
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
        setUploadProgress(1);
        try {
            await eliminarTodosLosDespachos((p) => setUploadProgress(p));
            mostrarFeedback('info', 'Todos los despachos han sido eliminados.');
            setUploadProgress(0);
            onRefresh?.();
        } catch {
            setUploadProgress(0);
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
                    onConfirm={async (id, obs, fecha) => {
                        const d = despachos.find(x => x.id === id);
                        if (d?.firestoreId) {
                            try {
                                await confirmarDespachoFS(d.firestoreId, obs, fecha);
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

            {/* Modal de Observaciones removido en favor de actionModal unificado */}

            {/* ═══ KPI Cards ═════════════════════════════════════════════════ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
                <KpiCard icon={<BarChart2 size={20} />} label="Total Programadas" value={stats.total} color="#6366f1" />
                <KpiCard icon={<CheckCircle2 size={20} />} label="Entregas Efectivas" value={stats.entregados}
                    sub={`de ${stats.total} programadas`} color="#16a34a" />
                <KpiCard icon={<Clock size={20} />} label="Pendientes" value={despachos.filter(d => (d.estadoActual || 'Pendiente') === 'Pendiente' && !esEntregaVencida(d)).length} color="#2563eb" />
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

                {uploadProgress > 0 && (
                    <div style={{ flex: '1 0 100%', maxWidth: 400, marginTop: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1' }}>PROCESANDO ENTREGAS...</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1' }}>{uploadProgress}%</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: '#f3f4f6', borderRadius: 10, overflow: 'hidden' }}>
                            <div style={{
                                width: `${uploadProgress}%`, height: '100%',
                                background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                                transition: 'width 0.3s ease-out'
                            }} />
                        </div>
                    </div>
                )}

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
                        <option value="agendados">Agendados</option>
                        <option value="entregados">Entregados</option>
                        <option value="urgentes">Urgentes (7 días)</option>
                        <option value="vencidos">Vencidos</option>
                        <option value="cancelados">Cancelados</option>
                        <option value="pospuestos">Pospuestos</option>
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
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--gray-100)' }}>
                                        {([
                                            { key: 'nota', label: 'Nota / Fecha' },
                                            { key: 'paciente', label: 'Paciente / ID' },
                                            { key: 'medicamento', label: 'Producto / ATC' },
                                            { key: 'eps', label: 'Entidad / Ciudad' },
                                            { key: 'ciclo', label: 'Ciclo / Duración' },
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
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', marginBottom: 2 }}>
                                                            {d.numeroNota ? (
                                                                <span style={{ fontSize: 10, background: '#e0e7ff', color: '#4338ca', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                                                    #{d.numeroNota}
                                                                </span>
                                                            ) : (
                                                                <span style={{ fontSize: 9, color: 'var(--gray-400)', fontStyle: 'italic' }}>Sin Nota</span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
                                                            <Calendar size={13} style={{ color: 'var(--gray-400)' }} />
                                                            <div style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: 13 }}>{d.fechaProgramada}</div>
                                                        </div>
                                                        <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{formatFechaEntrega(d.fechaProgramada)}</div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '11px 14px', textAlign: 'left' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'flex-start' }}>
                                                        <User size={14} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                                                        <div style={{ textAlign: 'left' }}>
                                                            <div style={{ fontWeight: 600, color: 'var(--gray-800)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                                {d.nombreCompleto}
                                                                {d.genero && (
                                                                    <span style={{ fontSize: 9, background: '#f3f4f6', color: '#6b7280', padding: '1px 4px', borderRadius: 3 }}>{d.genero}</span>
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: 11, color: 'var(--gray-400)', display: 'flex', gap: 8 }}>
                                                                <span>ID: {d.pacienteId}</span>
                                                                {d.telefonos && <span style={{ color: '#059669' }}>Tel: {d.telefonos}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '11px 14px', textAlign: 'left' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'flex-start' }}>
                                                        <Pill size={14} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                                                        <div style={{ textAlign: 'left' }}>
                                                            <div style={{ fontWeight: 600, color: 'var(--gray-800)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.medicamento}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--gray-400)', display: 'flex', gap: 8, alignItems: 'center' }}>
                                                                <span>{d.dosis}</span>
                                                                {d.atc && (
                                                                    <span style={{ fontSize: 9, color: 'var(--gray-500)', background: 'var(--gray-100)', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>{d.atc}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '11px 14px', textAlign: 'left' }}>
                                                    <div style={{ textAlign: 'left' }}>
                                                        <div style={{ fontWeight: 600, color: '#4f46e5', fontSize: 12 }}>{d.entidadAseguradora || d.eps || '—'}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--gray-400)', justifyContent: 'flex-start' }}>
                                                            <MapPin size={11} />{d.ciudadResidencia || d.municipio}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                                                    <div style={{ display: 'inline-block', textAlign: 'center' }}>
                                                        <div style={{ fontWeight: 700, fontSize: 11, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 20 }}>
                                                            {d.ciclo}
                                                        </div>
                                                        <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 2 }}>
                                                            Duración: {d.duracionTratamiento || 'Indef.'}
                                                        </div>
                                                    </div>
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
                                                    {(() => {
                                                        const estado = d.estadoActual || (d.confirmado ? 'Entregado' : 'Pendiente');
                                                        if (estado === 'Pendiente') {
                                                            return (
                                                                <button
                                                                    onClick={() => {
                                                                        setActionModal({ type: 'Agendar', despacho: d });
                                                                        setActionDate(new Date().toISOString().split('T')[0]);
                                                                        setActionValue('');
                                                                    }}
                                                                    style={{
                                                                        padding: '6px 12px', borderRadius: 8, border: 'none',
                                                                        background: '#0369a1', color: 'white', cursor: 'pointer',
                                                                        fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
                                                                    }}
                                                                >
                                                                    Agendar
                                                                </button>
                                                            );
                                                        }
                                                        if (estado === 'Agendado' || estado === 'Pospuesto') {
                                                            return (
                                                                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                                    <button
                                                                        onClick={() => {
                                                                            setActionModal({ type: 'Entregar', despacho: d });
                                                                            setActionDate(new Date().toISOString().split('T')[0]);
                                                                            setActionValue('');
                                                                        }}
                                                                        style={{
                                                                            padding: '6px 10px', borderRadius: 8, border: 'none',
                                                                            background: '#16a34a', color: 'white', cursor: 'pointer',
                                                                            fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
                                                                        }}
                                                                    >
                                                                        Entregar
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setActionModal({ type: 'Posponer', despacho: d });
                                                                            setActionDate(d.fechaProgramada);
                                                                            setActionValue('');
                                                                        }}
                                                                        style={{
                                                                            padding: '6px 10px', borderRadius: 8, border: '1px solid #2563eb',
                                                                            background: 'transparent', color: '#2563eb', cursor: 'pointer',
                                                                            fontSize: 11, fontWeight: 700,
                                                                        }}
                                                                    >
                                                                        Posponer
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setActionModal({ type: 'Cancelar', despacho: d });
                                                                            setActionValue('');
                                                                        }}
                                                                        style={{
                                                                            padding: '6px 10px', borderRadius: 8, border: '1px solid #dc2626',
                                                                            background: 'transparent', color: '#dc2626', cursor: 'pointer',
                                                                            fontSize: 11, fontWeight: 700,
                                                                        }}
                                                                    >
                                                                        Cancelar
                                                                    </button>
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                                                <span style={{
                                                                    fontSize: 12,
                                                                    color: estado === 'Cancelado' ? '#dc2626' : '#16a34a',
                                                                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4
                                                                }}>
                                                                    {estado === 'Cancelado' ? '✕ Cancelado' : '✓ Entregado'}
                                                                </span>
                                                                {d.motivo && <span style={{ fontSize: 10, color: 'var(--gray-500)', fontStyle: 'italic' }}>{d.motivo}</span>}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                        </div>

                        {/* Controles de Paginación */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            gap: 16, padding: '16px 32px', borderTop: '1px solid var(--gray-100)',
                            background: '#f8fafc', flexWrap: 'wrap',
                        }}>
                            <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 500 }}>
                                Total: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{despachosFiltrados.length}</span> registros encontrados
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                                        borderRadius: 12, border: '1.5px solid var(--gray-200)',
                                        background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                        fontSize: 13, fontWeight: 600, color: 'var(--gray-700)',
                                        opacity: currentPage === 1 ? 0.6 : 1,
                                    }}>
                                    <ChevronLeft size={16} /> Anterior
                                </button>

                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', minWidth: 100, textAlign: 'center' }}>
                                    Página {currentPage} de {Math.max(1, totalPages)}
                                </span>

                                <button
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                                        borderRadius: 12, border: '1.5px solid var(--gray-200)',
                                        background: 'white', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                                        fontSize: 13, fontWeight: 600, color: 'var(--gray-700)',
                                        opacity: currentPage >= totalPages ? 0.6 : 1,
                                    }}>
                                    Siguiente <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        {despachosFiltrados.length === 0 && (
                            <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 14 }}>
                                <AlertTriangle size={40} style={{ marginBottom: 16, opacity: 0.5 }} />
                                <div>No hay entregas que coincidan con los filtros aplicados en este periodo.</div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ═══ Modal de Acciones (Cancelar/Posponer/Suspender) ═══ */}
            {actionModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '120px 16px',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'white', borderRadius: 24, padding: 32, width: '100%',
                        maxWidth: 440, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        position: 'relative', animation: 'modalSlideUp 0.3s ease-out'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>
                                {actionModal.type} Entrega
                            </h3>
                            <button onClick={() => setActionModal(null)} style={{ background: '#f3f4f6', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 8, borderRadius: '50%', display: 'flex' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 24, lineHeight: 1.6 }}>
                            {actionModal.type === 'Agendar' && 'Confirma que vas a agendar esta entrega para su seguimiento y gestión logística.'}
                            {actionModal.type === 'Entregar' && 'Registra que el medicamento ha sido entregado satisfactoriamente al paciente.'}
                            {actionModal.type === 'Cancelar' && 'Por favor, selecciona el motivo principal para cancelar esta entrega programada.'}
                            {actionModal.type === 'Posponer' && 'Selecciona el motivo y la nueva fecha propuesta para realizar esta entrega.'}
                        </p>

                        <div style={{ marginBottom: 24 }}>
                            {(actionModal.type === 'Agendar' || actionModal.type === 'Posponer' || actionModal.type === 'Entregar') && (
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.05 }}>
                                        Fecha de {actionModal.type === 'Entregar' ? 'Entrega' : actionModal.type === 'Agendar' ? 'Agendamiento' : 'Reprogramación'}
                                    </label>
                                    <input
                                        type="date"
                                        value={actionDate}
                                        onChange={(e) => setActionDate(e.target.value)}
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e7eb', outline: 'none', fontSize: 14 }}
                                    />
                                </div>
                            )}

                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.05 }}>
                                {actionModal.type === 'Entregar' || actionModal.type === 'Agendar' ? 'Notas / Observaciones' : 'Motivo Requerido'}
                            </label>

                            {actionModal.type === 'Cancelar' || actionModal.type === 'Posponer' ? (
                                <select
                                    value={actionValue}
                                    onChange={e => setActionValue(e.target.value)}
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e7eb', outline: 'none', fontSize: 14, background: '#fff' }}
                                >
                                    <option value="">Seleccione una opción...</option>
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
                            ) : (
                                <textarea
                                    placeholder="Puedes añadir notas adicionales aquí..."
                                    value={actionValue}
                                    onChange={e => setActionValue(e.target.value)}
                                    style={{ width: '100%', minHeight: 80, padding: '14px', borderRadius: 12, border: '1.5px solid #e5e7eb', outline: 'none', fontSize: 14, resize: 'none', fontFamily: 'inherit' }}
                                />
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setActionModal(null)}
                                style={{ padding: '12px 24px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', color: '#4b5563', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={ejecutarAccion}
                                disabled={actionLoading}
                                style={{
                                    padding: '12px 28px', borderRadius: 12, border: 'none',
                                    background: actionModal.type === 'Cancelar' ? '#dc2626' : actionModal.type === 'Agendar' ? '#0369a1' : '#16a34a',
                                    color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                    opacity: actionLoading ? 0.7 : 1, transition: 'all 0.2s'
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
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12, color: 'var(--gray-500)', marginTop: 10 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: '#dcfce7', display: 'inline-block' }} />Entregado
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: '#e0f2fe', display: 'inline-block' }} />Agendado
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: '#eff6ff', display: 'inline-block' }} />Pendiente
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: '#fef3c7', display: 'inline-block' }} />Urgente (≤7 días) / Pospuesto
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: '#fee2e2', display: 'inline-block' }} />Vencido / Cancelado
                    </span>
                </div>
            )}
        </div>
    );
}
