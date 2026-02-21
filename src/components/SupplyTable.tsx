import { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import type { Paciente } from '../data/mockData';
import { getEstadoBadge, parseEntregaProgress } from '../data/mockData';

interface SupplyTableProps {
    pacientes: Paciente[];
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;

export default function SupplyTable({ pacientes }: SupplyTableProps) {
    // Detect latest month with data
    const ultimoMes = useMemo(() => {
        for (let i = MESES.length - 1; i >= 0; i--) {
            // @ts-ignore - Index access is safe here given the mockData shape
            if (pacientes.some(p => p.entregas && p.entregas[MESES[i]])) return MESES[i];
        }
        return 'enero';
    }, [pacientes]);

    // Capitalize for display
    const labelMes = ultimoMes.charAt(0).toUpperCase() + ultimoMes.slice(1);

    const displayed = pacientes.slice(0, 8);

    return (
        <div className="card fade-in-delay-2">
            <div className="card-header">
                <div>
                    <div className="card-title">Seguimiento de Entregas</div>
                    <div className="card-subtitle">Historial reciente ({labelMes})</div>
                </div>
                <button className="card-action"><ExternalLink size={14} /></button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Paciente</th>
                            <th>EPS</th>
                            <th>Medicamento</th>
                            <th>Municipio</th>
                            <th>Estado</th>
                            <th>Entrega {labelMes}</th>
                            <th>Progreso</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayed.map(p => {
                            const badge = getEstadoBadge(p.estado);
                            const entregaMes = p.entregas[ultimoMes];
                            const progress = entregaMes ? parseEntregaProgress(entregaMes) : null;
                            const pct = progress ? Math.round((progress.actual / progress.total) * 100) : 0;

                            return (
                                <tr key={p.id}>
                                    <td>
                                        <div className="patient-name">{p.nombreCompleto}</div>
                                        <div className="patient-id">CC {p.numeroId} · {p.edad} años</div>
                                    </td>
                                    <td style={{ fontSize: 12, color: 'var(--gray-600)', maxWidth: 140 }}>
                                        {p.eps.length > 25 ? p.eps.slice(0, 25) + '…' : p.eps}
                                    </td>
                                    <td style={{ fontSize: 12, maxWidth: 160 }}>
                                        {p.medicamento.length > 28 ? p.medicamento.slice(0, 28) + '…' : p.medicamento}
                                    </td>
                                    <td style={{ fontSize: 12 }}>{p.municipio}</td>
                                    <td>
                                        <span className={`badge ${badge.badgeClass}`}>{badge.label}</span>
                                    </td>
                                    <td style={{ fontSize: 12 }}>
                                        {entregaMes ? (
                                            <span className="badge delivered">{entregaMes}</span>
                                        ) : (
                                            <span className="badge inactive">Sin entrega</span>
                                        )}
                                    </td>
                                    <td style={{ minWidth: 100 }}>
                                        {progress && progress.total > 0 ? (
                                            <div>
                                                <div className="progress-bar" style={{ marginBottom: 4 }}>
                                                    <div
                                                        className="progress-fill"
                                                        style={{
                                                            width: `${pct}%`,
                                                            background: pct >= 75 ? 'var(--accent)' : pct >= 50 ? '#f59e0b' : '#ef4444'
                                                        }}
                                                    />
                                                </div>
                                                <div style={{ fontSize: 10, color: 'var(--gray-500)', textAlign: 'right' }}>{pct}%</div>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: 16, textAlign: 'center' }}>
                <button style={{
                    background: 'none', border: '1.5px solid var(--gray-200)', borderRadius: 8,
                    padding: '8px 20px', fontSize: 13, color: 'var(--accent)', cursor: 'pointer',
                    fontFamily: 'Inter', fontWeight: 600, transition: 'all 0.2s'
                }}>
                    Ver todos los pacientes →
                </button>
            </div>
        </div>
    );
}
