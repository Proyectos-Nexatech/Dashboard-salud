import React, { useState } from 'react';
import { Phone, MessageSquare, X, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import type { Despacho } from '../data/despachoTypes';

interface RecallManagementModalProps {
    despacho: Despacho;
    isOpen: boolean;
    onClose: () => void;
    onSave: (action: Despacho['statusRecall'], observation: string) => Promise<void>;
}

export default function RecallManagementModal({ despacho, isOpen, onClose, onSave }: RecallManagementModalProps) {
    const [action, setAction] = useState<Despacho['statusRecall']>('Pendiente');
    const [observation, setObservation] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const suggestedScript = `Hola ${despacho.nombreCompleto}, le hablamos de Nexatech. Vemos que tiene pendiente su entrega de ${despacho.medicamento} programada para el ${despacho.fechaProgramada}. ¿Desea coordinar el despacho ahora?`;

    const handleSave = async () => {
        if (action === 'Pendiente') {
            alert('Por favor seleccione un resultado de la gestión.');
            return;
        }
        setLoading(true);
        await onSave(action, observation);
        setLoading(false);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
            backdropFilter: 'blur(4px)', padding: 20
        }}>
            <div style={{
                background: 'white', borderRadius: 20, width: '100%', maxWidth: 500,
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden'
            }}>
                <div style={{ padding: '24px 30px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e293b' }}>Rescate de Paciente</h3>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Gestión de recordatorio y seguimiento</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
                </div>

                <div style={{ padding: 30 }}>
                    {/* Suggested Script */}
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1d4ed8', fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                            <MessageSquare size={14} /> Script Sugerido
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: '#1e40af', lineHeight: 1.5, fontStyle: 'italic' }}>
                            "{suggestedScript}"
                        </p>
                    </div>

                    {/* Patient Phone */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Contacto del Paciente</label>
                        <a
                            href={`tel:${despacho.telefonos}`}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
                                background: '#10b981', color: 'white', borderRadius: 12, textDecoration: 'none',
                                fontWeight: 700, transition: 'transform 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <Phone size={20} /> Llamar a {despacho.telefonos}
                        </a>
                    </div>

                    {/* Result Dropdown */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Resultado de la Gestión</label>
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value as any)}
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                        >
                            <option value="Pendiente">Seleccionar resultado...</option>
                            <option value="Rescatado">Confirmó nueva fecha / Reprogramada</option>
                            <option value="Llamado">Se envió a domicilio</option>
                            <option value="Anulado">Anulado / No requiere</option>
                        </select>
                    </div>

                    {/* Observation */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Observación de la Llamada</label>
                        <textarea
                            value={observation}
                            onChange={(e) => setObservation(e.target.value)}
                            placeholder="Escribe aquí lo conversado con el paciente..."
                            style={{ width: '100%', minHeight: 80, padding: '14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, resize: 'none', outline: 'none' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            onClick={onClose}
                            style={{ flex: 1, padding: '14px', borderRadius: 12, border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading || action === 'Pendiente'}
                            style={{
                                flex: 2, padding: '14px', borderRadius: 12, border: 'none',
                                background: '#6366f1', color: 'white', fontWeight: 700, cursor: 'pointer',
                                opacity: (loading || action === 'Pendiente') ? 0.6 : 1
                            }}
                        >
                            {loading ? 'Guardando...' : 'Registrar Gestión'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
