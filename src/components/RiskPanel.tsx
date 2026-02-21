import { AlertTriangle, Globe, Building2, ExternalLink } from 'lucide-react';
import { FACTORES_RIESGO } from '../data/mockData';

export default function RiskPanel() {
    const allFactors = [
        ...FACTORES_RIESGO.externos.map(f => ({ ...f, tipo: 'Externo' })),
        ...FACTORES_RIESGO.internos.map(f => ({ ...f, tipo: 'Interno' })),
    ];

    return (
        <div className="card fade-in-delay-3" style={{ height: '100%' }}>
            <div className="card-header">
                <div>
                    <div className="card-title">Panel de Riesgos</div>
                    <div className="card-subtitle">Factores internos y externos</div>
                </div>
                <button className="card-action"><ExternalLink size={14} /></button>
            </div>

            {/* Summary badges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {(['alto', 'medio', 'bajo'] as const).map(nivel => {
                    const count = allFactors.filter(f => f.nivel === nivel).length;
                    const colors = { alto: '#fee2e2', medio: '#fffbeb', bajo: '#f0fdf4' }; // Light backgrounds
                    const textColors = { alto: '#ef4444', medio: '#f59e0b', bajo: '#05cd99' }; // Theme colors
                    const labels = { alto: 'Alto', medio: 'Medio', bajo: 'Bajo' };
                    return (
                        <div key={nivel} style={{
                            flex: 1, textAlign: 'center', padding: '8px 4px',
                            background: colors[nivel], borderRadius: 10
                        }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: textColors[nivel] }}>{count}</div>
                            <div style={{ fontSize: 10, color: textColors[nivel], fontWeight: 600 }}>{labels[nivel]}</div>
                        </div>
                    );
                })}
            </div>

            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {allFactors.map((factor, i) => (
                    <div key={i} className="risk-item">
                        <div className={`risk-icon ${factor.nivel}`}>
                            {factor.tipo === 'Externo' ? <Globe size={18} /> : <Building2 size={18} />}
                        </div>
                        <div className="risk-info">
                            <div className="risk-name">{factor.nombre}</div>
                            <div className="risk-desc">{factor.desc}</div>
                            <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 2 }}>
                                {factor.tipo}
                            </div>
                        </div>
                        <div className="risk-bar-container">
                            <div className="risk-bar-bg">
                                <div
                                    className={`risk-bar-fill ${factor.nivel}`}
                                    style={{ width: `${factor.pct}%` }}
                                />
                            </div>
                            <div className={`risk-pct ${factor.nivel}`}>{factor.pct}%</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
