import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import Riesgos from './pages/Riesgos';
import Simulacion from './pages/Simulacion';
import Reportes from './pages/Reportes';
import ControlDespachos from './pages/ControlDespachos';
import { PACIENTES_MOCK, EPS_LIST } from './data/mockData';
import type { Paciente } from './data/mockData';
import Medicamentos from './pages/MedicamentosList';
import { subscribeToPatients, syncExcelData, seedFromMockData, addPatient, updatePatient, deletePatient, deletePatientsBatch } from './services/patientService';
import { subscribeToMedicamentos, addMedicamento, updateMedicamento, deleteMedicamento, deleteMedicamentosBatch, seedMedicamentosFromMock } from './services/medicamentoService';
import { subscribeToEntidades, addEntidad, updateEntidad, deleteEntidad, deleteEntidadesBatch, seedEntidadesFromMock, type EntidadInfo } from './services/epsService';
import { subscribeToDespachos } from './services/despachoService';
import type { Despacho } from './data/despachoTypes';
import type { MedicamentoInfo } from './data/medicamentosData';
import Entidades from './pages/Entidades';
import LoginPage from './pages/LoginPage';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Resumen ejecutivo de la cadena de suministro oncológico' },
    pacientes: { title: 'Pacientes', subtitle: 'Gestión y seguimiento de tratamientos orales' },
    medicamentos: { title: 'Gestión de Medicamentos', subtitle: 'Listado y características de medicamentos oncológicos' },
    inventario: { title: 'Inventario', subtitle: 'Control de stock de medicamentos oncológicos' },
    riesgos: { title: 'Evaluación de Riesgos', subtitle: 'Análisis multidimensional de factores de riesgo' },
    simulacion: { title: 'Simulación de Escenarios', subtitle: 'Modelado de estrategias de mitigación' },
    reportes: { title: 'Reportes e Indicadores', subtitle: 'Matriz de control operativo diario' },
    entidades: { title: 'Gestión de Entidades / EPS', subtitle: 'Administración de entidades promotoras de salud' },
    despachos: { title: 'Control de Despachos', subtitle: 'Gestión de hoja de ruta y confirmación de entregas' },
    configuracion: { title: 'Configuración', subtitle: 'Ajustes del sistema' },
};

