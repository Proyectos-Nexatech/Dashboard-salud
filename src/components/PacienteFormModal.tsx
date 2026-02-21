import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Paciente, EstadoCode } from '../data/mockData';
import { MEDICAMENTOS_CATALOGO, ESTADOS_LABELS } from '../data/mockData';

interface PacienteFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (paciente: Paciente, originalId?: string) => void;
    paciente?: Paciente | null;
    epsList: string[];
}

const initialPaciente: Omit<Paciente, 'id'> = {
    nombre1: '', nombre2: '', apellido1: '', apellido2: '',
    nombreCompleto: '', tipoId: 'CC', numeroId: '',
    eps: '', telefono: '', municipio: '', entidad: '',
    fechaNacimiento: '', edad: 0, sexo: undefined,
    estado: 'AC ONC' as EstadoCode,
    medicamento: '', presentacionComercial: '', dosisEstandar: '',
    diasAdministracion: 30, diasDescanso: 0, entregas: {}
};

export default function PacienteFormModal({ isOpen, onClose, onSave, paciente, epsList }: PacienteFormModalProps) {
    const [form, setForm] = useState<any>({ ...initialPaciente, id: Date.now() });
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);

    const isEdit = !!paciente;

    useEffect(() => {
        if (isOpen) {
            if (paciente) {
                setForm({ ...paciente });
            } else {
                setForm({ ...initialPaciente, id: Date.now() });
            }
            setErrors({});
            setSaving(false);
        }
    }, [isOpen, paciente]);

    // Auto-compute nombreCompleto
    useEffect(() => {
        const parts = [form.nombre1, form.nombre2, form.apellido1, form.apellido2].filter(Boolean);
        const full = parts.join(' ').toUpperCase();
        if (full !== form.nombreCompleto) {
            setForm((prev: any) => ({ ...prev, nombreCompleto: full }));
        }
    }, [form.nombre1, form.nombre2, form.apellido1, form.apellido2]);

    // Auto-compute edad from fechaNacimiento
    useEffect(() => {
        if (form.fechaNacimiento) {
            const birth = new Date(form.fechaNacimiento);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
            setForm((prev: any) => ({ ...prev, edad: Math.max(0, age) }));
        }
    }, [form.fechaNacimiento]);

    // Auto-fill dosis when medicamento changes
    useEffect(() => {
        if (form.medicamento) {
            const med = MEDICAMENTOS_CATALOGO.find(m => m.nombre === form.medicamento);
            if (med) {
                setForm((prev: any) => ({
                    ...prev,
                    dosisEstandar: med.dosisEstandar,
                    presentacionComercial: med.presentacion,
                    diasAdministracion: med.diasAdministracion,
                    diasDescanso: med.diasDescanso
                }));
            }
        }
    }, [form.medicamento]);

    const handleChange = (field: string, value: any) => {
        setForm((prev: any) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }));
    };

    const validate = () => {
        const newErrors: Record<string, boolean> = {};
        if (!form.nombre1?.trim()) newErrors.nombre1 = true;
        if (!form.apellido1?.trim()) newErrors.apellido1 = true;
        if (!form.numeroId?.trim()) newErrors.numeroId = true;
        if (!form.eps?.trim()) newErrors.eps = true;
        if (!form.medicamento?.trim()) newErrors.medicamento = true;
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const originalId = isEdit ? paciente?.numeroId : undefined;
            await onSave(form as Paciente, originalId);
            onClose();
        } catch (err) {
            console.error('Error guardando paciente:', err);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const fieldStyle = (field: string) => ({
        width: '100%',
        padding: '10px 14px',
        borderRadius: 10,
        border: `1.5px solid ${errors[field] ? '#ef4444' : 'var(--gray-200)'}`,
        fontSize: 14,
        background: errors[field] ? '#fef2f2' : 'white',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        fontFamily: 'inherit',
        boxSizing: 'border-box' as const,
    });

    const labelStyle = {
        fontSize: 12,
        fontWeight: 600 as const,
        color: 'var(--gray-500)',
        textTransform: 'uppercase' as const,
        marginBottom: 6,
        display: 'block' as const,
        letterSpacing: '0.3px'
    };

    const sectionTitle = {
        fontSize: 13,
        fontWeight: 700 as const,
        color: 'var(--primary)',
        textTransform: 'uppercase' as const,
        marginBottom: 16,
        marginTop: 8,
        letterSpacing: '0.5px',
        paddingBottom: 8,
        borderBottom: '2px solid var(--primary-light)'
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
            <div className="card fade-in" style={{
                width: 780, maxHeight: '92vh', overflowY: 'auto', padding: 0,
                position: 'relative', borderRadius: 24
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 28px', borderBottom: '1px solid var(--gray-100)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    position: 'sticky', top: 0, background: 'white', zIndex: 10, borderRadius: '24px 24px 0 0'
                }}>
                    <div>
                        <h3 className="card-title" style={{ margin: 0, fontSize: 18 }}>
                            {isEdit ? 'Editar Paciente' : 'Nuevo Paciente'}
                        </h3>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                            {isEdit ? 'Modifica los datos del paciente' : 'Completa los datos del nuevo paciente'}
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'var(--gray-100)', border: 'none', cursor: 'pointer',
                        color: 'var(--gray-500)', padding: 8, borderRadius: 10,
                        display: 'flex', alignItems: 'center'
                    }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px 28px' }}>
                    {/* Section: Información Personal */}
                    <div style={sectionTitle}>Información Personal</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                        <div>
                            <label style={labelStyle}>Primer Nombre *</label>
                            <input type="text" style={fieldStyle('nombre1')} value={form.nombre1 || ''} onChange={e => handleChange('nombre1', e.target.value.toUpperCase())} placeholder="Ej: CARLOS" />
                        </div>
                        <div>
                            <label style={labelStyle}>Segundo Nombre</label>
                            <input type="text" style={fieldStyle('nombre2')} value={form.nombre2 || ''} onChange={e => handleChange('nombre2', e.target.value.toUpperCase())} placeholder="Ej: ANDRÉS" />
                        </div>
                        <div>
                            <label style={labelStyle}>Primer Apellido *</label>
                            <input type="text" style={fieldStyle('apellido1')} value={form.apellido1 || ''} onChange={e => handleChange('apellido1', e.target.value.toUpperCase())} placeholder="Ej: MARTINEZ" />
                        </div>
                        <div>
                            <label style={labelStyle}>Segundo Apellido</label>
                            <input type="text" style={fieldStyle('apellido2')} value={form.apellido2 || ''} onChange={e => handleChange('apellido2', e.target.value.toUpperCase())} placeholder="Ej: LOPEZ" />
                        </div>
                        <div>
                            <label style={labelStyle}>Tipo de ID</label>
                            <select style={fieldStyle('tipoId')} value={form.tipoId || 'CC'} onChange={e => handleChange('tipoId', e.target.value)}>
                                <option value="CC">C.C. - Cédula de Ciudadanía</option>
                                <option value="TI">T.I. - Tarjeta de Identidad</option>
                                <option value="CE">C.E. - Cédula de Extranjería</option>
                                <option value="PA">Pasaporte</option>
                                <option value="RC">R.C. - Registro Civil</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Número de Identificación *</label>
                            <input type="text" style={fieldStyle('numeroId')} value={form.numeroId || ''} onChange={e => handleChange('numeroId', e.target.value)} placeholder="Ej: 1234567890" />
                        </div>
                        <div>
                            <label style={labelStyle}>Fecha de Nacimiento</label>
                            <input type="date" style={fieldStyle('fechaNacimiento')} value={form.fechaNacimiento || ''} onChange={e => handleChange('fechaNacimiento', e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>Edad (auto-calculada)</label>
                            <input type="number" style={{ ...fieldStyle('edad'), background: 'var(--gray-50)', cursor: 'not-allowed' }} value={form.edad || 0} readOnly />
                        </div>
                        <div>
                            <label style={labelStyle}>Sexo</label>
                            <select style={fieldStyle('sexo')} value={form.sexo || ''} onChange={e => handleChange('sexo', e.target.value)}>
                                <option value="">Seleccionar...</option>
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Teléfono</label>
                            <input type="tel" style={fieldStyle('telefono')} value={form.telefono || ''} onChange={e => handleChange('telefono', e.target.value)} placeholder="Ej: 3001234567" />
                        </div>
                        <div>
                            <label style={labelStyle}>Municipio</label>
                            <input type="text" style={fieldStyle('municipio')} value={form.municipio || ''} onChange={e => handleChange('municipio', e.target.value.toUpperCase())} placeholder="Ej: CARTAGENA" />
                        </div>
                    </div>

                    {/* Section: Afiliación */}
                    <div style={sectionTitle}>Afiliación</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                        <div>
                            <label style={labelStyle}>EPS *</label>
                            <select style={fieldStyle('eps')} value={form.eps || ''} onChange={e => handleChange('eps', e.target.value)}>
                                <option value="">Seleccionar EPS...</option>
                                {epsList.map(eps => (
                                    <option key={eps} value={eps}>{eps}</option>
                                ))}
                                <option value="OTRO">OTRO</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Entidad</label>
                            <input type="text" style={fieldStyle('entidad')} value={form.entidad || ''} onChange={e => handleChange('entidad', e.target.value)} placeholder="Ej: ENTIDAD DE SALUD" />
                        </div>
                    </div>

                    {/* Section: Tratamiento */}
                    <div style={sectionTitle}>Tratamiento</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={labelStyle}>Medicamento *</label>
                            <select style={fieldStyle('medicamento')} value={form.medicamento || ''} onChange={e => handleChange('medicamento', e.target.value)}>
                                <option value="">Seleccionar medicamento...</option>
                                {MEDICAMENTOS_CATALOGO.map(m => (
                                    <option key={m.nombre} value={m.nombre}>{m.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Dosis Estándar</label>
                            <input type="text" style={{ ...fieldStyle('dosisEstandar'), background: 'var(--gray-50)' }} value={form.dosisEstandar || ''} readOnly />
                        </div>
                        <div>
                            <label style={labelStyle}>Estado</label>
                            <select style={fieldStyle('estado')} value={form.estado || ''} onChange={e => handleChange('estado', e.target.value)}>
                                {Object.entries(ESTADOS_LABELS).map(([code, { label }]) => (
                                    <option key={code} value={code}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Días Administración</label>
                            <input type="number" style={{ ...fieldStyle('diasAdministracion'), background: 'var(--gray-50)' }} value={form.diasAdministracion || 0} readOnly />
                        </div>
                        <div>
                            <label style={labelStyle}>Días Descanso</label>
                            <input type="number" style={{ ...fieldStyle('diasDescanso'), background: 'var(--gray-50)' }} value={form.diasDescanso || 0} readOnly />
                        </div>
                    </div>

                    {/* Error summary */}
                    {Object.keys(errors).length > 0 && (
                        <div style={{
                            marginTop: 16, padding: '12px 16px', background: '#fef2f2',
                            border: '1px solid #fecaca', borderRadius: 12, fontSize: 13, color: '#dc2626'
                        }}>
                            ⚠️ Por favor completa los campos obligatorios marcados con *
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 28px', background: 'var(--gray-50)',
                    borderTop: '1px solid var(--gray-100)', display: 'flex',
                    justifyContent: 'flex-end', gap: 12,
                    borderBottomLeftRadius: 24, borderBottomRightRadius: 24
                }}>
                    <button onClick={onClose} style={{
                        padding: '10px 24px', background: 'white',
                        border: '1px solid var(--gray-300)', borderRadius: 12,
                        cursor: 'pointer', fontWeight: 600, fontSize: 14
                    }}>
                        Cancelar
                    </button>
                    <button onClick={handleSubmit} disabled={saving} className="btn-primary" style={{
                        padding: '10px 28px', borderRadius: 12,
                        fontWeight: 600, fontSize: 14,
                        opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer'
                    }}>
                        {saving ? 'Guardando...' : (isEdit ? 'Guardar Cambios' : 'Crear Paciente')}
                    </button>
                </div>
            </div>
        </div>
    );
}
