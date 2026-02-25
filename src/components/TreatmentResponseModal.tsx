import React, { useState } from 'react';
import { ClipboardList, X, Star, Activity, AlertCircle } from 'lucide-react';
import type { Despacho, TreatmentResponse } from '../data/despachoTypes';

interface TreatmentResponseModalProps {
    despacho: Despacho;
    userEmail: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (respuesta: TreatmentResponse) => Promise<void>;
}

export default function TreatmentResponseModal({ despacho, userEmail, isOpen, onClose, onSave }: TreatmentResponseModalProps) {
    const [form, setForm] = useState<Partial<TreatmentResponse>>({
        tolerancia: 'Buena',
        mejoraClinica: 'Si',
        efectosAdversos: '',
        observaciones: ''
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setLoading(true);
        const respuesta: TreatmentResponse = {
            ...form as any,
            fechaRegistro: new Date().toISOString(),
            registradoPor: userEmail || 'Sistema'
        };
        await onSave(respuesta);
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
                background: 'white', borderRadius: 24, width: '100%', maxWidth: 550,
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
            }}>
                <div style={{
                    padding: '24px 30px',
                    background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Respuesta al Tratamiento</h3>
                        <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.9 }}>Registro de control clínico post-entrega</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: 30 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Tolerancia</label>
                            <select
                                value={form.tolerancia}
                                onChange={(e) => setForm({ ...form, tolerancia: e.target.value as any })}
                                style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                            >
                                <option value="Buena">Buena</option>
                                <option value="Regular">Regular</option>
                                <option value="Mala">Mala</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Mejora Clínica</label>
                            <select
                                value={form.mejoraClinica}
                                onChange={(e) => setForm({ ...form, mejoraClinica: e.target.value as any })}
                                style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                            >
                                <option value="Si">Sí</option>
                                <option value="No">No</option>
                                <option value="Parcial">Parcial</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Efectos Adversos</label>
                        <textarea
                            value={form.efectosAdversos}
                            onChange={(e) => setForm({ ...form, efectosAdversos: e.target.value })}
                            placeholder="Describa efectos reportados por el paciente..."
                            style={{ width: '100%', minHeight: 80, padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, resize: 'none', outline: 'none' }}
                        />
                    </div>

                    <div style={{ marginBottom: 30 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Observaciones Adicionales</label>
                        <textarea
                            value={form.observaciones}
                            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                            placeholder="Notas de la consulta de seguimiento..."
                            style={{ width: '100%', minHeight: 80, padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, resize: 'none', outline: 'none' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            onClick={onClose}
                            style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            style={{
                                flex: 2, padding: '14px', borderRadius: 14, border: 'none',
                                background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                                color: 'white', fontWeight: 800, cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Guardando...' : 'Registrar Respuesta'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
