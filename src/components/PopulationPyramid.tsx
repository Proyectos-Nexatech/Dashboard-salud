import { ExternalLink } from 'lucide-react';
import { useMemo } from 'react';
import { Paciente, calcularPiramide } from '../data/mockData';

export default function PopulationPyramid({ pacientes }: { pacientes: Paciente[] }) {
    const data = useMemo(() => calcularPiramide(pacientes), [pacientes]);

    // Si no hay datos, evitar NaN
    const maxVal = Math.max(...data.map(d => Math.max(d.mujeres, d.hombres))) || 1;
    const barMaxWidth = 110; // px per side
    const totalPacientes = data.reduce((a, d) => a + d.mujeres + d.hombres, 0);

    return (
        <div className="card fade-in-delay-3" style={{ height: '100%' }}>
            <div className="card-header">
                <div>
                    <div className="card-title">Pirámide Poblacional</div>
                    <div className="card-subtitle">Pacientes por grupo de edad y sexo</div>
                </div>
                <button className="card-action"><ExternalLink size={14} /></button>
            </div>

            <div className="pyramid-legend">
                <div className="pyramid-legend-item">
                    <div className="pyramid-legend-dot" style={{ background: '#4e54c8' }} />
                    Mujeres
                </div>
                <div className="pyramid-legend-item">
                    <div className="pyramid-legend-dot" style={{ background: '#2d60ff' }} />
                    Hombres
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {[...data].reverse().map(row => {
                    const mujeresW = Math.round((row.mujeres / maxVal) * barMaxWidth);
                    const hombresW = Math.round((row.hombres / maxVal) * barMaxWidth);
                    const totalGrupo = row.mujeres + row.hombres;
                    const mujeresP = totalGrupo > 0 ? Math.round((row.mujeres / totalGrupo) * 100) : 0;

                    return (
                        <div key={row.grupo} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {/* Left bar (Mujeres) */}
                            <div style={{ width: barMaxWidth, display: 'flex', justifyContent: 'flex-end' }}>
                                <div
                                    title={`Mujeres: ${row.mujeres} (${mujeresP}%)`}
                                    style={{
                                        width: mujeresW,
                                        height: 18,
                                        background: 'linear-gradient(90deg, #c7d2fe, #4e54c8)',
                                        borderRadius: '4px 0 0 4px',
                                        transition: 'width 0.8s ease',
                                        cursor: 'pointer',
                                    }}
                                />
                            </div>

                            {/* Age label */}
                            <div style={{
                                width: 44, textAlign: 'center', fontSize: 10,
                                fontWeight: 700, color: 'var(--gray-600)', flexShrink: 0
                            }}>
                                {row.grupo}
                            </div>

                            {/* Right bar (Hombres) */}
                            <div style={{ width: barMaxWidth }}>
                                <div
                                    title={`Hombres: ${row.hombres} (${totalGrupo > 0 ? 100 - mujeresP : 0}%)`}
                                    style={{
                                        width: hombresW,
                                        height: 18,
                                        background: 'linear-gradient(90deg, #2d60ff, #93c5fd)',
                                        borderRadius: '0 4px 4px 0',
                                        transition: 'width 0.8s ease',
                                        cursor: 'pointer',
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* X axis labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingLeft: 0 }}>
                <div style={{ display: 'flex', gap: 20, fontSize: 10, color: 'var(--gray-400)' }}>
                    <span>{maxVal}</span><span>{Math.round(maxVal / 2)}</span><span>0</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>
                    <span>0</span>&nbsp;&nbsp;<span>{Math.round(maxVal / 2)}</span>&nbsp;&nbsp;<span>{maxVal}</span>
                </div>
            </div>

            {/* Summary */}
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--primary-light)', borderRadius: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--primary)' }}>
                        {totalPacientes}
                    </strong> pacientes totales ·{' '}
                    Grupo 60-74 años: mayor concentración de riesgo
                </div>
            </div>
        </div>
    );
}
