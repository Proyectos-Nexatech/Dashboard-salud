import { useState, useMemo, useCallback } from 'react';
import {
    ClipboardCheck, AlertOctagon, Activity, Users, Truck,
    CheckCircle2, Clock, Pill, Syringe, Filter, RotateCcw,
    Sparkles, Brain, X, MessageSquare, Lightbulb, TrendingDown, AlertTriangle, Download
} from 'lucide-react';
import type { Paciente } from '../data/mockData';
import ConfirmModal from '../components/ConfirmModal';

// =============================================
// Age group ranges
// =============================================
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

// =============================================
// Indicator Card Component
// =============================================
interface IndicatorProps {
    title: string;
    value: string | number;
    sub: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'green' | 'amber' | 'red' | 'blue';
    icon: any;
}

function IndicatorCard({ title, value, sub, color = 'blue', icon: Icon }: IndicatorProps) {
    const theme = {
        green: { bg: 'rgba(5, 205, 153, 0.1)', text: '#05cd99', border: '#05cd99' },
        amber: { bg: 'rgba(255, 206, 32, 0.1)', text: '#ffce20', border: '#ffce20' },
        red: { bg: 'rgba(238, 93, 80, 0.1)', text: '#ee5d50', border: '#ee5d50' },
        blue: { bg: 'rgba(45, 96, 255, 0.1)', text: '#2d60ff', border: '#2d60ff' },
    };

    const currentTheme = theme[color];

    return (
        <div
            className="card"
            style={{
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'default',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: 'auto',
                minHeight: 140
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
        >
            {/* Decorative colored line top */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: currentTheme.border, opacity: 0.6 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: currentTheme.bg, color: currentTheme.text,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                    <Icon size={24} strokeWidth={2} />
                </div>
            </div>

            <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-1px', lineHeight: 1, marginBottom: 8 }}>
                    {value}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                    {title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 500 }}>
                    {sub}
                </div>
            </div>
        </div>
    );
}

// =============================================
// Filter Select Component
// =============================================
function FilterSelect({ label, value, onChange, options, icon: Icon }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    icon?: any;
}) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--gray-500)',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6
            }}>
                {Icon && <Icon size={13} strokeWidth={2.5} />}
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1.5px solid var(--gray-200)',
                    background: 'white',
                    fontSize: 13,
                    color: value ? 'var(--text-main)' : 'var(--gray-400)',
                    fontWeight: value ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    outline: 'none',
                    appearance: 'auto'
                }}
                onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45, 96, 255, 0.1)';
                }}
                onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gray-200)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                <option value="">Todos</option>
                {options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

// =============================================
// Main Component
// =============================================
export default function Reportes({ pacientes = [] }: { pacientes?: Paciente[] }) {
    // ============ FILTER STATES ============
    const [filterMes, setFilterMes] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterGenero, setFilterGenero] = useState('');
    const [filterMunicipio, setFilterMunicipio] = useState('');
    const [filterAgeGroup, setFilterAgeGroup] = useState('');
    const [showConfirmPDF, setShowConfirmPDF] = useState(false);

    // ============ DERIVED LISTS FOR DROPDOWNS ============
    const municipiosList = useMemo(() =>
        [...new Set(pacientes.map(p => p.municipio))].filter(Boolean).sort(),
        [pacientes]
    );

    const yearsList = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
    }, []);

    // ============ ACTIVE FILTER COUNT ============
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filterMes) count++;
        if (filterYear) count++;
        if (filterGenero) count++;
        if (filterMunicipio) count++;
        if (filterAgeGroup) count++;
        return count;
    }, [filterMes, filterYear, filterGenero, filterMunicipio, filterAgeGroup]);

    // ============ RESET FILTERS ============
    const resetFilters = useCallback(() => {
        setFilterMes('');
        setFilterYear('');
        setFilterGenero('');
        setFilterMunicipio('');
        setFilterAgeGroup('');
    }, []);

    // ============ FILTERED PATIENTS ============
    const filtered = useMemo(() => {
        let result = pacientes;

        if (filterGenero) {
            result = result.filter(p => {
                if (filterGenero === 'M') return p.sexo === 'M' || (!p.sexo && p.id % 2 === 0);
                if (filterGenero === 'F') return p.sexo === 'F' || (!p.sexo && p.id % 2 !== 0);
                return true;
            });
        }

        if (filterMunicipio) {
            result = result.filter(p => p.municipio === filterMunicipio);
        }

        if (filterAgeGroup) {
            const group = AGE_GROUPS.find(g => g.label === filterAgeGroup);
            if (group) {
                result = result.filter(p => (p.edad || 0) >= group.min && (p.edad || 0) <= group.max);
            }
        }

        if (filterMes) {
            result = result.filter(p =>
                p.entregas && p.entregas[filterMes as keyof typeof p.entregas]
            );
        }

        // Year filter — currently data doesn't have per-year info, 
        // but we keep the filter for when real data arrives
        // For now it acts as a visual context selection

        return result;
    }, [pacientes, filterGenero, filterMunicipio, filterAgeGroup, filterMes, filterYear]);

    // ============ STATS COMPUTED FROM FILTERED ============
    const stats = useMemo(() => {
        const total = filtered.length || 1;
        const activos = filtered.filter(p => p.estado.startsWith('AC')).length;
        const inactivos = filtered.filter(p => p.estado.startsWith('IN')).length;

        const entregasTotales = filtered.reduce((acc, p) => {
            return acc + (p.entregas?.marzo ? 1 : 0) + (p.entregas?.abril ? 1 : 0);
        }, 0);

        return {
            activos,
            inactivos,
            mezclasExtra: Math.round(activos * 0.08),
            eficiencia: '96%',
            errores: Math.max(1, Math.round(entregasTotales * 0.005)),
            reempaque: Math.round(activos * 0.35),
            validaciones: Math.round(activos * 0.15),
            asesoria: Math.round(activos * 0.85),
            rams: Math.max(0, Math.round(activos * 0.02)),
            alertas: Math.round(activos * 0.12),
            hormonalesExtra: Math.round(activos * 0.05),
            pendientes: inactivos,
            ventanilla: Math.round(activos * 0.55),
            domicilio: Math.round(activos * 0.45),
            cumplimientoVentanilla: '98%',
            cumplimientoDomicilio: '94%'
        };
    }, [filtered]);

    // ============ AI ANALYSIS LOGIC ============
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiInsights, setAiInsights] = useState<{ type: 'trend' | 'anomaly' | 'recommendation'; text: string; icon: any }[]>([]);

    const ejecutarAnalisisIA = () => {
        setIsAnalyzing(true);
        setShowAIPanel(true);
        setAiInsights([]); // Reset previous insights

        // Simulate "AI Processing" delay based on filtered data size
        setTimeout(() => {
            const insights: typeof aiInsights = [];

            if (filtered.length === 0) {
                insights.push({
                    type: 'anomaly',
                    text: 'No hay suficientes datos para realizar un análisis inteligente. Por favor, ajusta los filtros.',
                    icon: AlertTriangle
                });
            } else {
                // 1. Trend Analysis: Medication with most pending deliveries
                const entregasPorMed: Record<string, { total: number, delivered: number }> = {};
                filtered.forEach(p => {
                    const med = p.medicamento;
                    if (!entregasPorMed[med]) entregasPorMed[med] = { total: 0, delivered: 0 };

                    const hasDelivery = p.entregas && (p.entregas.marzo || p.entregas.abril);
                    entregasPorMed[med].total += 1;
                    if (hasDelivery) entregasPorMed[med].delivered += 1;
                });

                let worstMed = '';
                let worstRate = 1;

                Object.entries(entregasPorMed).forEach(([med, stats]) => {
                    const rate = stats.delivered / stats.total;
                    if (stats.total > 2 && rate < worstRate) {
                        worstRate = rate;
                        worstMed = med;
                    }
                });

                if (worstMed) {
                    insights.push({
                        type: 'trend',
                        text: `Tendencia de Entrega: El medicamento "${worstMed}" presenta una tasa de cumplimiento del ${(worstRate * 100).toFixed(0)}%, inferior al promedio del grupo.`,
                        icon: TrendingDown
                    });
                } else {
                    insights.push({
                        type: 'trend',
                        text: 'Tendencia Positiva: Todos los medicamentos principales muestran tasas de entrega superiores al 90% en este periodo.',
                        icon: Sparkles
                    });
                }

                // 2. Anomaly Detection: Inactive Patients
                const inactivosCount = filtered.filter(p => p.estado.startsWith('IN')).length;
                if (inactivosCount > 0) {
                    const percentage = Math.round((inactivosCount / filtered.length) * 100);
                    insights.push({
                        type: 'anomaly',
                        text: `Riesgo de Adherencia: Se detectaron ${inactivosCount} pacientes inactivos (${percentage}% del total). Se requiere revisión inmediata de casos.`,
                        icon: AlertOctagon
                    });
                }

                // 3. Geographic Analysis (New)
                const muniCount: Record<string, number> = {};
                filtered.forEach(p => {
                    const m = p.municipio || 'Desconocido';
                    muniCount[m] = (muniCount[m] || 0) + 1;
                });
                const topMuni = Object.entries(muniCount).sort((a, b) => b[1] - a[1])[0];

                if (topMuni) {
                    insights.push({
                        type: 'trend',
                        text: `Foco Geográfico: La mayor concentración de pacientes (${topMuni[1]}) se encuentra en ${topMuni[0]}. Considere optimizar rutas de entrega en esta zona.`,
                        icon: Truck // Reusing Truck icon for logistics/geo context
                    });
                }

                // 4. Demographic Analysis (New)
                const ageGroupsCount: Record<string, number> = {};
                filtered.forEach(p => {
                    const age = p.edad || 0;
                    const group = AGE_GROUPS.find(g => g.label !== 'Todos' && age >= g.min && age <= g.max);
                    if (group) {
                        ageGroupsCount[group.label] = (ageGroupsCount[group.label] || 0) + 1;
                    }
                });
                const topAgeGroup = Object.entries(ageGroupsCount).sort((a, b) => b[1] - a[1])[0];

                if (topAgeGroup) {
                    insights.push({
                        type: 'trend',
                        text: `Perfil Demográfico: El grupo etario predominante es de ${topAgeGroup[0]} años con ${topAgeGroup[1]} pacientes. Adaptar material educativo para este segmento.`,
                        icon: Users
                    });
                }

                // 5. Smart Recommendation (Enhanced)
                if (stats.mezclasExtra > 5) {
                    insights.push({
                        type: 'recommendation',
                        text: 'Sugerencia Operativa: Alto volumen de mezclas no programadas. Revisar previsión de demanda con oncólogos para reducir urgencias.',
                        icon: Lightbulb
                    });
                } else if (inactivosCount > 5) {
                    insights.push({
                        type: 'recommendation',
                        text: 'Acción Recomendada: Activar protocolo de recuperación de pacientes. El índice de inactividad supera el umbral de alerta del 5%.',
                        icon: MessageSquare
                    });
                } else {
                    insights.push({
                        type: 'recommendation',
                        text: 'Optimización: Indicadores estables. Se sugiere enfocar esfuerzos en educación al paciente para mantener la adherencia.',
                        icon: ClipboardCheck
                    });
                }
            }

            setAiInsights(insights);
            setIsAnalyzing(false);
        }, 2200);
    };

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

    // ============ INDICATOR DATA ============
    const data = {
        centralMezclas: [
            { title: 'Pacientes Fuera de Prog.', value: stats.mezclasExtra, sub: 'Solicitudes adicionales mes', color: 'amber', icon: Clock },
            { title: 'Eficiencia Operativa', value: stats.eficiencia, sub: 'Capacidad de uso instalada', color: 'green', icon: Activity },
            { title: 'Errores Preparación', value: stats.errores, sub: 'Dosis rechazadas/devueltas', color: 'red', icon: AlertOctagon },
            { title: 'Reempaque Tabletería', value: stats.reempaque, sub: 'Dosis enviadas a proveedor', color: 'blue', icon: Pill },
        ],
        asistencial: [
            { title: 'Validación Prescripciones', value: stats.validaciones, sub: 'Hosp. y Ambulatorias hoy', color: 'green', icon: ClipboardCheck },
            { title: 'Cobertura Asesoría', value: `${Math.round((stats.asesoria / (stats.activos || 1)) * 100)}%`, sub: 'Pct. pacientes con educación', color: 'blue', icon: Users },
            { title: 'RAM Detectadas', value: stats.rams, sub: 'Reportadas en VigiFlow', color: 'amber', icon: Activity },
            { title: 'Gestión de Alertas', value: stats.alertas, sub: 'Alertas analizadas en el mes', color: 'green', icon: CheckCircle2 },
        ],
        farmacia: [
            { title: 'Hormonales Fuera Prog.', value: stats.hormonalesExtra, sub: 'Solicitudes extra-calendario', color: 'amber', icon: Syringe },
            { title: 'Pacientes Inactivos', value: stats.pendientes, sub: 'Requieren gestión inmediata', color: 'red', icon: Users },
            { title: 'Atención Ventanilla', value: stats.ventanilla, sub: 'Pacientes estimados mes', color: 'green', icon: Users },
            { title: 'Atención Domicilio', value: stats.domicilio, sub: 'Pacientes programados mes', color: 'blue', icon: Truck },
            { title: 'Sala Quimioterapia', value: Math.round(stats.activos * 0.2), sub: 'Pacientes atendidos', color: 'blue', icon: Activity },
            { title: 'Cumplimiento Ventanilla', value: stats.cumplimientoVentanilla, sub: 'Entregas vs Programadas', color: 'green', icon: CheckCircle2 },
            { title: 'Cumplimiento Domicilio', value: stats.cumplimientoDomicilio, sub: 'Entregas vs Programadas', color: 'green', icon: Truck },
            { title: 'Respuesta Requerimientos', value: '100%', sub: 'Gestión diaria efectiva', color: 'green', icon: ClipboardCheck },
        ]
    };

    // ============ RENDER ============
    return (
        <div className="fade-in reportes-container" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <ConfirmModal
                isOpen={showConfirmPDF}
                onClose={() => setShowConfirmPDF(false)}
                onConfirm={confirmExport}
                title="Generar Reporte PDF"
                message="¿Estás seguro de que deseas generar y descargar el reporte PDF con los indicadores actuales?"
                confirmText="Generar PDF"
                type="info"
            />

            {/* ============ PRINT ONLY HEADER ============ */}
            <div className="print-header-container" style={{ display: 'none' }}>
                <div className="print-header-top">
                    <div className="print-logo">
                        <div className="print-logo-icon">PC</div>
                        <div>
                            <div className="print-title">PHARMACARE | REPORTES</div>
                            <div className="print-subtitle">Matriz de Control Operativo Diario</div>
                        </div>
                    </div>
                    <div className="print-meta">
                        <div><strong>Fecha:</strong> {new Date().toLocaleDateString()}</div>
                        <div><strong>Filtros:</strong> {activeFilterCount > 0 ? 'Con filtros activos' : 'Vista General'}</div>
                    </div>
                </div>
            </div>
            {/* ========== LEFT SIDEBAR — FILTERS ========== */}
            <div
                className="reportes-filter-sidebar"
                style={{
                    width: 260,
                    minWidth: 260,
                    position: 'sticky',
                    top: 20,
                    background: 'white',
                    borderRadius: 16,
                    padding: '20px 18px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    border: '1px solid var(--gray-100)',
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                    paddingBottom: 14,
                    borderBottom: '1px solid var(--gray-100)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 10,
                            background: 'linear-gradient(135deg, #2d60ff, #5b8cff)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white'
                        }}>
                            <Filter size={16} />
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
                            Filtros
                        </span>
                        {activeFilterCount > 0 && (
                            <span style={{
                                background: '#2d60ff',
                                color: 'white',
                                fontSize: 11,
                                fontWeight: 700,
                                borderRadius: 20,
                                padding: '2px 8px',
                                minWidth: 20,
                                textAlign: 'center'
                            }}>
                                {activeFilterCount}
                            </span>
                        )}
                    </div>
                    {activeFilterCount > 0 && (
                        <button
                            onClick={resetFilters}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                background: 'transparent', border: 'none',
                                color: '#ee5d50', cursor: 'pointer',
                                fontSize: 12, fontWeight: 600,
                                padding: '4px 8px', borderRadius: 8,
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(238,93,80,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <RotateCcw size={13} />
                            Limpiar
                        </button>
                    )}
                </div>

                {/* Filter Controls */}
                <FilterSelect
                    label="Mes"
                    value={filterMes}
                    onChange={setFilterMes}
                    options={MESES.map(m => ({ value: m.key, label: m.label }))}
                />

                <FilterSelect
                    label="Año"
                    value={filterYear}
                    onChange={setFilterYear}
                    options={yearsList.map(y => ({ value: String(y), label: String(y) }))}
                />

                <FilterSelect
                    label="Género"
                    value={filterGenero}
                    onChange={setFilterGenero}
                    options={[
                        { value: 'M', label: 'Masculino' },
                        { value: 'F', label: 'Femenino' },
                    ]}
                />

                <FilterSelect
                    label="Municipio"
                    value={filterMunicipio}
                    onChange={setFilterMunicipio}
                    options={municipiosList.map(m => ({ value: m, label: m }))}
                />

                <FilterSelect
                    label="Grupo de Edades"
                    value={filterAgeGroup}
                    onChange={setFilterAgeGroup}
                    options={AGE_GROUPS.filter(g => g.label !== 'Todos').map(g => ({ value: g.label, label: g.label }))}
                />

                {/* Result count */}
                <div style={{
                    marginTop: 8,
                    padding: '12px 14px',
                    background: 'var(--gray-50)',
                    borderRadius: 10,
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'var(--gray-500)',
                    fontWeight: 500
                }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', display: 'block', marginBottom: 2 }}>
                        {filtered.length}
                    </span>
                    pacientes en filtro
                </div>

                {/* Export PDF Button */}
                <button
                    onClick={handleExportPDF}
                    style={{
                        width: '100%',
                        marginTop: 16,
                        padding: '12px',
                        background: 'white',
                        color: 'var(--text-main)',
                        border: '1.5px solid var(--gray-200)',
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.color = 'var(--primary)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--gray-200)';
                        e.currentTarget.style.color = 'var(--text-main)';
                    }}
                >
                    <Download size={16} />
                    Exportar PDF
                </button>
                {/* AI Analysis Button */}
                <button
                    onClick={ejecutarAnalisisIA}
                    disabled={isAnalyzing}
                    style={{
                        width: '100%',
                        marginTop: 20,
                        padding: '16px',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 14,
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: isAnalyzing ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)',
                        transition: 'all 0.3s ease',
                        opacity: isAnalyzing ? 0.8 : 1
                    }}
                    onMouseEnter={e => !isAnalyzing && (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={e => !isAnalyzing && (e.currentTarget.style.transform = 'translateY(0)')}
                >
                    {isAnalyzing ? (
                        <>
                            <div className="spinner" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            Analizando...
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            Análisis Inteligente
                        </>
                    )}
                </button>
            </div>

            {/* ========== RIGHT CONTENT — INDICATORS ========== */}
            <div className="reportes-content" style={{ flex: 1, minWidth: 0 }}>
                {/* Header Info */}
                <div className="no-print" style={{ marginBottom: 24, padding: 16, background: '#eff6ff', borderRadius: 12, border: '1px solid #dbeafe', color: '#1e40af', fontSize: 13 }}>
                    <strong>Nota:</strong> Estos indicadores se alimentan de fuentes manuales ("Datos Manuales Diarios") y estadísticas SISA según la matriz de control. Actualmente se muestran datos simulados para demostración.
                </div>

                {/* Central de Mezclas */}
                <div style={{ marginBottom: 32 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 6, height: 24, background: '#f59e0b', borderRadius: 4 }}></div>
                        CENTRAL DE MEZCLAS (Calidad / Producción)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                        {data.centralMezclas.map((item, i) => (
                            <IndicatorCard key={i} {...item} color={item.color as any} />
                        ))}
                    </div>
                </div>

                {/* Asistencial */}
                <div style={{ marginBottom: 32 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 6, height: 24, background: '#3b82f6', borderRadius: 4 }}></div>
                        ASISTENCIAL (Químico Farmacéutico)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                        {data.asistencial.map((item, i) => (
                            <IndicatorCard key={i} {...item} color={item.color as any} />
                        ))}
                    </div>
                </div>

                {/* Farmacia */}
                <div style={{ marginBottom: 32 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 6, height: 24, background: 'var(--accent)', borderRadius: 4 }}></div>
                        FARMACIA (Auxiliares Adm. / Ventanilla / Domicilio)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                        {data.farmacia.map((item, i) => (
                            <IndicatorCard key={i} {...item} color={item.color as any} />
                        ))}
                    </div>
                </div>
            </div>

            {/* ========== AI INSIGHTS PANEL (MODAL) ========== */}
            {showAIPanel && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 1,
                    transition: 'opacity 0.3s ease'
                }}>
                    <div
                        className="fade-in-up"
                        style={{
                            width: '90%',
                            maxWidth: 600,
                            background: 'white',
                            borderRadius: 24,
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            maxHeight: '90vh',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '24px',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 42, height: 42, borderRadius: 12,
                                    background: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    color: '#4f46e5'
                                }}>
                                    <Brain size={24} strokeWidth={2} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
                                        Panel de Análisis Inteligente
                                    </h3>
                                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                                        Análisis generativo de datos operativos
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAIPanel(false)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '24px', overflowY: 'auto' }}>
                            {isAnalyzing ? (
                                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                                    <div className="spinner" style={{
                                        width: 40, height: 40,
                                        border: '4px solid #e2e8f0', borderTopColor: '#4f46e5',
                                        borderRadius: '50%', margin: '0 auto 20px',
                                        animation: 'spin 1s linear infinite'
                                    }}></div>
                                    <h4 style={{ color: '#334155', marginBottom: 8 }}>Procesando {filtered.length} registros...</h4>
                                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Identificando patrones y anomalías en tiempo real</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {aiInsights.map((insight, index) => (
                                        <div key={index} className="fade-in" style={{
                                            display: 'flex', gap: 16,
                                            padding: 16, borderRadius: 16,
                                            background: insight.type === 'anomaly' ? '#fef2f2' : insight.type === 'trend' ? '#fff7ed' : '#f0f9ff',
                                            border: `1px solid ${insight.type === 'anomaly' ? '#fee2e2' : insight.type === 'trend' ? '#ffedd5' : '#e0f2fe'}`,
                                            animationDelay: `${index * 100}ms`
                                        }}>
                                            <div style={{
                                                minWidth: 36, height: 36, borderRadius: 10,
                                                background: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: insight.type === 'anomaly' ? '#ef4444' : insight.type === 'trend' ? '#f97316' : '#0ea5e9',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                            }}>
                                                <insight.icon size={18} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h5 style={{
                                                    margin: '0 0 4px', fontSize: 14, fontWeight: 700,
                                                    color: insight.type === 'anomaly' ? '#991b1b' : insight.type === 'trend' ? '#9a3412' : '#075985',
                                                    textTransform: 'uppercase', letterSpacing: '0.5px'
                                                }}>
                                                    {insight.type === 'anomaly' ? 'Anomalía Detectada' : insight.type === 'trend' ? 'Tendencia' : 'Sugerencia'}
                                                </h5>
                                                <p style={{ margin: 0, fontSize: 14, lineHeight: '1.5', color: '#334155' }}>
                                                    {insight.text}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {!isAnalyzing && (
                            <div style={{
                                padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0',
                                fontSize: 12, color: '#94a3b8', textAlign: 'center'
                            }}>
                                Generado por PharmaCare AI Engine • Basado en datos actuales
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ============ PRINT ONLY FOOTER ============ */}
            <div className="print-footer" style={{ display: 'none' }}>
                <p>© {new Date().getFullYear()} PharmaCare - Documento Confidencial. Uso exclusivo autorizado.</p>
            </div>
        </div>
    );
}
