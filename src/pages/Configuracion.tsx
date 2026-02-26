import { useState, useEffect } from 'react';
import {
    Users,
    Shield,
    Check,
    X,
    Save,
    UserPlus,
    Settings as SettingsIcon,
    LayoutDashboard,
    Pill,
    Building2,
    PackageCheck,
    FileText,
    AlertTriangle,
    Key,
    RotateCcw,
    Plus,
    Edit,
    Trash2
} from 'lucide-react';
import { subscribeToUsers, updatePermission, UserPermission, createUserMetadata, resetPassword, updateUserProfile, updateAllPermissions } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import ConfiguracionAlertas from '../components/ConfiguracionAlertas';

const SECTIONS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pacientes', label: 'Pacientes', icon: Users },
    { id: 'medicamentos', label: 'Medicamentos', icon: Pill },
    { id: 'entidades', label: 'Entidades', icon: Building2 },
    { id: 'despachos', label: 'Control Entregas', icon: PackageCheck },
    { id: 'reportes', label: 'Reportes', icon: FileText },
    { id: 'riesgos', label: 'Riesgos', icon: AlertTriangle },
    { id: 'configuracion', label: 'Configuración', icon: SettingsIcon },
];

export default function Configuracion() {
    const [usuarios, setUsuarios] = useState<UserPermission[]>([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();
    const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'error', msg: string } | null>(null);

    // Hardcoded fallback for the primary admin email to ensure access during setup
    const isAdmin = usuarios.find(u => u.email.toLowerCase() === currentUser?.email?.toLowerCase())?.rol.toLowerCase() === 'admin'
        || currentUser?.email?.toLowerCase() === 'proyectos@nexatech.com.co';

    useEffect(() => {
        const unsub = subscribeToUsers((users) => {
            setUsuarios(users);
            setLoading(false);
        });
        return unsub;
    }, []);

    const togglePermiso = async (userId: string, section: string, action: string, currentVal: boolean) => {
        if (!isAdmin) {
            mostrarFeedback('error', 'Solo los administradores pueden modificar permisos');
            return;
        }
        try {
            await updatePermission(userId, section, action as any, !currentVal);
            mostrarFeedback('ok', 'Permiso actualizado correctamente');
        } catch (err) {
            mostrarFeedback('error', 'Error al actualizar permiso');
        }
    };

    const handleToggleAll = async (user: UserPermission) => {
        if (!isAdmin) return;

        // Check if at least one permission is true to decide whether to clear or fill all
        const hasAnyPerm = Object.values(user.permisos).some(s => Object.values(s).some(v => v === true));
        const newValue = !hasAnyPerm;

        try {
            await updateAllPermissions(user.id, SECTIONS.map(s => s.id), newValue);
            mostrarFeedback('ok', newValue ? 'Todos los permisos activados' : 'Todos los permisos desactivados');
        } catch (err) {
            mostrarFeedback('error', 'Error al actualizar permisos en masa');
        }
    };

    const [selectedUser, setSelectedUser] = useState<UserPermission | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newRole, setNewRole] = useState('');
    const [createData, setCreateData] = useState({ nombre: '', email: '', rol: 'Auxiliar' });

    const ROLES = ['Administrador', 'Coordinador', 'Farmacia', 'Auxiliar'];

    const openEditModal = (u: UserPermission) => {
        setSelectedUser(u);
        setNewRole(u.rol === 'Admin' ? 'Administrador' : u.rol);
        setEditModalOpen(true);
    };

    const handleSaveUser = async () => {
        if (!selectedUser) return;
        try {
            await updateUserProfile(selectedUser.id, { rol: newRole });
            mostrarFeedback('ok', 'Usuario actualizado correctamente');
            setEditModalOpen(false);
        } catch (err) {
            mostrarFeedback('error', 'Error al actualizar usuario');
        }
    };

    const handleCreateUser = async () => {
        if (!createData.email || !createData.nombre) {
            mostrarFeedback('error', 'Por favor complete todos los campos');
            return;
        }
        try {
            const ADMIN_PERMS_OBJ = { ver: true, crear: true, editar: true, eliminar: true };
            const DEFAULT_PERMS_OBJ = { ver: true, crear: false, editar: false, eliminar: false };
            const NO_PERMS_OBJ = { ver: false, crear: false, editar: false, eliminar: false };

            const isRoleAdmin = createData.rol === 'Administrador';

            await createUserMetadata({
                email: createData.email,
                nombre: createData.nombre,
                rol: createData.rol,
                permisos: isRoleAdmin ? {
                    dashboard: ADMIN_PERMS_OBJ,
                    pacientes: ADMIN_PERMS_OBJ,
                    medicamentos: ADMIN_PERMS_OBJ,
                    entidades: ADMIN_PERMS_OBJ,
                    despachos: ADMIN_PERMS_OBJ,
                    reportes: ADMIN_PERMS_OBJ,
                    riesgos: ADMIN_PERMS_OBJ,
                    configuracion: ADMIN_PERMS_OBJ
                } : {
                    dashboard: DEFAULT_PERMS_OBJ,
                    pacientes: DEFAULT_PERMS_OBJ,
                    medicamentos: DEFAULT_PERMS_OBJ,
                    entidades: DEFAULT_PERMS_OBJ,
                    despachos: DEFAULT_PERMS_OBJ,
                    reportes: DEFAULT_PERMS_OBJ,
                    riesgos: DEFAULT_PERMS_OBJ,
                    configuracion: NO_PERMS_OBJ
                }
            });
            mostrarFeedback('ok', 'Usuario creado correctamente');
            setCreateModalOpen(false);
            setCreateData({ nombre: '', email: '', rol: 'Auxiliar' });
        } catch (err) {
            mostrarFeedback('error', 'Error al crear usuario');
        }
    };

    const handleResetPassword = async (email: string) => {
        if (!isAdmin) return;
        if (!window.confirm(`¿Seguro que deseas enviar un correo de restablecimiento de contraseña a ${email}?`)) return;

        try {
            await resetPassword(email);
            mostrarFeedback('ok', `Correo enviado a ${email}`);
        } catch (err) {
            mostrarFeedback('error', 'Error al enviar correo de recuperación');
        }
    };

    const mostrarFeedback = (tipo: 'ok' | 'error', msg: string) => {
        setFeedback({ tipo, msg });
        setTimeout(() => setFeedback(null), 3000);
    };

    const PermisoToggle = ({ active, onClick, label, icon: Icon }: { active: boolean, onClick: () => void, label: string, icon: any }) => (
        <button
            onClick={onClick}
            title={label}
            style={{
                border: 'none',
                background: active ? 'var(--primary)' : '#f3f4f6',
                color: active ? 'white' : 'var(--gray-300)',
                width: 24,
                height: 24,
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                padding: 0
            }}
        >
            <Icon size={12} strokeWidth={3} />
        </button>
    );

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Cabecera Estilo Dashboard */}
            <div className="card" style={{
                padding: '30px',
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
                border: '1px solid rgba(99, 102, 241, 0.1)',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
            }}>
                <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)',
                    color: 'white'
                }}>
                    <SettingsIcon size={32} />
                </div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 850, margin: 0, letterSpacing: '-0.8px', color: 'var(--gray-900)' }}>
                        Panel de Configuración
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--gray-500)', marginTop: 4, fontWeight: 500 }}>
                        Administra el acceso y la seguridad de la plataforma PharmaCare
                    </p>
                </div>
            </div>

            {/* Gestión de Usuarios y Permisos */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px 30px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ color: 'var(--primary)', background: '#eef2ff', padding: 8, borderRadius: 10 }}>
                                <Shield size={20} />
                            </div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Matriz de Permisos Detallada</h3>
                        </div>
                        <div style={{ display: 'flex', gap: 12, background: '#f8fafc', padding: '6px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Leyenda:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--primary)' }} /><span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-600)' }}>V: Ver</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--primary)' }} /><span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-600)' }}>C: Crear</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--primary)' }} /><span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-600)' }}>E: Editar</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--primary)' }} /><span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-600)' }}>D: Eliminar</span></div>
                        </div>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--gray-100)' }}>
                                <th style={{ textAlign: 'left', padding: '16px 30px', fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Usuario / Email</th>
                                {SECTIONS.map(section => (
                                    <th key={section.id} style={{ padding: '16px 10px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                            <section.icon size={16} style={{ color: 'var(--gray-400)' }} />
                                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-600)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                                                {section.label}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                                <th style={{ padding: '16px 30px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.length === 0 ? (
                                <tr>
                                    <td colSpan={SECTIONS.length + 2} style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                                        Cargando matriz de acceso...
                                    </td>
                                </tr>
                            ) : (
                                usuarios.map(userItem => (
                                    <tr key={userItem.id} style={{ borderBottom: '1px solid var(--gray-100)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px 30px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-900)' }}>{userItem.nombre}</span>
                                                <span style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>{userItem.email}</span>
                                                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                                                    <span style={{
                                                        fontSize: 10,
                                                        fontWeight: 800,
                                                        color: (userItem.rol === 'Admin' || userItem.rol === 'Administrador') ? '#dc2626' : '#2563eb',
                                                        background: (userItem.rol === 'Admin' || userItem.rol === 'Administrador') ? '#fef2f2' : '#eff6ff',
                                                        padding: '2px 8px',
                                                        borderRadius: 20,
                                                        width: 'fit-content',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {userItem.rol === 'Admin' ? 'Administrador' : userItem.rol}
                                                    </span>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleToggleAll(userItem)}
                                                            title="Activar o Desactivar TODOS los permisos"
                                                            style={{
                                                                border: '1px solid #e2e8f0',
                                                                background: 'white',
                                                                color: 'var(--primary)',
                                                                padding: '2px 6px',
                                                                borderRadius: 6,
                                                                fontSize: 9,
                                                                fontWeight: 800,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 4,
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = '#f8fafc';
                                                                e.currentTarget.style.borderColor = 'var(--primary)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = 'white';
                                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                                            }}
                                                        >
                                                            <Check size={10} strokeWidth={4} />
                                                            TOTAL
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        {SECTIONS.map(section => {
                                            const perms = (userItem.permisos as any)[section.id] || { ver: false, crear: false, editar: false, eliminar: false };
                                            return (
                                                <td key={section.id} style={{ padding: '12px 6px', textAlign: 'center' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 24px)', gap: 4, justifyContent: 'center' }}>
                                                        <PermisoToggle
                                                            active={perms.ver}
                                                            icon={LayoutDashboard}
                                                            label="Ver"
                                                            onClick={() => togglePermiso(userItem.id, section.id, 'ver', perms.ver)}
                                                        />
                                                        <PermisoToggle
                                                            active={perms.crear}
                                                            icon={Plus}
                                                            label="Crear"
                                                            onClick={() => togglePermiso(userItem.id, section.id, 'crear', perms.crear)}
                                                        />
                                                        <PermisoToggle
                                                            active={perms.editar}
                                                            icon={Edit}
                                                            label="Editar"
                                                            onClick={() => togglePermiso(userItem.id, section.id, 'editar', perms.editar)}
                                                        />
                                                        <PermisoToggle
                                                            active={perms.eliminar}
                                                            icon={Trash2}
                                                            label="Eliminar"
                                                            onClick={() => togglePermiso(userItem.id, section.id, 'eliminar', perms.eliminar)}
                                                        />
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td style={{ padding: '12px 30px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                                                {isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={() => openEditModal(userItem)}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: 6,
                                                                padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                                                                background: 'white', color: 'var(--gray-700)', fontSize: 11,
                                                                fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                                                width: '100%', justifyContent: 'center'
                                                            }}
                                                        >
                                                            <Edit size={14} /> Editar Usuario
                                                        </button>
                                                        <button
                                                            onClick={() => handleResetPassword(userItem.email)}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: 6,
                                                                padding: '6px 12px', borderRadius: 8, border: '1px solid #eef2ff',
                                                                background: '#f8faff', color: '#4f46e5', fontSize: 11,
                                                                fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                                                width: '100%', justifyContent: 'center'
                                                            }}
                                                        >
                                                            <RotateCcw size={14} /> Reset Clave
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ padding: '20px 30px', background: '#f8fafc', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 12, color: 'var(--gray-500)', margin: 0 }}>
                        * Los cambios en los permisos se aplican en tiempo real al usuario.
                    </p>
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        style={{
                            padding: '10px 24px',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 12,
                            fontSize: 14,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                        <UserPlus size={18} />
                        Añadir Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* Modal de Creación de Usuario */}
            {createModalOpen && (
                <div className="fade-in" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: 450, padding: 30, display: 'flex', flexDirection: 'column', gap: 24, height: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ background: '#eff6ff', color: 'var(--primary)', padding: 8, borderRadius: 10 }}>
                                    <UserPlus size={20} />
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Nuevo Usuario</h3>
                            </div>
                            <button onClick={() => setCreateModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 750, color: 'var(--gray-600)', marginBottom: 8 }}>
                                    Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. Juan Pérez"
                                    value={createData.nombre}
                                    onChange={(e) => setCreateData({ ...createData, nombre: e.target.value })}
                                    style={{
                                        width: '100%', padding: '12px 16px', borderRadius: 12,
                                        border: '1.5px solid var(--gray-200)', background: '#f8fafc',
                                        fontSize: 14, fontWeight: 600, color: 'var(--gray-800)',
                                        outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 750, color: 'var(--gray-600)', marginBottom: 8 }}>
                                    Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    placeholder="usuario@ejemplo.com"
                                    value={createData.email}
                                    onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                                    style={{
                                        width: '100%', padding: '12px 16px', borderRadius: 12,
                                        border: '1.5px solid var(--gray-200)', background: '#f8fafc',
                                        fontSize: 14, fontWeight: 600, color: 'var(--gray-800)',
                                        outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 750, color: 'var(--gray-600)', marginBottom: 8 }}>
                                    Rol / Perfil Inicial
                                </label>
                                <select
                                    value={createData.rol}
                                    onChange={(e) => setCreateData({ ...createData, rol: e.target.value })}
                                    style={{
                                        width: '100%', padding: '12px 16px', borderRadius: 12,
                                        border: '1.5px solid var(--gray-200)', background: '#f8fafc',
                                        fontSize: 14, fontWeight: 600, color: 'var(--gray-800)',
                                        outline: 'none', cursor: 'pointer'
                                    }}
                                >
                                    {ROLES.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={handleCreateUser}
                                style={{
                                    flex: 1, padding: '14px', borderRadius: 12, background: 'var(--primary)',
                                    color: 'white', border: 'none', fontWeight: 700, fontSize: 14,
                                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                                }}
                            >
                                Crear Usuario
                            </button>
                            <button
                                onClick={() => setCreateModalOpen(false)}
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

            {/* Modal de Edición de Usuario */}
            {editModalOpen && (
                <div className="fade-in" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: 450, padding: 30, display: 'flex', flexDirection: 'column', gap: 24, height: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ background: '#eff6ff', color: 'var(--primary)', padding: 8, borderRadius: 10 }}>
                                    <Shield size={20} />
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Editar Perfil</h3>
                            </div>
                            <button onClick={() => setEditModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--gray-900)' }}>{selectedUser?.nombre}</p>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>{selectedUser?.email}</p>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 750, color: 'var(--gray-600)', marginBottom: 8 }}>
                                Rol / Perfil del Usuario
                            </label>
                            <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: 12,
                                    border: '1.5px solid var(--gray-200)', background: '#f8fafc',
                                    fontSize: 14, fontWeight: 600, color: 'var(--gray-800)',
                                    outline: 'none', cursor: 'pointer'
                                }}
                            >
                                {ROLES.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                            <button
                                onClick={handleSaveUser}
                                style={{
                                    flex: 1, padding: '14px', borderRadius: 12, background: 'var(--primary)',
                                    color: 'white', border: 'none', fontWeight: 700, fontSize: 14,
                                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                                }}
                            >
                                Guardar Cambios
                            </button>
                            <button
                                onClick={() => setEditModalOpen(false)}
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

            {/* Módulo de Configuración de Alertas */}
            <ConfiguracionAlertas />

            {/* Feedback Toast */}
            {feedback && (
                <div style={{
                    position: 'fixed', bottom: 30, right: 30, zIndex: 3000,
                    background: feedback.tipo === 'ok' ? '#15803d' : '#dc2626',
                    color: 'white', padding: '12px 24px', borderRadius: 12,
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10,
                    animation: 'slideInRight 0.3s ease-out'
                }}>
                    <Check size={18} />
                    {feedback.msg}
                </div>
            )}
        </div>
    );
}
