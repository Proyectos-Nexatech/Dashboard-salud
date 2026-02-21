
import { Users, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { KPIData } from '../data/mockData';

export default function KPICards({ kpis }: { kpis: KPIData }) {
    const totalPob = (kpis.poblacionHombres || 0) + (kpis.poblacionMujeres || 0);
    // Usar un decimal para mayor precisión
    const pctH = totalPob > 0 ? ((kpis.poblacionHombres / totalPob) * 100).toFixed(1) : '0';
    const pctM = totalPob > 0 ? ((kpis.poblacionMujeres / totalPob) * 100).toFixed(1) : '0';

    const dataGender = [
        { name: 'Hombres', value: kpis.poblacionHombres || 0, color: '#3B82F6' },
        { name: 'Mujeres', value: kpis.poblacionMujeres || 0, color: '#EC4899' }
    ];

    return (
        <div className="dashboard-grid fade-in" style={{ gridTemplateColumns: 'repeat(3, 1fr)', minHeight: 'auto', marginBottom: 32, gap: 24 }}>
            {/* 1. Pacientes Activos */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                            Pacientes Activos
                        </div>
                        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                            {kpis.pacientesActivos}
                        </div>
                    </div>
                    <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: '#e0e7ff', color: '#4338ca',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Users size={24} strokeWidth={2.5} />
                    </div>
                </div>
                <div style={{ marginTop: 16, fontSize: 13, fontWeight: 600, color: 'var(--success)', display: 'flex', gap: 6 }}>
                    <Activity size={16} />
                    <span>+12% vs mes anterior</span>
                </div>
            </div>

            {/* 2. Distribución por Género */}
            <div className="card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', borderRadius: 24 }}>
                {/* Título Centrado Arriba */}
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16, textAlign: 'center', width: '100%' }}>
                    Distribución por Género
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                    {/* Gráfica a la IZQUIERDA */}
                    <div style={{ width: 110, height: 110, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dataGender}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={35}
                                    outerRadius={50}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {dataGender.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => [`${value} pacientes`, 'Cantidad']}
                                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Total Centro */}
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)'
                        }}>
                            {totalPob}
                        </div>
                    </div>

                    {/* Etiquetas a la DERECHA (pero alineadas a la izquierda) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }}></div>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Hombres</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, paddingLeft: 14 }}>
                                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>{kpis.poblacionHombres}</span>
                                <span style={{ fontSize: 12, color: '#3B82F6', fontWeight: 600 }}>({pctH}%)</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EC4899' }}></div>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Mujeres</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, paddingLeft: 14 }}>
                                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>{kpis.poblacionMujeres}</span>
                                <span style={{ fontSize: 12, color: '#EC4899', fontWeight: 600 }}>({pctM}%)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Nivel de Servicio */}
            <div className="card" style={{
                background: 'linear-gradient(135deg, #4e54c8, #8f94fb)',
                color: 'white', overflow: 'hidden', position: 'relative',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                boxShadow: '0 10px 20px rgba(78, 84, 200, 0.3)',
                padding: '24px', borderRadius: 24
            }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, zIndex: 2, opacity: 0.9 }}>Nivel de Servicio</div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 12, zIndex: 2 }}>Meta mensual alcanzada</div>
                <div style={{ fontSize: 42, fontWeight: 800, textShadow: '0 4px 10px rgba(0,0,0,0.2)', zIndex: 2 }}>
                    {kpis.nivelServicio}%
                </div>

                {/* Decorative Circles */}
                <div style={{
                    position: 'absolute', width: 140, height: 140, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)', right: -30, bottom: -50, zIndex: 1
                }} />
                <div style={{
                    position: 'absolute', width: 60, height: 60, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)', right: 60, top: -10, zIndex: 1
                }} />
            </div>
        </div>
    );
}
