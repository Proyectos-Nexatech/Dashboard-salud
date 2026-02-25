import {
    Search, Bell, Settings, Filter, ChevronDown,
    User as UserIcon, LogOut, ShieldCheck, UserCircle,
    X, Camera, Save, CheckCircle2, Pill, Phone, Stethoscope
} from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDespachos } from '../context/DespachoContext';
import { subscribeToUsers, UserPermission, updateUserProfile } from '../services/userService';
import { gestionarRescate } from '../services/despachoService';
import { getGrupoAPendientes, getGrupoBRescate } from '../utils/despachoUtils';
import RecallManagementModal from './RecallManagementModal';
import type { Despacho } from '../data/despachoTypes';

interface HeaderProps {
    selectedEps: string;
    selectedMunicipio: string;
    selectedMedicamento: string;
    onEpsChange: (v: string) => void;
    onMunicipioChange: (v: string) => void;
    onMedicamentoChange: (v: string) => void;
    epsList: string[];
    municipiosList: string[];
    medicamentosList: string[];
    alertCount: number;
    onNavigate: (page: string) => void;
}

export default function Header({
    selectedEps, onEpsChange,
    selectedMunicipio, onMunicipioChange,
    selectedMedicamento, onMedicamentoChange,
    epsList, municipiosList, medicamentosList, alertCount,
    onNavigate
}: HeaderProps) {
    const { logout, user } = useAuth();
    const { despachos } = useDespachos();

    // Grouping logic for notifications
    const grupoA = useMemo(() => getGrupoAPendientes(despachos), [despachos]);
    const grupoB = useMemo(() => getGrupoBRescate(despachos), [despachos]);
    const grupoC = useMemo(() => {
        const hoy = new Date().toISOString().split('T')[0];
        return despachos.filter(d => d.seguimientoEstado === 'Programado' && d.seguimientoFechaProgramada === hoy);
    }, [despachos]);
    const totalNotifications = grupoA.length + grupoB.length + grupoC.length;

    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [userData, setUserData] = useState<UserPermission | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ nombre: '', photoURL: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Recall Management State
    const [recallModal, setRecallModal] = useState<{ isOpen: boolean; despacho: Despacho | null }>({
        isOpen: false,
        despacho: null
    });

    const dropdownRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsub = subscribeToUsers((users) => {
            const current = users.find(u => u.email.toLowerCase() === user?.email?.toLowerCase());
            if (current) {
                setUserData(current);
                setEditData({ nombre: current.nombre || '', photoURL: current.photoURL || '' });
            }
        });
        return unsub;
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowProfileDropdown(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSaveProfile = async () => {
        if (!userData) return;
        setIsSaving(true);
        try {
            await updateUserProfile(userData.id, editData);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setIsEditing(false);
            }, 2000);
        } catch (error) {
            alert('Error al actualizar el perfil');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <header className="header">
            {/* Title / Breadcrumb */}
            <div className="header-title">
                <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                    Bienvenido a PharmaCare
                </h1>
                <div className="header-subtitle" style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {user?.email} · Gestiona y analiza el seguimiento de pacientes
                </div>
            </div>

            {/* Center Search Bar */}
            <div className="header-search">
                <Search size={18} color="var(--text-secondary)" />
                <input
                    type="text"
                    placeholder="Buscar paciente, medicamento o ID..."
                    onChange={(e) => onMedicamentoChange(e.target.value)} // Simple search binding
                />
                <div style={{ width: 1, height: 24, background: 'var(--gray-200)', margin: '0 8px' }}></div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
                    Filtros <ChevronDown size={14} />
                </button>
            </div>

            {/* Right Actions */}
            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>

                {/* Notificaciones */}
                <div style={{ position: 'relative' }} ref={notifRef}>
                    <button
                        onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                        style={{
                            position: 'relative', width: 44, height: 44, borderRadius: '50%',
                            background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-secondary)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Bell size={20} />
                        {totalNotifications > 0 && (
                            <span style={{
                                position: 'absolute', top: -2, right: -2,
                                background: '#ef4444', color: 'white', borderRadius: '50%',
                                border: '2px solid white', fontSize: 10, fontWeight: 800,
                                minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0 4px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                            }}>
                                {totalNotifications}
                            </span>
                        )}
                    </button>

                    {showNotifDropdown && (
                        <div className="fade-in" style={{
                            position: 'absolute', top: 'calc(100% + 12px)', right: 0,
                            width: 320, background: 'white', borderRadius: 16,
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                            border: '1px solid var(--gray-100)', overflow: 'hidden', zIndex: 1000
                        }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-900)' }}>Notificaciones</span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: 'white', background: '#ef4444', padding: '2px 8px', borderRadius: 10 }}>
                                    {totalNotifications} pendientes
                                </span>
                            </div>

                            <div style={{ maxHeight: 450, overflowY: 'auto' }}>
                                {totalNotifications === 0 ? (
                                    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                        <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-500)' }}>¡Todo al día!</div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Grupo C: Seguimientos */}
                                        {grupoC.length > 0 && (
                                            <div style={{ background: '#f0f9ff', borderBottom: '1px solid #bae6fd' }}>
                                                <div style={{ padding: '8px 20px', fontSize: 10, fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    🩺 Seguimientos Hoy ({grupoC.length})
                                                </div>
                                                {grupoC.map(d => (
                                                    <div
                                                        key={d.id}
                                                        onClick={() => { onNavigate('ciclos'); setShowNotifDropdown(false); }}
                                                        style={{ padding: '12px 20px', borderBottom: '1px solid #bae6fd', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' }}
                                                    >
                                                        <div style={{ background: '#0ea5e9', color: 'white', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Stethoscope size={14} />
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.nombreCompleto}</div>
                                                            <div style={{ fontSize: 11, color: '#0369a1' }}>Evaluar respuesta clínica</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Grupo B: Rescate */}
                                        {grupoB.length > 0 && (
                                            <div style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                                                <div style={{ padding: '8px 20px', fontSize: 10, fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    📞 Rescate de Pacientes ({grupoB.length})
                                                </div>
                                                {grupoB.map(d => (
                                                    <div
                                                        key={d.id}
                                                        onClick={() => { setRecallModal({ isOpen: true, despacho: d }); setShowNotifDropdown(false); }}
                                                        style={{ padding: '12px 20px', borderBottom: '1px solid #fde68a', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' }}
                                                    >
                                                        <div style={{ background: '#f59e0b', color: 'white', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Phone size={14} />
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.nombreCompleto}</div>
                                                            <div style={{ fontSize: 11, color: '#92400e' }}>Retraso de 5 días</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Grupo A: Pendientes */}
                                        {grupoA.length > 0 && (
                                            <div>
                                                <div style={{ padding: '8px 20px', fontSize: 10, fontWeight: 800, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc' }}>
                                                    💊 Entregas Pendientes ({grupoA.length})
                                                </div>
                                                {grupoA.slice(0, 5).map(d => (
                                                    <div
                                                        key={d.id}
                                                        onClick={() => { onNavigate('despachos'); setShowNotifDropdown(false); }}
                                                        style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{d.nombreCompleto}</span>
                                                            <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>{d.fechaProgramada}</span>
                                                        </div>
                                                        <div style={{ fontSize: 11, color: '#64748b' }}>{d.medicamento}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div style={{ padding: 10, background: '#f8fafc', borderTop: '1px solid var(--gray-100)' }}>
                                <button
                                    onClick={() => { onNavigate('despachos'); setShowNotifDropdown(false); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        width: '100%', padding: '10px', background: 'white',
                                        borderRadius: 10, color: 'var(--primary)', fontWeight: 700, fontSize: 12,
                                        cursor: 'pointer', border: '1px solid var(--gray-200)', transition: 'all 0.2s'
                                    }}
                                >
                                    Ver todos en Control de Entregas
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Perfil de Usuario */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <button
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '6px 6px 6px 14px',
                            borderRadius: 30,
                            background: 'white',
                            border: '1.5px solid var(--gray-100)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
                                {userData?.nombre || user?.email?.split('@')[0]}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--primary)', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                                {userData?.rol === 'admin' ? <ShieldCheck size={10} /> : <UserCircle size={10} />}
                                {userData?.rol || 'Usuario'}
                            </div>
                        </div>
                        <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary), #4f46e5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                            fontWeight: 800, fontSize: 14, overflow: 'hidden'
                        }}>
                            {userData?.photoURL ? (
                                <img src={userData.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                (userData?.nombre?.[0] || user?.email?.[0] || 'U').toUpperCase()
                            )}
                        </div>
                    </button>

                    {showProfileDropdown && (
                        <div className="fade-in" style={{
                            position: 'absolute', top: 'calc(100% + 12px)', right: 0,
                            width: 200, background: 'white', borderRadius: 16,
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                            border: '1px solid var(--gray-100)', padding: 8, zIndex: 1000
                        }}>
                            <button
                                onClick={() => { setShowProfileModal(true); setShowProfileDropdown(false); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    width: '100%', padding: '10px 12px', borderRadius: 10,
                                    border: 'none', background: 'transparent', color: 'var(--gray-700)',
                                    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <UserIcon size={16} /> Ver Perfil
                            </button>
                            <button
                                onClick={() => { onNavigate('configuracion'); setShowProfileDropdown(false); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    width: '100%', padding: '10px 12px', borderRadius: 10,
                                    border: 'none', background: 'transparent', color: 'var(--gray-700)',
                                    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <Settings size={16} /> Configuración
                            </button>
                            <div style={{ height: 1, background: 'var(--gray-100)', margin: '4px 8px' }}></div>
                            <button
                                onClick={logout}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    width: '100%', padding: '10px 12px', borderRadius: 10,
                                    border: 'none', background: 'transparent', color: '#dc2626',
                                    fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <LogOut size={16} /> Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Profile Edit Modal */}
            {showProfileModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="fade-in" style={{
                        background: 'white', width: '100%', maxWidth: 440, borderRadius: 24,
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
                    }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Mi Perfil</h3>
                            <button onClick={() => { setShowProfileModal(false); setIsEditing(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}><X size={20} /></button>
                        </div>

                        <div style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        width: 100, height: 100, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--primary), #4f46e5)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 40, color: 'white', fontWeight: 800, overflow: 'hidden',
                                        border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                    }}>
                                        {editData.photoURL ? (
                                            <img src={editData.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            (editData.nombre?.[0] || user?.email?.[0] || 'U').toUpperCase()
                                        )}
                                    </div>
                                    {isEditing && (
                                        <button style={{
                                            position: 'absolute', bottom: 0, right: 0,
                                            width: 32, height: 32, borderRadius: '50%', background: 'white',
                                            border: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', boxShadow: 'var(--shadow-sm)'
                                        }}>
                                            <Camera size={14} color="var(--primary)" />
                                        </button>
                                    )}
                                </div>

                                <div style={{ width: '100%' }}>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Nombre Completo</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editData.nombre}
                                            onChange={e => setEditData({ ...editData, nombre: e.target.value })}
                                            style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid var(--primary)', fontSize: 14, outline: 'none' }}
                                            autoFocus
                                        />
                                    ) : (
                                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)' }}>{userData?.nombre || 'Nombre no asignado'}</div>
                                    )}

                                    <div style={{ marginTop: 20 }}>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Correo Electrónico</label>
                                        <div style={{ fontSize: 14, color: 'var(--gray-600)', background: '#f8fafc', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--gray-100)' }}>{user?.email}</div>
                                    </div>

                                    <div style={{ marginTop: 20 }}>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Rol de Usuario</label>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0f4ff', color: 'var(--primary)', padding: '6px 14px', borderRadius: 30, fontSize: 12, fontWeight: 700 }}>
                                            <ShieldCheck size={14} /> {userData?.rol?.toUpperCase() || 'USUARIO'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '24px 32px', borderTop: '1px solid var(--gray-100)', display: 'flex', gap: 12, justifyContent: 'flex-end', background: '#f8fafc' }}>
                            {!isEditing ? (
                                <button onClick={() => setIsEditing(true)} style={{ padding: '10px 24px', borderRadius: 10, border: '1.5px solid var(--gray-200)', background: 'white', color: 'var(--gray-700)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Editar Datos</button>
                            ) : (
                                <>
                                    <button onClick={() => setIsEditing(false)} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--gray-500)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)' }}
                                    >
                                        {isSaving ? 'Guardando...' : <><Save size={16} /> Guardar Cambios</>}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Recall Modal for Notifications (Header) */}
            {recallModal.isOpen && recallModal.despacho && (
                <RecallManagementModal
                    isOpen={recallModal.isOpen}
                    despacho={recallModal.despacho}
                    onClose={() => setRecallModal({ isOpen: false, despacho: null })}
                    onSave={async (action, observation) => {
                        if (recallModal.despacho?.firestoreId) {
                            await gestionarRescate(recallModal.despacho.firestoreId, action, observation, user?.email || 'Sistema');
                            setRecallModal({ isOpen: false, despacho: null });
                        }
                    }}
                />
            )}
        </header>
    );
}
