import { useState } from 'react';
import { Play, TrendingDown, TrendingUp, RefreshCw } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

const generateScenario = (strategy: string) => {
    const base = [
        { mes: 'Ene', actual: 78.8, mitigado: 78.8 },
        { mes: 'Feb', actual: 76.2, mitigado: 79.5 },
        { mes: 'Mar', actual: 72.1, mitigado: 81.2 },
        { mes: 'Abr', actual: 69.5, mitigado: 83.0 },
        { mes: 'May', actual: 71.3, mitigado: 85.4 },
        { mes: 'Jun', actual: 68.0, mitigado: 87.1 },
    ];

    const multipliers: Record<string, number> = {
        stock: 1.15,
        proveedor: 1.08,
        financiero: 1.12,
        combinado: 1.20,
    };

    const m = multipliers[strategy] || 1.1;
    return base.map(d => ({ ...d, mitigado: Math.min(d.mitigado * m, 99) }));
};

export default function Simulacion() {
    const [strategy, setStrategy] = useState('stock');
    const [running, setRunning] = useState(false);
    const [data, setData] = useState(generateScenario('stock'));

    const strategies = [
        { id: 'stock', label: 'Política de Stock de Seguridad', desc: 'Mantener 3 meses de inventario mínimo para principios activos críticos', impact: '+15% nivel servicio' },
        { id: 'proveedor', label: 'Diversificación de Proveedores', desc: 'Incorporar al menos 2 proveedores alternativos por medicamento crítico', impact: '+8% resiliencia' },
        { id: 'financiero', label: 'Fondo de Contingencia', desc: 'Reserva financiera del 20% del presupuesto para compras de emergencia', impact: '-30% sobrecostos' },
        { id: 'combinado', label: 'Estrategia Combinada', desc: 'Implementación simultánea de las tres estrategias anteriores', impact: '+25% nivel servicio' },
    ];

    const runSimulation = () => {
        setRunning(true);
        setTimeout(() => {
            setData(generateScenario(strategy));
            setRunning(false);
        }, 1200);
    };

    const selected = strategies.find(s => s.id === strategy);

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
                {/* Strategy selector */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Estrategias de Mitigación</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {strategies.map(s => (
                            <div
                                key={s.id}
                                onClick={() => setStrategy(s.id)}
                                style={{
                                    padding: 16, borderRadius: 20, cursor: 'pointer',
                                    border: `2px solid ${strategy === s.id ? 'var(--primary)' : 'var(--gray-200)'}`,
                                    background: strategy === s.id ? 'var(--primary-light)' : 'white',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ fontSize: 13, fontWeight: 700, color: strategy === s.id ? 'var(--primary)' : 'var(--text-main)', marginBottom: 4 }}>
                                    {s.label}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>{s.desc}</div>
                                <span style={{
                                    fontSize: 10, fontWeight: 700, color: 'var(--primary)',
                                    background: 'white', padding: '4px 10px', borderRadius: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}>
                                    {s.impact}
                                </span>
                            </div>
                        ))}
                    </div>

                    <button
                        className="upload-btn"
                        style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
                        onClick={runSimulation}
                        disabled={running}
                    >
                        {running ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={15} />}
                        {running ? 'Simulando...' : 'Ejecutar Simulación'}
                    </button>
                </div>

                {/* Results */}
                <div>
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="card-header">
                            <div>
                                <div className="card-title">Nivel de Servicio: Actual vs. Estrategia Mitigada</div>
                                <div className="card-subtitle">{selected?.label}</div>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={data} margin={{ top: 4, right: 20, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6c757d' }} axisLine={false} tickLine={false} />
                                <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: '#6c757d' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: 16, fontSize: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }} formatter={(v: number) => [`${v.toFixed(1)}%`]} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Objetivo 80%', fontSize: 11, fill: '#f59e0b' }} />
                                <Line type="monotone" dataKey="actual" name="Riesgo Actual" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 0 }} />
                                <Line type="monotone" dataKey="mitigado" name="Con Estrategia" stroke="#05cd99" strokeWidth={3} dot={{ r: 4, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Impact summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                        {[
                            { label: 'Mejora Nivel Servicio', value: selected?.impact || '', icon: TrendingUp, color: 'green' },
                            { label: 'Reducción Sobrecostos', value: strategy === 'financiero' || strategy === 'combinado' ? '-30%' : '-12%', icon: TrendingDown, color: 'blue' },
                            { label: 'Pacientes Beneficiados', value: strategy === 'combinado' ? '~170' : '~120', icon: TrendingUp, color: 'amber' },
                        ].map((item, i) => (
                            <div key={i} className="card" style={{ textAlign: 'center', padding: 20 }}>
                                <div className={`kpi-icon ${item.color}`} style={{ margin: '0 auto 12px' }}>
                                    <item.icon size={20} />
                                </div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-900)' }}>{item.value}</div>
                                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
