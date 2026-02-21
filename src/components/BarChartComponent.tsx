import { useState, useMemo } from 'react';
import { Truck, Pill, ExternalLink } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer
} from 'recharts';
import { Paciente, calcularDatosGraficas } from '../data/mockData';

// Theme Colors for Charts
const COLORS = {
    primary: '#2d60ff',
    secondary: '#eff4ff',
    accent: '#4e54c8',
    success: '#05cd99',
    warning: '#ffce20',
    danger: '#ee5d50',
    gray: '#a3aed0',
    charts: ['#2d60ff', '#4e54c8', '#05cd99', '#ffce20', '#ee5d50']
};

export default function BarChartComponent({ pacientes }: { pacientes: Paciente[] }) {
    const [view, setView] = useState<'entregas' | 'medicamentos'>('entregas');

    // Calcular datos dinámicamente cada vez que cambia 'pacientes'
    const { entregasData, medicamentosData } = useMemo(() => calcularDatosGraficas(pacientes), [pacientes]);

    // Obtener claves dinámicas para la gráfica de medicamentos
    const medKeys = medicamentosData.length > 0
        ? Object.keys(medicamentosData[0]).filter(k => k !== 'mes')
        : [];

    return (
        <div className="card fade-in-delay-2" style={{ height: '100%' }}>
            <div className="card-header">
                <div>
                    <div className="card-title">Entregas por Mes</div>
                    <div className="card-subtitle">Seguimiento mensual de tratamientos orales</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div className="toggle-group" style={{ display: 'flex', gap: 8 }}>
                        <button
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 12, background: view === 'entregas' ? 'var(--primary)' : 'transparent', color: view === 'entregas' ? 'white' : 'var(--text-secondary)', boxShadow: 'none' }}
                            onClick={() => setView('entregas')}
                            title="Ver Entregas"
                        >
                            <Truck size={14} style={{ marginRight: 4, display: 'inline' }} /> Entregas
                        </button>
                        <button
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 12, background: view === 'medicamentos' ? 'var(--primary)' : 'transparent', color: view === 'medicamentos' ? 'white' : 'var(--text-secondary)', boxShadow: 'none' }}
                            onClick={() => setView('medicamentos')}
                            title="Ver Medicamentos"
                        >
                            <Pill size={14} style={{ marginRight: 4, display: 'inline' }} /> Medicamentos
                        </button>
                    </div>
                    <button className="card-action"><ExternalLink size={14} /></button>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={240}>
                {view === 'entregas' ? (
                    <BarChart data={entregasData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="mes"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#a3aed0', fontSize: 12, fontWeight: 500 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#a3aed0', fontSize: 12, fontWeight: 500 }}
                        />
                        <Tooltip
                            cursor={{ fill: '#f4f7fe' }}
                            contentStyle={{
                                borderRadius: '16px',
                                border: 'none',
                                boxShadow: '0 10px 30px rgba(112, 144, 176, 0.2)',
                                padding: '12px 16px'
                            }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                        <Bar
                            dataKey="entregadas"
                            name="Entregadas"
                            fill="#2d60ff"  // Primary Blue
                            radius={[6, 6, 0, 0]}
                            barSize={16}
                        />
                        <Bar
                            dataKey="pendientes"
                            name="Pendientes"
                            fill="#cbd5e1" // Gray
                            radius={[6, 6, 0, 0]}
                            barSize={16}
                        />
                    </BarChart>
                ) : (
                    <BarChart data={medicamentosData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                        <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6c757d' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#6c757d' }} axisLine={false} tickLine={false} />
                        <Tooltip
                            cursor={{ fill: '#f4f7fe' }}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(112, 144, 176, 0.2)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                        {medKeys.map((key, index) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                name={key.charAt(0).toUpperCase() + key.slice(1)}
                                stackId="a"
                                fill={COLORS.charts[index % COLORS.charts.length]}
                                radius={index === medKeys.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                            />
                        ))}
                    </BarChart>
                )}
            </ResponsiveContainer>
        </div>
    );
}
