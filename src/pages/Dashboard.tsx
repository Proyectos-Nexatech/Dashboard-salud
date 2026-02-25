import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Filter, RotateCcw, Download } from 'lucide-react';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip as ChartTooltip, Legend as ChartLegend, PieController, BarController } from 'chart.js';
import type { Paciente } from '../data/mockData';
import { calcularKPIs, ESTADOS_LABELS, parseEntregaProgress } from '../data/mockData';
import KPICards from '../components/KPICards';
import BarChartComponent from '../components/BarChartComponent';
import PopulationPyramid from '../components/PopulationPyramid';
import MapComponent from '../components/MapComponent';
import EPSChart from '../components/EPSChart';
import ConfirmModal from '../components/ConfirmModal';

// Register Chart.js components
Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, ChartTooltip, ChartLegend, PieController, BarController);

// Age group ranges
const AGE_GROUPS = [
    { label: 'Todos', min: 0, max: 150 },
    { label: '0-14', min: 0, max: 14 },
    { label: '15-29', min: 15, max: 29 },
    { label: '30-44', min: 30, max: 44 },
    { label: '45-59', min: 45, max: 59 },
    { label: '60-74', min: 60, max: 74 },
    { label: '75-89', min: 75, max: 89 },
    { label: '90+', min: 90, max: 150 },
];

const MESES = [
    { key: 'enero', label: 'Enero' },
    { key: 'febrero', label: 'Febrero' },
    { key: 'marzo', label: 'Marzo' },
    { key: 'abril', label: 'Abril' },
    { key: 'mayo', label: 'Mayo' },
    { key: 'junio', label: 'Junio' },
    { key: 'julio', label: 'Julio' },
    { key: 'agosto', label: 'Agosto' },
    { key: 'septiembre', label: 'Septiembre' },
    { key: 'octubre', label: 'Octubre' },
    { key: 'noviembre', label: 'Noviembre' },
    { key: 'diciembre', label: 'Diciembre' },
];

// Chart.js color palette
const CHART_COLORS = [
    '#2d60ff', '#05cd99', '#ffce20', '#ee5d50', '#4e54c8',
    '#11cdef', '#f5365c', '#fb6340', '#2dce89', '#5e72e4',
    '#8965e0', '#f4f5f7'
];

interface DashboardProps {
    pacientes: Paciente[];
    selectedEps: string;
    selectedMunicipio: string;
    selectedMedicamento: string;
    year: number;
}

