import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { EntidadInfo } from '../services/epsService';

interface EntidadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (e: EntidadInfo, originalNombre?: string) => Promise<void>;
    entidad?: EntidadInfo | null;
}

const INITIAL_FORM: EntidadInfo = {
    nombre: '',
    tipo: 'EPS-S',
    nit: '',
    activo: true
};

export default function EntidadFormModal({ isOpen, onClose, onSave, entidad }: EntidadFormModalProps) {
    const [form, setForm] = useState<EntidadInfo>(INITIAL_FORM);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (entidad) {
            setForm({ ...entidad });
        } else {
            setForm(INITIAL_FORM);
        }
        setErrors({});
    }, [entidad, isOpen]);

    if (!isOpen) return null;

    const handleChange = (field: keyof EntidadInfo, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }));
    };

    const validate = () => {
        const newErrors: Record<string, boolean> = {};
        if (!form.nombre?.trim()) newErrors.nombre = true;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSaving(true);
        try {
            await onSave(form, entidad?.nombre);
            onClose();
        } catch (err) {
            console.error('Error saving entidad:', err);
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
                        {entidad ? 'Editar Entidad / EPS' : 'Nueva Entidad / EPS'}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', padding: 4 }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '80vh', overflowY: 'auto' }}>

                        {/* Nombre de la Entidad */}
                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 8 }}>
                                Nombre de la Entidad (EPS) *
                            </label>
                            <input
                                type="text"
                                className="header-search"
                                style={{ width: '100%', borderColor: errors.nombre ? '#ef4444' : undefined }}
                                value={form.nombre}
                                onChange={e => handleChange('nombre', e.target.value.toUpperCase())}
                                placeholder="Ej: SALUD TOTAL EPS"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 8 }}>
                                    Tipo de Entidad
                                </label>
                                <select
                                    className="header-search"
                                    style={{ width: '100%', appearance: 'auto' }}
                                    value={form.tipo}
                                    onChange={e => handleChange('tipo', e.target.value)}
                                >
                                    <option value="EPS-S">EPS-S (Subsidiado)</option>
                                    <option value="EPS-C">EPS-C (Contributivo)</option>
                                    <option value="Otro">Otro / Especial</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 8 }}>
                                    NIT (Opcional)
                                </label>
                                <input
                                    type="text"
                                    className="header-search"
                                    style={{ width: '100%' }}
                                    value={form.nit || ''}
                                    onChange={e => handleChange('nit', e.target.value)}
                                    placeholder="Ej: 900.123.456-1"
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                            <input
                                type="checkbox"
                                id="activo"
                                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--primary)' }}
                                checked={form.activo}
                                onChange={e => handleChange('activo', e.target.checked)}
                            />
                            <label htmlFor="activo" style={{ fontSize: 14, cursor: 'pointer', fontWeight: 500, color: 'var(--text-main)' }}>
                                Entidad Activa (aparecerá en los filtros y formularios)
                            </label>
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
                            {isSaving ? 'Guardando...' : (entidad ? 'Actualizar' : 'Crear Entidad')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
