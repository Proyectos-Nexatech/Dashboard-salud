import React, { useState } from 'react';
import { Calendar, X, Clock, CheckCircle2 } from 'lucide-react';
import type { Despacho } from '../data/despachoTypes';

interface FollowUpSchedulingModalProps {
    despacho: Despacho;
    isOpen: boolean;
    onClose: () => void;
    onSave: (fecha: string) => Promise<void>;
}

export default function FollowUpSchedulingModal({ despacho, isOpen, onClose, onSave }: FollowUpSchedulingModalProps) {
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!fecha) return;
        setLoading(true);
        await onSave(fecha);
        setLoading(false);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
            backdropFilter: 'blur(4px)', padding: 20
        }}>
            <div style={{
                background: 'white', borderRadius: 24, width: '100%', maxWidth: 450,
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
            }}>
                <div style={{
                    padding: '24px 30px',
                    background: 'linear-gradient(135deg, #0369a1, #075985)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Cita de Seguimiento</h3>
                        <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.9 }}>Control de respuesta al tratamiento</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: 30 }}>
                    <div style={{
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 24,
                        display: 'flex',
                        gap: 16,
                        alignItems: 'center'
                    }}>
                        <div style={{ background: 'white', padding: 10, borderRadius: 12, color: '#0369a1' }}>
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>Entrega Confirmada</div>
                            <div style={{ fontSize: 14, color: '#0c4a6e', fontWeight: 600 }}>{despacho.nombreCompleto}</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                            La entrega del Ciclo para <strong>{despacho.medicamento}</strong> ha sido exitosa.
                            ¿Desea agendar la cita de seguimiento para evaluar la respuesta clínica?
                        </p>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Fecha de Seguimiento Sugerida</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 14px 12px 42px',
                                    borderRadius: 12,
                                    border: '1.5px solid #e2e8f0',
                                    fontSize: 14,
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '14px',
                                borderRadius: 14,
                                border: '1.5px solid #e2e8f0',
                                background: 'white',
                                color: '#64748b',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontSize: 14
                            }}
                        >
                            Omitir
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            style={{
                                flex: 2,
                                padding: '14px',
                                borderRadius: 14,
                                border: 'none',
                                background: 'linear-gradient(135deg, #0369a1, #075985)',
                                color: 'white',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(3, 105, 161, 0.25)',
                                fontSize: 14,
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Agendando...' : 'Agendar Seguimiento'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
