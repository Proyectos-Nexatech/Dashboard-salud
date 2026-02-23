import {
    Search, Bell, Settings, Filter, ChevronDown,
    User as UserIcon, LogOut, ShieldCheck, UserCircle,
    X, Camera, Save, CheckCircle2
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import ExcelUploader from './ExcelUploader';
import { useAuth } from '../context/AuthContext';
import { subscribeToUsers, UserPermission, updateUserProfile } from '../services/userService';

import type { Paciente } from '../data/mockData';

interface HeaderProps {
    onFileUpload: (file: File) => void;
    onDataLoaded: (pacientes: Paciente[]) => void;
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
}

export default function Header({
    onFileUpload,
    onDataLoaded,
    selectedEps, onEpsChange,
    selectedMunicipio, onMunicipioChange,
    selectedMedicamento, onMedicamentoChange,
    epsList, municipiosList, medicamentosList, alertCount
}: HeaderProps) {
    const { logout, user } = useAuth();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [userData, setUserData] = useState<UserPermission | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ nombre: '', photoURL: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

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
                <ExcelUploader onDataLoaded={onDataLoaded} compact={true} />

                <button style={{
                    position: 'relative', width: 44, height: 44, borderRadius: '50%',
                    background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-secondary)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)'
                }}>
                    <Bell size={20} />
                    {alertCount > 0 && (
                        <span style={{
                            position: 'absolute', top: 10, right: 10, width: 8, height: 8,
                            background: '#ef4444', borderRadius: '50%', border: '2px solid white'
                        }} />
                    )}
                </button>

                {/* Perfil de Usuario */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <button
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '6px 6px 6px 14px',
                            background: 'white',
                            borderRadius: 30,
                            border: '1px solid var(--gray-100)',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-900)' }}>
                                {userData?.nombre || user?.email?.split('@')[0]}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                {userData?.rol || 'Usuario'}
                            </span>
                        </div>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: userData?.photoURL ? `url(${userData.photoURL}) center/cover no-repeat` : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', boxShadow: '0 4px 8px rgba(99, 102, 241, 0.2)',
                            overflow: 'hidden'
                        }}>
                            {!userData?.photoURL && <UserIcon size={18} />}
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {showProfileDropdown && (
                        <div className="fade-in" style={{
                            position: 'absolute', top: 'calc(100% + 12px)', right: 0,
                            width: 240, background: 'white', borderRadius: 16,
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                            border: '1px solid var(--gray-100)', overflow: 'hidden', zIndex: 1000
                        }}>
                            <div
                                onClick={() => { setShowProfileModal(true); setShowProfileDropdown(false); }}
                                style={{ padding: '20px', background: 'linear-gradient(135deg, #f8fafc, #ffffff)', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                                    <UserCircle size={16} color="var(--primary)" />
                                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray-400)', textTransform: 'uppercase' }}>
                                        Mi Perfil
                                    </span>
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)', wordBreak: 'break-all' }}>
                                    {userData?.nombre || user?.email?.split('@')[0]}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4 }}>
                                    Configurar cuenta
                                </div>
                            </div>

                            <div style={{ padding: 8 }}>
                                <button
                                    onClick={() => logout()}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        width: '100%', padding: '12px 14px', border: 'none',
                                        background: 'none', cursor: 'pointer', borderRadius: 10,
                                        color: '#ef4444', fontWeight: 600, fontSize: 13,
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                >
                                    <LogOut size={18} />
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Perfil de Usuario */}
            {showProfileModal && (
                <div className="fade-in" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
                    padding: 20
                }}>
                    <div style={{
                        width: '100%', maxWidth: 450, background: 'white', borderRadius: 28,
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden',
                        position: 'relative'
                    }}>
                        {/* Cabecera del Modal */}
                        <div style={{
                            height: 120, background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            position: 'relative'
                        }}>
                            <button
                                onClick={() => { setShowProfileModal(false); setIsEditing(false); }}
                                style={{
                                    position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)',
                                    border: 'none', width: 36, height: 36, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Avatar en el Modal */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: -60, position: 'relative' }}>
                            <div style={{
                                width: 120, height: 120, borderRadius: '50%', border: '6px solid white',
                                background: editData.photoURL ? `url(${editData.photoURL}) center/cover no-repeat` : '#f3f4f6',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', overflow: 'hidden'
                            }}>
                                {!editData.photoURL && <UserIcon size={48} color="var(--gray-300)" />}
                            </div>
                            {isEditing && (
                                <div style={{
                                    position: 'absolute', bottom: 5, transform: 'translateX(40px)',
                                    background: 'var(--primary)', width: 32, height: 32, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                                    border: '2px solid white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}>
                                    <Camera size={16} />
                                </div>
                            )}
                        </div>

                        {/* Contenido del Modal */}
                        <div style={{ padding: '30px', textAlign: 'center' }}>
                            {!isEditing ? (
                                <>
                                    <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--gray-900)' }}>
                                        {userData?.nombre}
                                    </h2>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        background: (userData?.rol?.toLowerCase() === 'admin' || userData?.rol === 'Administrador' || userData?.rol === 'Admin') ? '#eff6ff' : '#f8fafc',
                                        color: (userData?.rol?.toLowerCase() === 'admin' || userData?.rol === 'Administrador' || userData?.rol === 'Admin') ? 'var(--primary)' : 'var(--gray-600)',
                                        padding: '6px 16px',
                                        borderRadius: 20, fontSize: 13, fontWeight: 800, marginTop: 12,
                                        textTransform: 'uppercase', letterSpacing: '0.5px',
                                        border: '1px solid rgba(0,0,0,0.05)'
                                    }}>
                                        <ShieldCheck size={14} />
                                        <span style={{ opacity: 0.7, fontSize: 11 }}>Perfil:</span>
                                        {userData?.rol?.toLowerCase() === 'admin' ? 'Administrador' : userData?.rol}
                                    </div>

                                    <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div style={{
                                            textAlign: 'left', background: '#f8fafc', padding: '16px',
                                            borderRadius: 16, border: '1px solid #f1f5f9'
                                        }}>
                                            <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 4 }}>
                                                Correo Electrónico
                                            </span>
                                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)' }}>
                                                {user?.email}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                style={{
                                                    flex: 1, padding: '14px', borderRadius: 14, background: 'var(--primary)',
                                                    color: 'white', border: 'none', fontWeight: 700, fontSize: 14,
                                                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                Editar Perfil
                                            </button>
                                            <button
                                                onClick={() => logout()}
                                                style={{
                                                    width: 50, height: 50, borderRadius: 14, background: '#fef2f2',
                                                    color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                                title="Cerrar Sesión"
                                            >
                                                <LogOut size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 750, color: 'var(--gray-600)', marginBottom: 8, marginLeft: 4 }}>
                                            Nombre Completo
                                        </label>
                                        <input
                                            type="text"
                                            value={editData.nombre}
                                            onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                                            style={{
                                                width: '100%', padding: '12px 16px', borderRadius: 12, background: '#f8fafc',
                                                border: '1px solid var(--gray-200)', fontSize: 14, fontWeight: 600
                                            }}
                                            placeholder="Tu nombre completo"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 750, color: 'var(--gray-600)', marginBottom: 8, marginLeft: 4 }}>
                                            URL de Foto de Perfil
                                        </label>
                                        <input
                                            type="text"
                                            value={editData.photoURL}
                                            onChange={(e) => setEditData({ ...editData, photoURL: e.target.value })}
                                            style={{
                                                width: '100%', padding: '12px 16px', borderRadius: 12, background: '#f8fafc',
                                                border: '1px solid var(--gray-200)', fontSize: 14, fontWeight: 600
                                            }}
                                            placeholder="https://ejemplo.com/mifoto.jpg"
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={isSaving}
                                            style={{
                                                flex: 2, padding: '14px', borderRadius: 14, background: showSuccess ? '#22c55e' : 'var(--primary)',
                                                color: 'white', border: 'none', fontWeight: 700, fontSize: 14,
                                                cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            {isSaving ? (
                                                <div className="spinner" style={{ width: 18, height: 18, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                            ) : showSuccess ? (
                                                <><CheckCircle2 size={18} /> Perfil Guardado</>
                                            ) : (
                                                <><Save size={18} /> Guardar Cambios</>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => { setIsEditing(false); setEditData({ nombre: userData?.nombre || '', photoURL: userData?.photoURL || '' }); }}
                                            style={{
                                                flex: 1, padding: '14px', borderRadius: 14, background: '#f8fafc',
                                                color: 'var(--gray-500)', border: '1px solid var(--gray-200)',
                                                fontWeight: 700, fontSize: 14, cursor: 'pointer'
                                            }}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