export default function App() {
    const { user, loading: authLoading } = useAuth();
    const [activePage, setActivePage] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [pacientes, setPacientes] = useState<Paciente[]>(PACIENTES_MOCK);
    const [medicamentos, setMedicamentos] = useState<MedicamentoInfo[]>([]);
    const [entidades, setEntidades] = useState<EntidadInfo[]>([]);
    const [despachos, setDespachos] = useState<Despacho[]>([]);
    const [loading, setLoading] = useState(true);
    const [dbError, setDbError] = useState<string | null>(null);

    const [selectedEps, setSelectedEps] = useState('');
    const [selectedMunicipio, setSelectedMunicipio] = useState('');
    const [selectedMedicamento, setSelectedMedicamento] = useState('');

    const [currentYear, setCurrentYear] = useState(() => {
        const saved = localStorage.getItem('data_year');
        return saved ? parseInt(saved) : new Date().getFullYear();
    });

    const epsList = entidades.length > 0
        ? entidades.filter(e => e.activo).map(e => e.nombre)
        : EPS_LIST; // Fallback to static if loading or none active

    // Subscribe to Firestore real-time updates
    useEffect(() => {
        let seededPatients = false;
        let seededMeds = false;
        let seededEntidades = false;

        const unsubPatients = subscribeToPatients((patients) => {
            if (patients.length === 0 && !seededPatients) {
                seededPatients = true;
                seedFromMockData(PACIENTES_MOCK)
                    .then(() => console.log('✅ Pacientes sembrados'))
                    .catch(err => console.error('Error seeding patients:', err));
            } else if (patients.length > 0) {
                setPacientes(patients);
            }
        });

        const unsubMeds = subscribeToMedicamentos((meds) => {
            if (meds.length === 0 && !seededMeds) {
                seededMeds = true;
                seedMedicamentosFromMock()
                    .then(() => console.log('✅ Medicamentos sembrados'))
                    .catch(err => console.error('Error seeding meds:', err));
            } else if (meds.length > 0) {
                setMedicamentos(meds);
                setLoading(false);
            }
        });

        const unsubEntidades = subscribeToEntidades((data) => {
            if (data.length === 0 && !seededEntidades) {
                seededEntidades = true;
                seedEntidadesFromMock()
                    .then(() => console.log('✅ Entidades sembradas'))
                    .catch(err => console.error('Error seeding entidades:', err));
            } else if (data.length > 0) {
                setEntidades(data);
            }
        });

        // Timeout safeguard
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 8000);

        const unsubDespachos = subscribeToDespachos((data) => {
            setDespachos(data);
        });

        return () => {
            unsubPatients();
            unsubMeds();
            unsubEntidades();
            unsubDespachos();
            clearTimeout(timeout);
        };
    }, []);

    const handleFileUpload = (file: File) => {
        console.log('File uploaded:', file.name);
    };

    const handleDataLoaded = async (newPacientes: Paciente[], year?: number) => {
        try {
            // Sync to Firestore with merge logic
            await syncExcelData(newPacientes, pacientes);
            console.log('✅ Datos sincronizados con Firestore');

            if (year) {
                setCurrentYear(year);
                localStorage.setItem('data_year', String(year));
            }
        } catch (error) {
            console.error('Error syncing to Firestore:', error);
            setDbError('Error al sincronizar datos. Los datos se muestran localmente.');
            // Fallback: update local state even if Firestore fails
            setPacientes(newPacientes);
        }
    };

    const municipiosList = [...new Set(pacientes.map(p => p.municipio))].filter(Boolean).sort();
    const medicamentosList = [...new Set(pacientes.map(p => p.medicamento))].filter(Boolean).sort();
    const alertCount = pacientes.filter(p => p.estado && p.estado.startsWith('IN')).length;

    const pageInfo = PAGE_TITLES[activePage] || PAGE_TITLES.dashboard;

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard':
                return (
                    <Dashboard
                        pacientes={pacientes}
                        onDataLoaded={handleDataLoaded}
                        selectedEps={selectedEps}
                        selectedMunicipio={selectedMunicipio}
                        selectedMedicamento={selectedMedicamento}
                        year={currentYear}
                    />
                );
            case 'pacientes':
                return <Pacientes
                    pacientes={pacientes}
                    onAddPatient={addPatient}
                    onEditPatient={updatePatient}
                    onDeletePatient={deletePatient}
                    onDeleteBatch={deletePatientsBatch}
                    epsList={epsList}
                />;
            case 'medicamentos':
                return <Medicamentos
                    medicamentos={medicamentos}
                    onAddMed={addMedicamento}
                    onEditMed={updateMedicamento}
                    onDeleteMed={deleteMedicamento}
                    onDeleteBatch={deleteMedicamentosBatch}
                />;
            case 'entidades':
                return <Entidades
                    entidades={entidades}
                    onAddEntidad={addEntidad}
                    onEditEntidad={updateEntidad}
                    onDeleteEntidad={deleteEntidad}
                    onDeleteBatch={deleteEntidadesBatch}
                />;
            case 'riesgos':
                return <Riesgos />;
            case 'simulacion':
                return <Simulacion />;
            case 'reportes':
                return <Reportes pacientes={pacientes} />;
            case 'despachos':
                return (
                    <ControlDespachos
                        pacientes={pacientes}
                        despachos={despachos}
                        onRefresh={() => console.log('Despachos refreshed')}
                    />
                );
            default:
                return (
                    <div className="card" style={{ textAlign: 'center', padding: 60 }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
                        <h2 style={{ color: 'var(--gray-700)', marginBottom: 8 }}>{pageInfo.title}</h2>
                        <p style={{ color: 'var(--gray-500)' }}>Módulo en desarrollo</p>
                    </div>
                );
        }
    };

    const handleNavigate = (page: string) => {
        setActivePage(page);
        setSidebarOpen(false); // Close sidebar on mobile after navigation
    };

    if (authLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: '#f8fafc' }}>
                <Loader2 className="animate-spin" size={40} color="var(--primary)" />
                <span style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 500 }}>Cargando sistema...</span>
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    return (
        <div className="app-layout">
            {/* Mobile hamburger toggle */}
            <button
                className={`sidebar-toggle ${sidebarOpen ? 'open' : ''}`}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle menu"
            >
                {sidebarOpen ? '✕' : '☰'}
            </button>

            {/* Mobile overlay */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            <Sidebar activePage={activePage} onNavigate={handleNavigate} sidebarOpen={sidebarOpen} />

            <div className="main-content">
                <Header
                    onDataLoaded={handleDataLoaded}
                    onFileUpload={handleFileUpload}
                    selectedEps={selectedEps}
                    selectedMunicipio={selectedMunicipio}
                    selectedMedicamento={selectedMedicamento}
                    onEpsChange={setSelectedEps}
                    onMunicipioChange={setSelectedMunicipio}
                    onMedicamentoChange={setSelectedMedicamento}
                    epsList={epsList}
                    municipiosList={municipiosList}
                    medicamentosList={medicamentosList}
                    alertCount={alertCount}
                />

                <main className="page-content">
                    <div className="page-title-container" style={{ marginBottom: 20 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)', letterSpacing: '-0.3px' }}>
                            {pageInfo.title}
                        </h2>
                        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
                            {pageInfo.subtitle}
                        </p>
                    </div>
                    {renderPage()}
                </main>
            </div>
        </div>
    );
}