export default function Dashboard({ pacientes, selectedEps, selectedMunicipio, selectedMedicamento, year }: DashboardProps) {
    // ============ DATA_ORIGINAL ============
    const DATA_ORIGINAL = useRef<Paciente[]>(pacientes);
    useEffect(() => { DATA_ORIGINAL.current = pacientes; }, [pacientes]);

    // ============ FILTER STATES ============
    const [filterPaciente, setFilterPaciente] = useState('');
    const [filterSearch, setFilterSearch] = useState('');
    const [filterMedicamento, setFilterMedicamento] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterAgeGroup, setFilterAgeGroup] = useState('Todos');
    const [filterGenero, setFilterGenero] = useState('');
    const [filterMes, setFilterMes] = useState('');
    const [filterMunicipio, setFilterMunicipio] = useState('');

    // Chart refs
    const pieChartRef = useRef<HTMLCanvasElement>(null);
    const barChartRef = useRef<HTMLCanvasElement>(null);
    const pieInstanceRef = useRef<Chart | null>(null);
    const barInstanceRef = useRef<Chart | null>(null);

    // ============ DERIVED LISTS FOR DROPDOWNS ============
    const pacientesList = useMemo(() =>
        [...new Set(pacientes.map(p => p.nombreCompleto))].filter(Boolean).sort(),
        [pacientes]
    );

    const medicamentosList = useMemo(() =>
        [...new Set(pacientes.map(p => p.medicamento))].filter(Boolean).sort(),
        [pacientes]
    );

    const estadosList = useMemo(() =>
        [...new Set(pacientes.map(p => p.estado))].filter(Boolean).sort(),
        [pacientes]
    );

    const municipiosList = useMemo(() =>
        [...new Set(pacientes.map(p => p.municipio))].filter(Boolean).sort(),
        [pacientes]
    );

    const yearsList = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
    }, []);

    // ============ procesarFiltros() ============
    const procesarFiltros = useCallback((): Paciente[] => {
        let result = DATA_ORIGINAL.current;

        // Global filters from Header (EPS, Municipio general, Medicamento general)
        if (selectedEps) result = result.filter(p => p.eps === selectedEps);
        if (selectedMunicipio) result = result.filter(p => p.municipio === selectedMunicipio);
        if (selectedMedicamento) result = result.filter(p => p.medicamento.includes(selectedMedicamento));

        // Dashboard-local filters
        if (filterPaciente) {
            result = result.filter(p => p.nombreCompleto === filterPaciente);
        }

        if (filterSearch) {
            const term = filterSearch.toLowerCase();
            result = result.filter(p =>
                (p.nombreCompleto && p.nombreCompleto.toLowerCase().includes(term)) ||
                (p.numeroId && p.numeroId.toString().includes(term))
            );
        }

        if (filterMedicamento) {
            result = result.filter(p => p.medicamento === filterMedicamento);
        }

        if (filterEstado) {
            result = result.filter(p => p.estado === filterEstado);
        }

        if (filterAgeGroup && filterAgeGroup !== 'Todos') {
            const group = AGE_GROUPS.find(g => g.label === filterAgeGroup);
            if (group) {
                result = result.filter(p => (p.edad || 0) >= group.min && (p.edad || 0) <= group.max);
            }
        }

        if (filterGenero) {
            result = result.filter(p => {
                if (filterGenero === 'M') return p.sexo === 'M' || (!p.sexo && p.id % 2 === 0);
                if (filterGenero === 'F') return p.sexo === 'F' || (!p.sexo && p.id % 2 !== 0);
                return true;
            });
        }

        if (filterMes) {
            result = result.filter(p =>
                p.entregas && p.entregas[filterMes as keyof typeof p.entregas]
            );
        }

        if (filterMunicipio) {
            result = result.filter(p => p.municipio === filterMunicipio);
        }

        return result;
    }, [
        pacientes, selectedEps, selectedMunicipio, selectedMedicamento,
        filterPaciente, filterSearch, filterMedicamento, filterEstado,
        filterAgeGroup, filterGenero, filterMes, filterMunicipio
    ]);

    // ============ FILTERED DATA ============
    const filtered = useMemo(() => procesarFiltros(), [procesarFiltros]);
    const kpis = useMemo(() => calcularKPIs(filtered), [filtered]);

    // ============ ADHERENCIA CALCULATION ============
    const adherenciaPercent = useMemo(() => {
        const activos = filtered.filter(p => p.estado && p.estado.startsWith('AC'));
        if (activos.length === 0) return 0;
        let totalProgress = 0;
        let count = 0;
        activos.forEach(p => {
            const entregas = Object.values(p.entregas || {});
            entregas.forEach(e => {
                const parsed = parseEntregaProgress(e);
                if (parsed.total > 0) {
                    totalProgress += (parsed.actual / parsed.total) * 100;
                    count++;
                }
            });
        });
        return count > 0 ? Math.round(totalProgress / count) : 0;
    }, [filtered]);

    const alertasCount = useMemo(() =>
        filtered.filter(p => p.estado && p.estado.startsWith('IN')).length,
        [filtered]
    );

    // ============ RESET FILTERS ============
    const resetFilters = () => {
        setFilterPaciente('');
        setFilterSearch('');
        setFilterMedicamento('');
        setFilterEstado('');
        setFilterAgeGroup('Todos');
        setFilterGenero('');
        setFilterMes('');
        setFilterMunicipio('');
    };

    const hasActiveFilters = filterPaciente || filterSearch || filterMedicamento || filterEstado ||
        (filterAgeGroup && filterAgeGroup !== 'Todos') || filterGenero || filterMes || filterMunicipio;

    // ============ CHART.JS: PIE (Estado Distribution) ============
    useEffect(() => {
        if (!pieChartRef.current) return;

        // Destroy previous instance
        if (pieInstanceRef.current) {
            pieInstanceRef.current.destroy();
            pieInstanceRef.current = null;
        }

        // Calculate state distribution
        const estadoCounts: Record<string, number> = {};
        filtered.forEach(p => {
            const label = ESTADOS_LABELS[p.estado]?.label || p.estado || 'Desconocido';
            estadoCounts[label] = (estadoCounts[label] || 0) + 1;
        });

        const labels = Object.keys(estadoCounts);
        const data = Object.values(estadoCounts);

        pieInstanceRef.current = new Chart(pieChartRef.current, {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: CHART_COLORS.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 16,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { size: 11, family: "'DM Sans', 'Inter', sans-serif", weight: 600 as any },
                            color: '#a3aed0'
                        }
                    },
                    tooltip: {
                        backgroundColor: '#fff',
                        titleColor: '#2b3674',
                        bodyColor: '#2b3674',
                        borderColor: '#e0e5f2',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 12,
                        titleFont: { size: 13, weight: 'bold' as const },
                        bodyFont: { size: 12 },
                        callbacks: {
                            label: (ctx) => {
                                const total = data.reduce((a, b) => a + b, 0);
                                const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : '0';
                                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });

        return () => {
            if (pieInstanceRef.current) {
                pieInstanceRef.current.destroy();
                pieInstanceRef.current = null;
            }
        };
    }, [filtered]);

    // ============ CHART.JS: BAR (Average Progress per Medication) ============
    useEffect(() => {
        if (!barChartRef.current) return;

        if (barInstanceRef.current) {
            barInstanceRef.current.destroy();
            barInstanceRef.current = null;
        }

        // Calculate average progress per medication
        const medProgress: Record<string, { totalPct: number; count: number }> = {};
        filtered.forEach(p => {
            const medName = p.medicamento ? p.medicamento.split(' X ')[0] : 'Otro';
            if (!medProgress[medName]) medProgress[medName] = { totalPct: 0, count: 0 };

            const entregas = Object.values(p.entregas || {});
            if (entregas.length > 0) {
                const lastEntrega = entregas[entregas.length - 1];
                const parsed = parseEntregaProgress(lastEntrega);
                if (parsed.total > 0) {
                    medProgress[medName].totalPct += (parsed.actual / parsed.total) * 100;
                    medProgress[medName].count++;
                }
            }
        });

        const sortedMeds = Object.entries(medProgress)
            .map(([name, v]) => ({
                name: name.length > 18 ? name.substring(0, 16) + '...' : name,
                avg: v.count > 0 ? Math.round(v.totalPct / v.count) : 0
            }))
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 8);

        barInstanceRef.current = new Chart(barChartRef.current, {
            type: 'bar',
            data: {
                labels: sortedMeds.map(m => m.name),
                datasets: [{
                    label: 'Progreso Promedio (%)',
                    data: sortedMeds.map(m => m.avg),
                    backgroundColor: sortedMeds.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                    borderRadius: 8,
                    borderSkipped: false,
                    barThickness: 28,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: '#f4f7fe' },
                        ticks: {
                            callback: (v) => v + '%',
                            font: { size: 11, family: "'DM Sans', sans-serif" },
                            color: '#a3aed0'
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            font: { size: 11, family: "'DM Sans', sans-serif", weight: '600' as any },
                            color: '#2b3674'
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#fff',
                        titleColor: '#2b3674',
                        bodyColor: '#2b3674',
                        borderColor: '#e0e5f2',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 12,
                        callbacks: {
                            label: (ctx) => ` Progreso: ${ctx.parsed.x}%`
                        }
                    }
                }
            }
        });

        return () => {
            if (barInstanceRef.current) {
                barInstanceRef.current.destroy();
                barInstanceRef.current = null;
            }
        };
    }, [filtered]);

    // ============ EXPORT PDF ============
    // ============ EXPORT PDF ============
    const [showConfirmPDF, setShowConfirmPDF] = useState(false);

    const handleExportPDF = () => {
        setShowConfirmPDF(true);
    };

    const confirmExport = () => {
        setShowConfirmPDF(false);
        // Small delay to allow modal exit animation
        setTimeout(() => {
            window.print();
        }, 300);
    };

    return (
        <div className="fade-in">
            <ConfirmModal
                isOpen={showConfirmPDF}
                onClose={() => setShowConfirmPDF(false)}
                onConfirm={confirmExport}
                title="Generar Reporte PDF"
                message="¿Estás seguro de que deseas generar y descargar el reporte PDF con los datos filtrados actuales?"
                confirmText="Generar PDF"
                type="info"
            />

            {/* ============ PRINT ONLY HEADER ============ */}
            <div className="print-header-container" style={{ display: 'none' }}>
                <div className="print-header-top">
                    <div className="print-logo">
                        <div className="print-logo-icon">DS</div>
                        <div>
                            <div className="print-title">DASHBOARD SALUD</div>
                            <div className="print-subtitle">Reporte Ejecutivo de Gestión</div>
                        </div>
                    </div>
                    <div className="print-meta">
                        <div><strong>Fecha de corte:</strong> {new Date().toLocaleDateString()}</div>
                        <div><strong>Generado:</strong> {new Date().toLocaleTimeString()}</div>
                    </div>
                </div>
                <div className="print-filter-summary">
                    <strong>Filtros aplicados:</strong>{' '}
                    {[
                        selectedEps ? `EPS: ${selectedEps}` : '',
                        filterMedicamento ? `Med: ${filterMedicamento}` : '',
                        filterEstado ? `Est: ${filterEstado}` : '',
                        filterMunicipio ? `Mun: ${filterMunicipio}` : '',
                        !selectedEps && !filterMedicamento && !filterEstado && !filterMunicipio ? 'Ninguno (Vista General)' : ''
                    ].filter(Boolean).join(' | ')}
                </div>
            </div>

            {/* ============ FILTER BAR ============ */}
            <div className="card filter-bar-card" style={{ marginBottom: 24, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Filter size={18} color="var(--primary)" />
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>Filtros Avanzados</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="filter-reset-btn"
                            >
                                <RotateCcw size={14} />
                                Limpiar Filtros
                            </button>
                        )}
                        <button
                            onClick={handleExportPDF}
                            className="btn-primary"
                            style={{
                                padding: '8px 16px',
                                fontSize: 12,
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}
                        >
                            <Download size={14} />
                            Generar PDF
                        </button>
                    </div>
                </div>

                <div className="filter-bar">
                    {/* Patient Dropdown */}
                    <div className="filter-group">
                        <label className="filter-label">Paciente</label>
                        <select
                            className="filter-select"
                            value={filterPaciente}
                            onChange={e => setFilterPaciente(e.target.value)}
                        >
                            <option value="">Todos los pacientes</option>
                            {pacientesList.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search by Name */}
                    <div className="filter-group">
                        <label className="filter-label">Búsqueda</label>
                        <div className="filter-search-input">
                            <Search size={14} color="var(--text-secondary)" />
                            <input
                                type="text"
                                placeholder="Nombre o ID..."
                                value={filterSearch}
                                onChange={e => setFilterSearch(e.target.value)}
                                className="filter-input"
                            />
                        </div>
                    </div>

                    {/* Medication */}
                    <div className="filter-group">
                        <label className="filter-label">Medicamento</label>
                        <select
                            className="filter-select"
                            value={filterMedicamento}
                            onChange={e => setFilterMedicamento(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {medicamentosList.map(med => (
                                <option key={med} value={med}>{med}</option>
                            ))}
                        </select>
                    </div>

                    {/* Estado */}
                    <div className="filter-group">
                        <label className="filter-label">Estado</label>
                        <select
                            className="filter-select"
                            value={filterEstado}
                            onChange={e => setFilterEstado(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {estadosList.map(est => (
                                <option key={est} value={est}>
                                    {ESTADOS_LABELS[est]?.label || est}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Age Group */}
                    <div className="filter-group">
                        <label className="filter-label">Grupo Edad</label>
                        <select
                            className="filter-select"
                            value={filterAgeGroup}
                            onChange={e => setFilterAgeGroup(e.target.value)}
                        >
                            {AGE_GROUPS.map(g => (
                                <option key={g.label} value={g.label}>{g.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Gender */}
                    <div className="filter-group">
                        <label className="filter-label">Género</label>
                        <select
                            className="filter-select"
                            value={filterGenero}
                            onChange={e => setFilterGenero(e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="M">Masculino</option>
                            <option value="F">Femenino</option>
                        </select>
                    </div>

                    {/* Month */}
                    <div className="filter-group">
                        <label className="filter-label">Mes</label>
                        <select
                            className="filter-select"
                            value={filterMes}
                            onChange={e => setFilterMes(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {MESES.map(m => (
                                <option key={m.key} value={m.key}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Municipality (Geographic Distribution) */}
                    <div className="filter-group">
                        <label className="filter-label">Municipio</label>
                        <select
                            className="filter-select"
                            value={filterMunicipio}
                            onChange={e => setFilterMunicipio(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {municipiosList.map(mun => (
                                <option key={mun} value={mun}>{mun}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* ============ RESULTS BADGE ============ */}
            <div className="results-badge-container">
                <span className="results-badge">
                    Resultados encontrados: <strong>{filtered.length}</strong>
                </span>
                {hasActiveFilters && (
                    <span className="results-badge results-badge-secondary">
                        de {pacientes.length} registros totales
                    </span>
                )}
            </div>

            {/* ============ REACTIVE KPIs ============ */}
            <KPICards kpis={kpis} />

            {/* ============ MINI KPI STRIP (Adherencia + Alertas) ============ */}
            <div className="kpi-mini-grid">
                <div className="kpi-mini-card">
                    <div className="kpi-mini-label">% Adherencia</div>
                    <div className="kpi-mini-value" style={{ color: adherenciaPercent >= 70 ? 'var(--success)' : adherenciaPercent >= 40 ? 'var(--warning)' : 'var(--danger)' }}>
                        {adherenciaPercent}%
                    </div>
                    <div className="kpi-mini-bar">
                        <div
                            className="kpi-mini-bar-fill"
                            style={{
                                width: `${Math.min(adherenciaPercent, 100)}%`,
                                background: adherenciaPercent >= 70 ? 'var(--success)' : adherenciaPercent >= 40 ? 'var(--warning)' : 'var(--danger)'
                            }}
                        />
                    </div>
                </div>
                <div className="kpi-mini-card">
                    <div className="kpi-mini-label">Alertas (Inactivos)</div>
                    <div className="kpi-mini-value" style={{ color: alertasCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {alertasCount}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                        pacientes con estado inactivo
                    </div>
                </div>
                <div className="kpi-mini-card">
                    <div className="kpi-mini-label">Medicamentos Únicos</div>
                    <div className="kpi-mini-value" style={{ color: 'var(--primary)' }}>
                        {[...new Set(filtered.map(p => p.medicamento))].filter(Boolean).length}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                        en el segmento filtrado
                    </div>
                </div>
            </div>

            {/* ============ SECTION TITLE ============ */}
            <div className="section-title" style={{ marginTop: 32, marginBottom: 16 }}>
                Resumen Ejecutivo {year}
            </div>

            {/* ============ CHART.JS CHARTS ============ */}
            <div className="charts-grid" style={{ marginBottom: 24 }}>
                <div className="card" style={{ padding: 24 }}>
                    <div className="card-header" style={{ marginBottom: 16 }}>
                        <div>
                            <div className="card-title">Distribución de Estados</div>
                            <div className="card-subtitle">Segmento filtrado actual</div>
                        </div>
                    </div>
                    <div style={{ height: 280, position: 'relative' }}>
                        <canvas ref={pieChartRef}></canvas>
                    </div>
                </div>

                <div className="card" style={{ padding: 24 }}>
                    <div className="card-header" style={{ marginBottom: 16 }}>
                        <div>
                            <div className="card-title">Progreso por Medicamento</div>
                            <div className="card-subtitle">Promedio de entregas completadas</div>
                        </div>
                    </div>
                    <div style={{ height: 280, position: 'relative' }}>
                        <canvas ref={barChartRef}></canvas>
                    </div>
                </div>
            </div>

            {/* ============ EXISTING RECHARTS ============ */}
            <div className="dashboard-grid">
                <BarChartComponent pacientes={filtered} />
                <PopulationPyramid pacientes={filtered} />
                <EPSChart pacientes={filtered} />
            </div>

            {/* Geographic Distribution Map */}
            <div style={{ marginTop: 24, height: 420 }}>
                <MapComponent pacientes={filtered} />
            </div>

            {/* ============ PRINT ONLY FOOTER ============ */}
            <div className="print-footer" style={{ display: 'none' }}>
                <p>© {new Date().getFullYear()} Dashboard Salud - Documento Confidencial. Uso exclusivo autorizado.</p>
            </div>
        </div>
    );
}
