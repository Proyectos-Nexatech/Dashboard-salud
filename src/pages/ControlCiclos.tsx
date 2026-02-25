import React, { useMemo, useState } from 'react';
import {
    ClipboardList, Search, Filter, ChevronDown, CheckCircle2,
    Clock, AlertTriangle, User, Pill, Activity, Stethoscope,
    Calendar, ArrowRight, MessageSquare, ExternalLink
} from 'lucide-react';
import { useDespachos } from '../context/DespachoContext';
import type { Despacho } from '../data/despachoTypes';
import EstadoBadge from '../components/EstadoBadge';
import TreatmentResponseModal from '../components/TreatmentResponseModal';
import { registrarRespuestaTratamiento } from '../services/despachoService';
import { useAuth } from '../context/AuthContext';

export default function ControlCiclos() {
    const { user } = useAuth();
    const { despachos } = useDespachos();
    const [busqueda, setBusqueda] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [responseModal, setResponseModal] = useState<{ isOpen: boolean; despacho: Despacho | null }>({
        isOpen: false,
        despacho: null
    });

    // Filtrar despachos que tienen seguimiento o son cargas manuales
    const despachosCiclo = useMemo(() => {
        return despachos.filter(d =>
            (d.confirmado || d.estadoActual?.includes('Entregado')) &&
            (d.seguimientoEstado === 'Programado' || d.seguimientoEstado === 'Completado' || d.esCargaManual)
        ).sort((a, b) => new Date(b.ultimaModificacion || '').getTime() - new Date(a.ultimaModificacion || '').getTime());
    }, [despachos]);

    const filteredDespachos = useMemo(() => {
        if (!busqueda) return despachosCiclo;
        const b = busqueda.toLowerCase();
        return despachosCiclo.filter(d =>
            d.nombreCompleto.toLowerCase().includes(b) ||
            d.pacienteId.includes(b) ||
            d.medicamento.toLowerCase().includes(b)
        );
    }, [despachosCiclo, busqueda]);

    const stats = useMemo(() => {
        const total = despachosCiclo.length;
        const completados = despachosCiclo.filter(d => d.seguimientoEstado === 'Completado').length;
        const pendientes = despachosCiclo.filter(d => d.seguimientoEstado === 'Programado').length;
        return { total, completados, pendientes };
    }, [despachosCiclo]);

    return (
        <div className="page-container fade-in" style={{ padding: '0 24px 40px' }}>
            <div style={{ marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--gray-900)', margin: 0, letterSpacing: '-0.02em' }}>
                        Control de Ciclos y Respuesta
                    </h1>
                    <p style={{ fontSize: 15, color: 'var(--gray-500)', marginTop: 4 }}>
                        Trazabilidad clínica post-entrega y evaluación de efectividad terapéutica.
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 30 }}>
                <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid var(--gray-100)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ color: '#4f46e5', marginBottom: 12 }}><Activity size={24} /></div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.total}</div>
                    <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Ciclos en Seguimiento</div>
                </div>
                <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid var(--gray-100)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ color: '#10b981', marginBottom: 12 }}><CheckCircle2 size={24} /></div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.completados}</div>
                    <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Evaluaciones Completadas</div>
                </div>
                <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid var(--gray-100)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ color: '#f59e0b', marginBottom: 12 }}><Clock size={24} /></div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.pendientes}</div>
                    <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Citas Programadas</div>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: 20, boxShadow: 'var(--shadow-md)', border: '1px solid var(--gray-100)', overflow: 'hidden' }}>
                <div style={{ padding: 20, borderBottom: '1px solid var(--gray-100)', display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por paciente, ID o medicamento..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: 12, border: '1.5px solid var(--gray-200)', fontSize: 14, outline: 'none' }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Paciente / Tratamiento</th>
                                <th style={{ padding: '14px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Entrega</th>
                                <th style={{ padding: '14px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Cita Seguimiento</th>
                                <th style={{ padding: '14px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Resultado / Respuesta</th>
                                <th style={{ padding: '14px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDespachos.map(d => (
                                <tr key={d.firestoreId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#1e293b' }}>{d.nombreCompleto}</div>
                                                <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Pill size={12} /> {d.medicamento} ({d.ciclo})
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <EstadoBadge despacho={d} />
                                            <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{d.fechaConfirmacion}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px', textAlign: 'center' }}>
                                        {d.seguimientoFechaProgramada ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{d.seguimientoFechaProgramada}</span>
                                                <span style={{ fontSize: 10, color: d.seguimientoEstado === 'Completado' ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                                                    {d.seguimientoEstado === 'Completado' ? 'EFECTUADA' : 'PROGRAMADA'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Sin fecha</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px', textAlign: 'center' }}>
                                        {d.seguimientoRespuesta ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                                                        background: d.seguimientoRespuesta.tolerancia === 'Buena' ? '#dcfce7' : d.seguimientoRespuesta.tolerancia === 'Regular' ? '#fef3c7' : '#fee2e2',
                                                        color: d.seguimientoRespuesta.tolerancia === 'Buena' ? '#15803d' : d.seguimientoRespuesta.tolerancia === 'Regular' ? '#92400e' : '#b91c1c'
                                                    }}>
                                                        TOL: {d.seguimientoRespuesta.tolerancia.toUpperCase()}
                                                    </span>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                                                        background: d.seguimientoRespuesta.mejoraClinica === 'Si' ? '#dcfce7' : '#f1f5f9',
                                                        color: d.seguimientoRespuesta.mejoraClinica === 'Si' ? '#15803d' : '#64748b'
                                                    }}>
                                                        MEJORA: {d.seguimientoRespuesta.mejoraClinica.toUpperCase()}
                                                    </span>
                                                </div>
                                                {d.seguimientoRespuesta.observaciones && (
                                                    <div style={{ fontSize: 10, color: '#64748b', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.seguimientoRespuesta.observaciones}>
                                                        "{d.seguimientoRespuesta.observaciones}"
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Esperando respuesta...</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px', textAlign: 'center' }}>
                                        {d.seguimientoEstado === 'Programado' ? (
                                            <button
                                                onClick={() => setResponseModal({ isOpen: true, despacho: d })}
                                                style={{
                                                    padding: '8px 16px', borderRadius: 10, border: 'none',
                                                    background: '#4f46e5', color: 'white', fontWeight: 700,
                                                    fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto'
                                                }}
                                            >
                                                <Stethoscope size={14} /> Evaluar Respuesta
                                            </button>
                                        ) : d.seguimientoEstado === 'Completado' ? (
                                            <button
                                                style={{
                                                    padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                                                    background: 'white', color: '#64748b', fontWeight: 700,
                                                    fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto'
                                                }}
                                            >
                                                <ClipboardList size={14} /> Ver Detalle
                                            </button>
                                        ) : (
                                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Pendiente Agendar</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {responseModal.isOpen && responseModal.despacho && (
                <TreatmentResponseModal
                    isOpen={responseModal.isOpen}
                    despacho={responseModal.despacho}
                    userEmail={user?.email || 'Sistema'}
                    onClose={() => setResponseModal({ isOpen: false, despacho: null })}
                    onSave={async (respuesta) => {
                        if (responseModal.despacho?.firestoreId) {
                            await registrarRespuestaTratamiento(responseModal.despacho.firestoreId, respuesta, user?.email || 'Sistema');
                        }
                    }}
                />
            )}
        </div>
    );
}
