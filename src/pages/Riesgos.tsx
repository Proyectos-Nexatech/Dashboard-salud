import { AlertTriangle, TrendingUp, Shield, Globe, Building2 } from 'lucide-react';
import { FACTORES_RIESGO, MEDICAMENTOS_CRITICOS } from '../data/mockData';
import {
    RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip
} from 'recharts';

const radarData = [
    { factor: 'Geopolítico', value: 78 },
    { factor: 'Cambiario', value: 72 },
    { factor: 'Desabasto', value: 55 },
    { factor: 'Logística', value: 40 },
    { factor: 'Financiero', value: 48 },
    { factor: 'Inventario', value: 68 },
];

export default function Riesgos() {
    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                {/* Radar chart */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Mapa de Riesgo Multidimensional</div>
                            <div className="card-subtitle">Evaluación integral de factores</div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#e9ecef" />
                            <PolarAngleAxis dataKey="factor" tick={{ fontSize: 12, fill: '#6c757d' }} />
                            <Radar name="Nivel de Riesgo" dataKey="value" stroke="#1a7a4a" fill="#1a7a4a" fillOpacity={0.25} />
                            <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Medicamentos críticos */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Medicamentos en Riesgo de Desabasto</div>
                            <div className="card-subtitle">Principios activos críticos</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {MEDICAMENTOS_CRITICOS.map(med => {
                            const pct = Math.min(Math.round(((med.stockActual || 0) / (med.stockMinimo || 1)) * 100), 100);
                            const color = med.nivelRiesgo === 'alto' ? '#ef4444' : med.nivelRiesgo === 'medio' ? '#f59e0b' : '#1a7a4a';
                            return (
                                <div key={med.nombre} style={{ padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>{med.nombre}</div>
                                            <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{med.presentacion}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className={`badge ${med.nivelRiesgo === 'alto' ? 'inactive-death' : med.nivelRiesgo === 'medio' ? 'inactive-suspension' : 'active'}`}>
                                                {med.nivelRiesgo === 'alto' ? 'CRÍTICO' : med.nivelRiesgo === 'medio' ? 'ALERTA' : 'NORMAL'}
                                            </span>
                                            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                                                Stock: {med.stockActual}/{med.stockMinimo} u.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Risk factors detail */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="card">
                    <div className="card-header">
                        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Globe size={18} color="var(--accent)" />
                            Factores Externos
                        </div>
                    </div>
                    {FACTORES_RIESGO.externos.map((f, i) => (
                        <div key={i} className="risk-item">
                            <div className={`risk-icon ${f.nivel}`}><AlertTriangle size={16} /></div>
                            <div className="risk-info">
                                <div className="risk-name">{f.nombre}</div>
                                <div className="risk-desc">{f.desc}</div>
                            </div>
                            <div className="risk-bar-container">
                                <div className="risk-bar-bg">
                                    <div className={`risk-bar-fill ${f.nivel}`} style={{ width: `${f.pct}%` }} />
                                </div>
                                <div className={`risk-pct ${f.nivel}`}>{f.pct}%</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <div className="card-header">
                        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Building2 size={18} color="var(--accent)" />
                            Factores Internos
                        </div>
                    </div>
                    {FACTORES_RIESGO.internos.map((f, i) => (
                        <div key={i} className="risk-item">
                            <div className={`risk-icon ${f.nivel}`}><Shield size={16} /></div>
                            <div className="risk-info">
                                <div className="risk-name">{f.nombre}</div>
                                <div className="risk-desc">{f.desc}</div>
                            </div>
                            <div className="risk-bar-container">
                                <div className="risk-bar-bg">
                                    <div className={`risk-bar-fill ${f.nivel}`} style={{ width: `${f.pct}%` }} />
                                </div>
                                <div className={`risk-pct ${f.nivel}`}>{f.pct}%</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
