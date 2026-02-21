
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import type { Paciente } from '../data/mockData';

export default function EPSChart({ pacientes }: { pacientes: Paciente[] }) {
    // Calcular conteo por EPS
    const data = pacientes.reduce((acc, p) => {
        // Limpiar nombre EPS para visualización más limpia
        let name = p.eps
            .replace('ENTIDAD PROMOTORA DE SALUD', '')
            .replace('S.A', '')
            .replace('EPS-S', '')
            .replace('ASOCIACION', '')
            .replace('MUTUAL SER', 'Mutual Ser')
            .replace('COOSALUD', 'Coosalud')
            .replace('NUEVA EPS', 'Nueva EPS')
            .replace('CAJA DE COMPENSACION', 'Cajacopi')
            .trim();

        // Truncar si es muy largo aún
        if (name.length > 20) name = name.substring(0, 18) + '...';
        if (!name) name = 'Otra';

        const existing = acc.find(item => item.name === name);
        if (existing) {
            existing.value++;
        } else {
            acc.push({ name, value: 1, fullName: p.eps });
        }
        return acc;
    }, [] as { name: string; value: number; fullName: string }[])
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Top 10

    const totalPacientes = pacientes.length;
    const dataWithPct = data.map(item => ({
        ...item,
        percentageLabel: totalPacientes > 0
            ? ((item.value / totalPacientes) * 100).toFixed(1) + '%'
            : '0%'
    }));

    return (
        <div className="card fade-in-delay-3" style={{ height: '100%', minHeight: 400 }}>
            <div className="card-header">
                <div>
                    <div className="card-title">Entidades Aseguradoras</div>
                    <div className="card-subtitle">Pacientes activos por EPS</div>
                </div>
            </div>
            <div style={{ height: 320, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={dataWithPct}
                        layout="vertical"
                        margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={130}
                            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                            interval={0}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: number) => [value, 'Pacientes']}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                            <LabelList dataKey="percentageLabel" position="right" style={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                            {dataWithPct.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#93c5fd'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
