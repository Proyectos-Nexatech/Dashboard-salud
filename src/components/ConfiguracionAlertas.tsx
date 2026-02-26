import { useState, useEffect } from 'react';
import { Settings2, Bell, X, Save, Clock, Mail, Info, Volume2, AlertTriangle, PhoneCall } from 'lucide-react';
import { subscribeToAlerts, saveAlert, seedDefaultAlerts, AlertConfig, DEFAULT_ALERTS } from '../services/alertService';
import { useAuth } from '../context/AuthContext';
import { subscribeToUsers } from '../services/userService';

const ICONS_MAP: Record<string, any> = {
    medicamento_vencer: Bell,
    entrega_proxima: Clock,
    sin_actividad_despacho: Volume2,
    riesgo_alto_detectado: AlertTriangle,
    stock_bajo_medicamento: Info,
    ciclo_proximo_vencer: Clock,
    llamada_seguimiento: PhoneCall
};

const ALL_ROLES = ['Administrador', 'Coordinador', 'Farmacia', 'Auxiliar'];

export default function ConfiguracionAlertas() {
    const [alertas, setAlertas] = useState<AlertConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();

    // Almacenamos el rol del usuario actual
    const [userRole, setUserRole] = useState<string>('Visualizador');

    const [editingAlert, setEditingAlert] = useState<AlertConfig | null>(null);
    const [formData, setFormData] = useState<AlertConfig | null>(null);

    const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'error', msg: string } | null>(null);

    // Hardcoded fallback for the primary admin email to ensure access during setup
    const isSuperAdminFallback = currentUser?.email?.toLowerCase() === 'proyectos@nexatech.com.co';

    useEffect(() => {
        // Inicializar alertas en BD si está vacía
        seedDefaultAlerts();

        const unsubAlerts = subscribeToAlerts((data) => {
            // Ordenamos por default según ID (u otro campo) si queremos consistencia
            const sorted = [...data].sort((a, b) => a.id.localeCompare(b.id));
            setAlertas(sorted);
            setLoading(false);
        });

        // Buscar rol del usuario actual
        const unsubUsers = subscribeToUsers((users) => {
            const currentU = users.find(u => u.email.toLowerCase() === currentUser?.email?.toLowerCase());
            if (currentU) {
                // Uniformizar 'Admin' a 'Administrador'
                setUserRole(currentU.rol.toLowerCase() === 'admin' ? 'Administrador' : currentU.rol);
            }
        });

        return () => {
            unsubAlerts();
            unsubUsers();
        };
    }, [currentUser]);

    const mostrarFeedback = (tipo: 'ok' | 'error', msg: string) => {
        setFeedback({ tipo, msg });
        setTimeout(() => setFeedback(null), 3000);
    };

    const hasPermission = (alert: AlertConfig) => {
        if (isSuperAdminFallback) return true;
        if (userRole === 'Administrador' || userRole === 'Admin') return true;
        return alert.rolesPermitidos.includes(userRole);
    };

    const handleToggleState = async (alert: AlertConfig) => {
        if (!hasPermission(alert)) {
            mostrarFeedback('error', 'No tienes permiso para modificar esta alerta');
            return;
        }
        try {
            await saveAlert({ ...alert, activa: !alert.activa });
            mostrarFeedback('ok', `Alerta ${!alert.activa ? 'activada' : 'desactivada'}`);
        } catch (error) {
            mostrarFeedback('error', 'Error al cambiar estado');
        }
    };

    const handleOpenEdit = (alert: AlertConfig) => {
        if (!hasPermission(alert)) return;
        setEditingAlert(alert);
        setFormData({ ...alert });
    };

    const handleSaveEdit = async () => {
        if (!formData) return;
        try {
            await saveAlert(formData);
            mostrarFeedback('ok', 'Configuración guardada correctamente');
            setEditingAlert(null);
            setFormData(null);
        } catch (error) {
            mostrarFeedback('error', 'Error al guardar la configuración');
        }
    };

    const handleRoleToggle = (rol: string) => {
        if (!formData) return;
        const currentRoles = formData.rolesPermitidos || [];
        const newRoles = currentRoles.includes(rol)
            ? currentRoles.filter(r => r !== rol)
            : [...currentRoles, rol];

        // El administrador siempre debe estar
        if (!newRoles.includes('Administrador')) {
            newRoles.push('Administrador');
        }

        setFormData({ ...formData, rolesPermitidos: newRoles });
    };

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: 30 }}>
            <div style={{ padding: '20px 30px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ color: 'var(--primary)', background: '#eef2ff', padding: 8, borderRadius: 10 }}>
                    <Bell size={20} />
                </div>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Gestor de Alertas Automáticas</h3>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                        Configura las notificaciones, canales de envío y permisos por rol.
                    </p>
                </div>
            </div>

            <div style={{ padding: 30, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {loading ? (
                    <p style={{ color: 'var(--gray-500)', textAlign: 'center', gridColumn: '1 / -1' }}>Cargando configuración...</p>
                ) : (
                    alertas.length === 0 ? (
                        <p style={{ color: 'var(--gray-500)', textAlign: 'center', gridColumn: '1 / -1' }}>No hay alertas configuradas.</p>
                    ) : (
                        alertas.map(alerta => {
                            const IconCmp = ICONS_MAP[alerta.id] || Bell;
                            const canEdit = hasPermission(alerta);

                            return (
                                <div key={alerta.id} style={{
                                    border: '1px solid var(--gray-200)',
                                    borderRadius: 16,
                                    padding: 20,
                                    background: alerta.activa ? 'white' : '#f8fafc',
                                    transition: 'all 0.2s',
                                    opacity: alerta.activa ? 1 : 0.7,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 16
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ padding: 8, borderRadius: 10, background: alerta.activa ? '#eef2ff' : '#e2e8f0', color: alerta.activa ? 'var(--primary)' : 'var(--gray-500)' }}>
                                                <IconCmp size={20} />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--gray-800)' }}>{alerta.nombre}</h4>
                                                <span style={{ fontSize: 11, fontWeight: 600, color: alerta.activa ? '#16a34a' : 'var(--gray-500)', marginTop: 4, display: 'inline-block' }}>
                                                    ● {alerta.activa ? 'Alerta Activa' : 'Desactivada'}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Toggle */}
                                        <div
                                            onClick={() => handleToggleState(alerta)}
                                            style={{
                                                width: 44,
                                                height: 24,
                                                borderRadius: 20,
                                                background: alerta.activa ? 'var(--primary)' : '#cbd5e1',
                                                cursor: canEdit ? 'pointer' : 'not-allowed',
                                                position: 'relative',
                                                transition: 'all 0.3s',
                                                opacity: canEdit ? 1 : 0.5
                                            }}
                                        >
                                            <div style={{
                                                width: 18, height: 18, background: 'white', borderRadius: '50%',
                                                position: 'absolute', top: 3, left: alerta.activa ? 23 : 3,
                                                transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }} />
                                        </div>
                                    </div>

                                    <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)', lineHeight: '1.4' }}>
                                        {alerta.descripcion}
                                    </p>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#f8fafc', padding: 12, borderRadius: 12 }}>
                                        <div>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Anticipación</span>
                                            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>{alerta.diasAnticipacion} {alerta.id === 'frecuencia_reenvio' ? 'horas' : 'días'}</p>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Canal</span>
                                            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', textTransform: 'capitalize' }}>
                                                {alerta.canal === 'ambos' ? 'Interno & Email' : alerta.canal}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleOpenEdit(alerta)}
                                        disabled={!canEdit}
                                        style={{
                                            padding: '10px',
                                            borderRadius: 10,
                                            border: '1.5px solid var(--gray-200)',
                                            background: 'white',
                                            color: canEdit ? 'var(--gray-700)' : 'var(--gray-400)',
                                            fontWeight: 700,
                                            fontSize: 12,
                                            cursor: canEdit ? 'pointer' : 'not-allowed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            transition: 'all 0.2s',
                                            marginTop: 'auto'
                                        }}
                                        onMouseEnter={(e) => { if (canEdit) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; } }}
                                        onMouseLeave={(e) => { if (canEdit) { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.color = 'var(--gray-700)'; } }}
                                    >
                                        <Settings2 size={14} />
                                        {canEdit ? 'Configurar Alerta' : 'Sin permisos'}
                                    </button>
                                </div>
                            );
                        })
                    )
                )}
            </div>

            {/* Modal de Configuración */}
            {editingAlert && formData && (
                <div className="fade-in" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: 500, padding: 30, display: 'flex', flexDirection: 'column', gap: 24, height: 'auto', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ background: '#eff6ff', color: 'var(--primary)', padding: 8, borderRadius: 10 }}>
                                    <Settings2 size={20} />
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Ajustes de Alerta</h3>
                            </div>
                            <button onClick={() => { setEditingAlert(null); setFormData(null); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Campos */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 750, color: 'var(--gray-600)', marginBottom: 8 }}>
                                    Nombre de la Alerta
                                </label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    style={{
                                        width: '100%', padding: '12px 16px', borderRadius: 12,
                                        border: '1.5px solid var(--gray-200)', background: '#f8fafc',
                                        fontSize: 14, fontWeight: 600, color: 'var(--gray-800)',
                                        outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 750, color: 'var(--gray-600)', marginBottom: 8 }}>
                                        Anticipación (Días)
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Clock size={16} style={{ position: 'absolute', top: 14, left: 14, color: 'var(--gray-400)' }} />
                                        <input
                                            type="number"
                                            value={formData.diasAnticipacion}
                                            onChange={(e) => setFormData({ ...formData, diasAnticipacion: parseInt(e.target.value) || 0 })}
                                            style={{
                                                width: '100%', padding: '12px 16px', paddingLeft: 40, borderRadius: 12,
                                                border: '1.5px solid var(--gray-200)', background: '#f8fafc',
                                                fontSize: 14, fontWeight: 600, color: 'var(--gray-800)',
                                                outline: 'none', boxSizing: 'border-box'
                                            }}
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 750, color: 'var(--gray-600)', marginBottom: 8 }}>
                                        Reenvío cada (Horas)
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <RotateCcwIcon size={16} style={{ position: 'absolute', top: 14, left: 14, color: 'var(--gray-400)' }} />
                                        <input
                                            type="number"
                                            value={formData.frecuenciaReenvioHoras}
                                            onChange={(e) => setFormData({ ...formData, frecuenciaReenvioHoras: parseInt(e.target.value) || 0 })}
                                            style={{
                                                width: '100%', padding: '12px 16px', paddingLeft: 40, borderRadius: 12,
                                                border: '1.5px solid var(--gray-200)', background: '#f8fafc',
                                                fontSize: 14, fontWeight: 600, color: 'var(--gray-800)',
                                                outline: 'none', boxSizing: 'border-box'
                                            }}
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 750, color: 'var(--gray-600)', marginBottom: 8 }}>
                                    Canal de Notificación
                                </label>
                                <select
                                    value={formData.canal}
                                    onChange={(e) => setFormData({ ...formData, canal: e.target.value as any })}
                                    style={{
                                        width: '100%', padding: '12px 16px', borderRadius: 12,
                                        border: '1.5px solid var(--gray-200)', background: '#f8fafc',
                                        fontSize: 14, fontWeight: 600, color: 'var(--gray-800)',
                                        outline: 'none', cursor: 'pointer'
                                    }}
                                >
                                    <option value="interno">Solo en Plataforma</option>
                                    <option value="email">Solo Email</option>
                                    <option value="ambos">Plataforma y Email</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 750, color: 'var(--gray-600)', marginBottom: 8 }}>
                                    Roles con acceso para editar esta alerta
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid var(--gray-200)' }}>
                                    {ALL_ROLES.map(rol => (
                                        <label key={rol} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.rolesPermitidos.includes(rol)}
                                                onChange={() => handleRoleToggle(rol)}
                                                disabled={rol === 'Administrador'} // Administrador siempre tiene acceso
                                                style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
                                            />
                                            {rol}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 750, color: 'var(--gray-600)', marginBottom: 8 }}>
                                    Mensaje de la Notificación
                                </label>
                                <textarea
                                    value={formData.mensaje}
                                    onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                                    style={{
                                        width: '100%', padding: '12px 16px', borderRadius: 12,
                                        border: '1.5px solid var(--gray-200)', background: '#f8fafc',
                                        fontSize: 13, fontWeight: 500, color: 'var(--gray-800)',
                                        outline: 'none', resize: 'vertical', minHeight: 80, boxSizing: 'border-box'
                                    }}
                                />
                                <p style={{ margin: '6px 0 0 0', fontSize: 11, color: 'var(--gray-500)', fontStyle: 'italic' }}>
                                    Soporta variables como {'{paciente_nombre}'}, {'{dias}'}, etc. dependiendo del contexto.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={handleSaveEdit}
                                style={{
                                    flex: 1, padding: '14px', borderRadius: 12, background: 'var(--primary)',
                                    color: 'white', border: 'none', fontWeight: 700, fontSize: 14,
                                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                }}
                            >
                                <Save size={18} />
                                Guardar Configuración
                            </button>
                            <button
                                onClick={() => { setEditingAlert(null); setFormData(null); }}
                                style={{
                                    padding: '14px 20px', borderRadius: 12, background: 'white',
                                    color: 'var(--gray-500)', border: '1.5px solid var(--gray-200)',
                                    fontWeight: 700, fontSize: 14, cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Toast */}
            {feedback && (
                <div style={{
                    position: 'fixed', bottom: 30, right: 30, zIndex: 4000,
                    background: feedback.tipo === 'ok' ? '#15803d' : '#dc2626',
                    color: 'white', padding: '12px 24px', borderRadius: 12,
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10,
                    animation: 'slideInRight 0.3s ease-out'
                }}>
                    <Bell size={18} />
                    {feedback.msg}
                </div>
            )}
        </div>
    );
}

// Pequeño workaround iterativo de iconos Lucide que no incluimos arriba
function RotateCcwIcon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
        </svg>
    )
}
