import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { MedicamentoInfo } from '../data/medicamentosData';

interface MedicamentoFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (m: MedicamentoInfo, originalName?: string) => Promise<void>;
    medicamento?: MedicamentoInfo | null;
}

const INITIAL_FORM: MedicamentoInfo = {
    medicamento: '',
    atc: '',
    presentacionComercial: 0,
    dosisEstandar: '',
    diasAdministracion: 0,
    diasDescanso: 0,
    total: 0,
    frecuenciaEntrega: 0
};

export default function MedicamentoFormModal({ isOpen, onClose, onSave, medicamento }: MedicamentoFormModalProps) {
    const [form, setForm] = useState<MedicamentoInfo>(INITIAL_FORM);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (medicamento) {
            setForm({ ...medicamento });
        } else {
            setForm(INITIAL_FORM);
        }
        setErrors({});
    }, [medicamento, isOpen]);

    // Auto-compute total
    useEffect(() => {
        const total = (Number(form.diasAdministracion) || 0) + (Number(form.diasDescanso) || 0);
        if (total !== form.total) {
            setForm(prev => ({ ...prev, total }));
        }
    }, [form.diasAdministracion, form.diasDescanso]);

    if (!isOpen) return null;

    const handleChange = (field: keyof MedicamentoInfo, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }));
    };

    const validate = () => {
        const newErrors: Record<string, boolean> = {};
        if (!form.medicamento?.trim()) newErrors.medicamento = true;
        if (!form.atc?.trim()) newErrors.atc = true;
        if (!form.dosisEstandar?.trim()) newErrors.dosisEstandar = true;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSaving(true);
        try {
            await onSave(form, medicamento?.medicamento);
            onClose();
        } catch (err) {
            console.error('Error saving medicamento:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            zIndex: 1100, backdropFilter: 'blur(4px)', paddingTop: '60px'
        }}>
            <div className="card fade-in" style={{ width: 750, padding: 0, borderRadius: 24, overflow: 'hidden', height: 'auto' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white' }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>
                        {medicamento ? 'Editar Medicamento' : 'Nuevo Medicamento'}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', padding: 4 }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '80vh', overflowY: 'auto' }}>

                        {/* Nombre y ATC */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 8 }}>
                                    Nombre del Medicamento *
                                </label>
                                <input
                                    type="text"
                                    className="header-search"
                                    style={{ width: '100%', borderColor: errors.medicamento ? '#ef4444' : undefined }}
                                    value={form.medicamento}
                                    onChange={e => handleChange('medicamento', e.target.value.toUpperCase())}
                                    placeholder="Ej: ABEMACILIB X 150 MG"
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 8 }}>
                                    Código ATC *
                                </label>
                                <input
                                    type="text"
                                    className="header-search"
                                    style={{ width: '100%', borderColor: errors.atc ? '#ef4444' : undefined }}
                                    value={form.atc}
                                    onChange={e => handleChange('atc', e.target.value.toUpperCase())}
                                    placeholder="Ej: L01EF03"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 8 }}>
                                    Presentación Comercial (Cant.)
                                </label>
                                <input
                                    type="number"
                                    className="header-search"
                                    style={{ width: '100%' }}
                                    value={form.presentacionComercial}
                                    onChange={e => handleChange('presentacionComercial', Number(e.target.value))}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 8 }}>
                                    Dosis Estándar *
                                </label>
                                <input
                                    type="text"
                                    className="header-search"
                                    style={{ width: '100%', borderColor: errors.dosisEstandar ? '#ef4444' : undefined }}
                                    value={form.dosisEstandar}
                                    onChange={e => handleChange('dosisEstandar', e.target.value)}
                                    placeholder="Ej: 300 MG X 30 DIAS"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 8 }}>
                                    Días Administracion
                                </label>
                                <input
                                    type="number"
                                    className="header-search"
                                    style={{ width: '100%' }}
                                    value={form.diasAdministracion}
                                    onChange={e => handleChange('diasAdministracion', Number(e.target.value))}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 8 }}>
                                    Días Descanso
                                </label>
                                <input
                                    type="number"
                                    className="header-search"
                                    style={{ width: '100%' }}
                                    value={form.diasDescanso}
                                    onChange={e => handleChange('diasDescanso', Number(e.target.value))}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 8 }}>
                                    Total (Días)
                                </label>
                                <input
                                    type="number"
                                    className="header-search"
                                    style={{ width: '100%', background: 'var(--gray-50)', cursor: 'not-allowed' }}
                                    value={form.total}
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 8 }}>
                                Frecuencia de Entrega (Días)
                            </label>
                            <input
                                type="number"
                                className="header-search"
                                style={{ width: '100%' }}
                                value={form.frecuenciaEntrega}
                                onChange={e => handleChange('frecuenciaEntrega', Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div style={{ padding: '20px 32px', background: 'var(--gray-50)', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ padding: '10px 24px', background: 'white', border: '1px solid var(--gray-300)', borderRadius: 12, cursor: 'pointer', fontWeight: 600, color: 'var(--gray-600)' }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            style={{
                                padding: '10px 24px',
                                background: '#16a34a',
                                color: 'white',
                                border: 'none',
                                borderRadius: 12,
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                opacity: isSaving ? 0.7 : 1
                            }}
                        >
                            {isSaving ? 'Guardando...' : (medicamento ? 'Actualizar' : 'Crear Medicamento')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
