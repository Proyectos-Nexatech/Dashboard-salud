import { Search, Bell, Settings, Filter, ChevronDown, User, LogOut } from 'lucide-react';
import ExcelUploader from './ExcelUploader';
import { useAuth } from '../context/AuthContext';

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

                <button
                    onClick={() => logout()}
                    title="Cerrar Sesión"
                    style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#ef4444', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.2s'
                    }}
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
}
