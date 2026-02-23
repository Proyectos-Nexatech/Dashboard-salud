import { useState, useMemo } from 'react';
import {
    X, ChevronLeft, ChevronRight, User, Pill, MapPin,
    Building2, Clock, CheckCircle2, Menu, Filter, Calendar as CalendarIcon
} from 'lucide-react';
import type { Despacho } from '../data/despachoTypes';
import { formatFechaEntrega, esEntregaUrgente, esEntregaVencida } from '../utils/despachoUtils';

interface DespachoCalendarProps {
    despachos: Despacho[];
    onClose: () => void;
    onConfirm: (despachoId: string, observaciones: string, fechaConfirmacion?: string) => Promise<void>;
    onUpdateStatus: (id: string, estado: Despacho['estadoActual'], motivo: string, nuevaFecha?: string) => Promise<void>;
}

type ViewMode = 'Día' | 'Mes' | 'Año';

export default function DespachoCalendar({ despachos, onClose, onConfirm, onUpdateStatus }: DespachoCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDespacho, setSelectedDespacho] = useState<Despacho | null>(null);
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [confirmando, setConfirmando] = useState(false);
    const [observaciones, setObservaciones] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('Mes');
    const [showViewDropdown, setShowViewDropdown] = useState(false);
    const [actionType, setActionType] = useState<'Agendar' | 'Entregar' | 'Cancelar' | 'Posponer'>('Agendar');
    const [actionValue, setActionValue] = useState('');
    const [actionDate, setActionDate] = useState('');

    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const diasSemana = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

    // ─── Lógica de Calendario ────────────────────────────────────────────────
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Agrupar despachos por día para el mes actual
    const despachosPorDia = useMemo(() => {
        const groups: Record<number, Despacho[]> = {};
        despachos.forEach(d => {
            const date = new Date(d.fechaProgramada + 'T00:00:00');
            if (date.getFullYear() === year && date.getMonth() === month) {
                const day = date.getDate();
                if (!groups[day]) groups[day] = [];
                groups[day].push(d);
            }
        });
        return groups;
    }, [despachos, year, month]);

    // Agrupar para vista de Año (despachos por mes)
    const despachosPorMes = useMemo(() => {
        const groups: Record<number, number> = {};
        despachos.forEach(d => {
            const date = new Date(d.fechaProgramada + 'T00:00:00');
            if (date.getFullYear() === year) {
                const m = date.getMonth();
                groups[m] = (groups[m] || 0) + 1;
            }
        });
        return groups;
    }, [despachos, year]);

    // Despachos para vista de Día
    const despachosHoy = useMemo(() => {
        return despachos.filter(d => {
            const date = new Date(d.fechaProgramada + 'T00:00:00');
            return date.getFullYear() === year &&
                date.getMonth() === month &&
                date.getDate() === currentDate.getDate();
        });
    }, [despachos, currentDate]);

    const changeDate = (offset: number) => {
        if (viewMode === 'Mes') setCurrentDate(new Date(year, month + offset, 1));
        else if (viewMode === 'Año') setCurrentDate(new Date(year + offset, 0, 1));
        else setCurrentDate(new Date(year, month, currentDate.getDate() + offset));
    };

    const goToToday = () => setCurrentDate(new Date());

    const G_COLORS = {
        primary: '#1a73e8',
        border: '#dadce0',
        text: '#3c4043',
        textLight: '#70757a',
        hover: '#f1f3f4'
    };

    const getDespachoColor = (d: Despacho) => {
        const estado = d.estadoActual || (d.confirmado ? 'Entregado' : 'Pendiente');
        if (estado === 'Entregado') return '#16a34a';
        if (estado === 'Agendado') return '#0369a1';
        if (estado === 'Cancelado') return '#dc2626';
        if (estado === 'Pospuesto') return '#b45309';  // Ámbar/Amarillo

        if (esEntregaVencida(d)) return '#dc2626';
        if (esEntregaUrgente(d.fechaProgramada)) return '#f59e0b';

        return '#1a73e8'; // Pendiente default azul
    };

    // ─── Renderers ───────────────────────────────────────────────────────────

    const renderMonthGrid = () => (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${G_COLORS.border}`, height: 24 }}>
                {diasSemana.map((d, i) => (
                    <div key={d} style={{ borderLeft: i > 0 ? `1px solid ${G_COLORS.border}` : 'none', textAlign: 'center', fontSize: 11, fontWeight: 600, color: G_COLORS.textLight, alignSelf: 'center' }}>{d}</div>
                ))}
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', overflow: 'hidden' }}>
                {Array.from({ length: 42 }).map((_, i) => {
                    const dayNum = i - firstDayOfMonth + 1;
                    const isValidDay = dayNum > 0 && dayNum <= daysInMonth;
                    const isToday = dayNum === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                    const dailyDespachos = isValidDay ? despachosPorDia[dayNum] || [] : [];
                    return (
                        <div
                            key={i}
                            onClick={() => {
                                if (isValidDay) {
                                    setCurrentDate(new Date(year, month, dayNum));
                                    setViewMode('Día');
                                }
                            }}
                            style={{
                                borderLeft: i % 7 > 0 ? `1px solid #dadce0` : 'none',
                                borderBottom: `1px solid #dadce0`,
                                padding: '4px 8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                background: isValidDay ? 'white' : '#f8f9fa',
                                cursor: isValidDay ? 'pointer' : 'default',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => { if (isValidDay) e.currentTarget.style.background = '#f8f9fa'; }}
                            onMouseLeave={(e) => { if (isValidDay) e.currentTarget.style.background = 'white'; }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: 4, display: 'flex', justifyContent: 'center' }}>
                                <span style={{ fontSize: 12, fontWeight: 500, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: isToday ? G_COLORS.primary : 'transparent', color: isToday ? 'white' : (isValidDay ? G_COLORS.text : '#70757a') }}>{isValidDay ? dayNum : ''}</span>
                            </div>
                            <div style={{ flex: 1, overflowY: 'hidden' }}>
                                {dailyDespachos.slice(0, 5).map(d => (
                                    <div key={d.id}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Evitar que el clic en el evento active el clic del día
                                            setSelectedDespacho(d);
                                        }}
                                        style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: getDespachoColor(d), color: 'white', marginBottom: 2, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}
                                    >
                                        {d.nombreCompleto.split(' ')[0]} - {d.medicamento.split(' ')[0]}
                                    </div>
                                ))}
                                {dailyDespachos.length > 5 && (
                                    <div style={{
                                        fontSize: 11, fontWeight: 700, color: G_COLORS.primary,
                                        padding: '2px 8px', cursor: 'pointer',
                                        textDecoration: 'none', marginTop: 2
                                    }}>
                                        + {dailyDespachos.length - 5} más
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderYearGrid = () => (
        <div style={{
            flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)', gap: '32px 24px', padding: '40px 60px',
            overflowY: 'auto', background: 'white'
        }}>
            {meses.map((m, monthIdx) => {
                const firstDayOfThisMonth = new Date(year, monthIdx, 1).getDay();
                const daysInThisMonth = new Date(year, monthIdx + 1, 0).getDate();

                return (
                    <div
                        key={m}
                        onClick={() => { setCurrentDate(new Date(year, monthIdx, 1)); setViewMode('Mes'); }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 12, cursor: 'pointer' }}
                    >
                        <div style={{ fontSize: 14, fontWeight: 500, color: G_COLORS.text, paddingLeft: 4 }}>
                            {m}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                            {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(d => (
                                <div key={d} style={{ fontSize: 10, color: G_COLORS.textLight, textAlign: 'center', height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {d}
                                </div>
                            ))}
                            {Array.from({ length: 42 }).map((_, i) => {
                                const dNum = i - firstDayOfThisMonth + 1;
                                const isValid = dNum > 0 && dNum <= daysInThisMonth;
                                const isToday = isValid && dNum === new Date().getDate() && monthIdx === new Date().getMonth() && year === new Date().getFullYear();

                                // Verificar si hay despachos para este día
                                const hasEvents = isValid && despachos.some(desp => {
                                    const date = new Date(desp.fechaProgramada + 'T00:00:00');
                                    return date.getFullYear() === year && date.getMonth() === monthIdx && date.getDate() === dNum;
                                });

                                return (
                                    <div
                                        key={i}
                                        style={{
                                            fontSize: 10, height: 20, width: 20, margin: '0 auto',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            borderRadius: '50%',
                                            background: isToday ? G_COLORS.primary : (hasEvents ? '#e8f0fe' : 'transparent'),
                                            color: isToday ? 'white' : (hasEvents ? G_COLORS.primary : (isValid ? G_COLORS.text : 'transparent')),
                                            fontWeight: hasEvents ? 700 : 400
                                        }}
                                    >
                                        {isValid ? dNum : ''}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const renderDayView = () => (
        <div style={{ flex: 1, padding: 40, overflowY: 'auto', background: '#f8fafc' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                    <button
                        onClick={() => setViewMode('Mes')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', borderRadius: 8, border: `1px solid ${G_COLORS.border}`,
                            background: 'white', color: G_COLORS.text, fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        <ChevronLeft size={16} /> Volver al Mes
                    </button>
                    <h3 style={{ fontSize: 20, fontWeight: 600, color: G_COLORS.text, margin: 0 }}>
                        Entregas para el {currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {despachosHoy.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: G_COLORS.textLight, background: 'white', borderRadius: 12, border: `1px dashed ${G_COLORS.border}` }}>No hay entregas programadas para este día.</div>
                    ) : (
                        despachosHoy.map(d => (
                            <div key={d.id} onClick={() => setSelectedDespacho(d)} style={{ background: 'white', border: `1px solid ${G_COLORS.border}`, borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: getDespachoColor(d) }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, color: G_COLORS.text }}>{d.nombreCompleto}</div>
                                    <div style={{ fontSize: 13, color: G_COLORS.textLight }}>{d.medicamento} - {d.dosis}</div>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: 13, color: G_COLORS.textLight }}>{d.municipio}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'white', display: 'flex', flexDirection: 'column', fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}>
            {/* Header */}
            <header style={{ height: 64, borderBottom: `1px solid ${G_COLORS.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 232 }}>
                    <button onClick={() => setSidebarVisible(!sidebarVisible)} style={iconBtnStyle}><Menu size={20} /></button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ color: '#4285f4' }}><CalendarIcon size={28} /></div>
                        <span style={{ fontSize: 21, color: '#5f6368', letterSpacing: '-0.5px' }}>Calendar</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 20 }}>
                    <button onClick={goToToday} style={todayBtnStyle}>Hoy</button>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button onClick={() => changeDate(-1)} style={iconBtnStyle}><ChevronLeft size={20} /></button>
                        <button onClick={() => changeDate(1)} style={iconBtnStyle}><ChevronRight size={20} /></button>
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 400, color: G_COLORS.text, marginLeft: 16 }}>
                        {viewMode === 'Año' ? year : viewMode === 'Mes' ? `${meses[month]} de ${year}` : currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </h2>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => setShowViewDropdown(!showViewDropdown)} style={viewNavStyle}>{viewMode} <ChevronDown size={14} /></button>
                        {showViewDropdown && (
                            <div style={{ position: 'absolute', top: '110%', right: 0, background: 'white', border: `1px solid ${G_COLORS.border}`, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '4px 0', minWidth: 120, zIndex: 100 }}>
                                {(['Día', 'Mes', 'Año'] as ViewMode[]).map(v => (
                                    <div key={v} onClick={() => { setViewMode(v); setShowViewDropdown(false); }} style={{ padding: '8px 16px', cursor: 'pointer', fontSize: 14, color: G_COLORS.text, background: viewMode === v ? '#f1f3f4' : 'transparent' }}>{v}</div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {sidebarVisible && (
                    <aside style={{ width: 256, borderRight: `1px solid ${G_COLORS.border}`, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <button style={createBtnStyle}><span style={{ fontSize: 24, marginRight: 8, fontWeight: 300 }}>+</span> Crear</button>
                        <div style={{ padding: '0 8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 600, color: G_COLORS.text }}>{meses[month]} de {year}</span></div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
                                {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(d => (<span key={d} style={{ fontSize: 11, color: G_COLORS.textLight, fontWeight: 500 }}>{d}</span>))}
                                {Array.from({ length: 42 }).map((_, i) => {
                                    const dayNum = i - firstDayOfMonth + 1;
                                    const isCurrent = dayNum === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear();
                                    return (<span key={i} onClick={() => dayNum > 0 && dayNum <= daysInMonth && (setCurrentDate(new Date(year, month, dayNum)), setViewMode('Día'))} style={{ fontSize: 10, padding: 4, borderRadius: '50%', cursor: 'pointer', background: isCurrent ? G_COLORS.primary : 'transparent', color: isCurrent ? 'white' : ((dayNum > 0 && dayNum <= daysInMonth) ? G_COLORS.text : '#bdc1c6') }}>{dayNum > 0 && dayNum <= daysInMonth ? dayNum : ''}</span>);
                                })}
                            </div>
                        </div>
                        <div style={{ borderTop: `1px solid ${G_COLORS.border}`, paddingTop: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 14 }}><Filter size={16} /> <span style={{ fontWeight: 500 }}>Filtros de Entrega</span></div>
                            <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <LegendItem color="#16a34a" label="Entregados" />
                                <LegendItem color="#0369a1" label="Agendados" />
                                <LegendItem color="#1a73e8" label="Pendientes" />
                                <LegendItem color="#f59e0b" label="Urgentes" />
                                <LegendItem color="#b45309" label="Pospuestos" />
                                <LegendItem color="#dc2626" label="Vencidos / Cancelados" />
                            </div>
                        </div>
                    </aside>
                )}

                <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {viewMode === 'Mes' ? renderMonthGrid() : viewMode === 'Año' ? renderYearGrid() : renderDayView()}
                </main>
            </div>

            {/* Modal Detalle */}
            {selectedDespacho && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ background: 'white', borderRadius: 8, width: '100%', maxWidth: 440, boxShadow: '0 24px 38px 3px rgba(0,0,0,0.14)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ height: 48, background: '#f1f3f4', display: 'flex', alignItems: 'center', padding: '0 8px', justifyContent: 'flex-end' }}><button onClick={() => setSelectedDespacho(null)} style={iconBtnStyle}><X size={18} /></button></div>
                        <div style={{ padding: '24px 32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: selectedDespacho.confirmado ? '#16a34a' : '#1a73e8' }} /><h2 style={{ fontSize: 22, fontWeight: 400, color: G_COLORS.text, margin: 0 }}>Detalle del Despacho</h2></div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <InfoItem icon={<Clock size={18} />} value={formatFechaEntrega(selectedDespacho.fechaProgramada)} />
                                <InfoItem icon={<User size={18} />} value={selectedDespacho.nombreCompleto} sub={`ID: ${selectedDespacho.pacienteId}`} />
                                <InfoItem icon={<Pill size={18} />} value={selectedDespacho.medicamento} sub={selectedDespacho.dosis} />
                                <InfoItem icon={<Building2 size={18} />} value={selectedDespacho.eps} />
                                <InfoItem icon={<MapPin size={18} />} value={selectedDespacho.municipio} />
                            </div>
                            {(!(selectedDespacho.confirmado || selectedDespacho.estadoActual === 'Entregado') && selectedDespacho.estadoActual !== 'Cancelado') && (
                                <div style={{ marginTop: 24, borderTop: `1px solid #eee`, paddingTop: 20 }}>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                        {(() => {
                                            const estado = selectedDespacho.estadoActual || (selectedDespacho.confirmado ? 'Entregado' : 'Pendiente');
                                            const availableActions: Array<'Agendar' | 'Entregar' | 'Cancelar' | 'Posponer'> = [];

                                            if (estado === 'Pendiente') {
                                                availableActions.push('Agendar');
                                            } else if (estado === 'Agendado' || estado === 'Pospuesto') {
                                                availableActions.push('Entregar', 'Posponer', 'Cancelar');
                                            }

                                            return availableActions.map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => {
                                                        setActionType(t);
                                                        setActionValue('');
                                                        const today = new Date().toISOString().split('T')[0];
                                                        setActionDate(t === 'Posponer' ? selectedDespacho.fechaProgramada : today);
                                                    }}
                                                    style={{
                                                        flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 700, borderRadius: 6,
                                                        border: 'none',
                                                        background: actionType === t ? (t === 'Entregar' ? '#16a34a' : t === 'Cancelar' ? '#dc2626' : t === 'Posponer' ? '#2563eb' : '#0369a1') : '#f1f3f4',
                                                        color: actionType === t ? 'white' : '#5f6368',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {t}
                                                </button>
                                            ));
                                        })()}
                                    </div>

                                    {(actionType === 'Posponer' || actionType === 'Entregar' || actionType === 'Agendar') && (
                                        <div style={{ marginBottom: 16 }}>
                                            <label style={{ fontSize: 12, fontWeight: 600, color: G_COLORS.text, display: 'block', marginBottom: 8 }}>
                                                Fecha de {actionType === 'Entregar' ? 'Entrega' : actionType === 'Agendar' ? 'Agendamiento' : 'Reprogramación'}
                                            </label>
                                            <input type="date" value={actionDate} onChange={e => setActionDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #dadce0', fontSize: 13, outline: 'none' }} />
                                        </div>
                                    )}

                                    {(actionType === 'Entregar' || actionType === 'Agendar') ? (
                                        <>
                                            <label style={{ fontSize: 12, fontWeight: 600, color: G_COLORS.text, display: 'block', marginBottom: 8 }}>{actionType === 'Entregar' ? 'Observaciones de entrega' : 'Notas de agendamiento'}</label>
                                            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder={actionType === 'Entregar' ? "Eje: Entregado a familiar..." : "Notas opcionales..."} style={{ width: '100%', minHeight: 60, padding: 12, borderRadius: 8, border: '1px solid #dadce0', fontSize: 13, resize: 'none', marginBottom: 16, fontFamily: 'inherit' }} />
                                        </>
                                    ) : (
                                        <>
                                            <label style={{ fontSize: 12, fontWeight: 600, color: G_COLORS.text, display: 'block', marginBottom: 8 }}>Motivo de {actionType.toLowerCase()}</label>
                                            <select
                                                value={actionValue}
                                                onChange={e => setActionValue(e.target.value)}
                                                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #dadce0', fontSize: 13, marginBottom: 16, background: 'white', outline: 'none' }}
                                            >
                                                <option value="">Seleccione un motivo...</option>
                                                {actionType === 'Cancelar' ? (
                                                    <>
                                                        <option value="Paciente fallecido">Paciente fallecido</option>
                                                        <option value="Error en prescripción">Error en prescripción</option>
                                                        <option value="Duplicado">Duplicado</option>
                                                        <option value="Paciente trasladado">Paciente trasladado</option>
                                                        <option value="Paciente no requiere medicamento">Paciente no requiere medicamento</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="Falta de inventario (Stock-out)">Falta de inventario (Stock-out)</option>
                                                        <option value="Dirección incorrecta">Dirección incorrecta</option>
                                                        <option value="Documentación incompleta">Documentación incompleta</option>
                                                        <option value="Paciente solicita pausa">Paciente solicita pausa</option>
                                                    </>
                                                )}
                                            </select>
                                        </>
                                    )}

                                    <button
                                        onClick={async () => {
                                            if (!selectedDespacho) return;
                                            setConfirmando(true);
                                            try {
                                                if (actionType === 'Entregar') {
                                                    await onConfirm(selectedDespacho.id, observaciones, actionDate);
                                                } else {
                                                    await onUpdateStatus(selectedDespacho.id, actionType === 'Agendar' ? 'Agendado' : actionType === 'Cancelar' ? 'Cancelado' : 'Pospuesto', actionValue, actionDate);
                                                }
                                                setSelectedDespacho(null);
                                                setObservaciones('');
                                                setActionValue('');
                                            } catch (err) {
                                                console.error(err);
                                            } finally {
                                                setConfirmando(false);
                                            }
                                        }}
                                        disabled={confirmando || (actionType !== 'Entregar' && actionType !== 'Agendar' && !actionValue)}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: 8,
                                            background: actionType === 'Entregar' ? '#16a34a' : actionType === 'Cancelar' ? '#dc2626' : actionType === 'Posponer' ? '#2563eb' : '#0369a1',
                                            color: 'white', border: 'none', fontWeight: 600, fontSize: 14, cursor: confirmando ? 'not-allowed' : 'pointer',
                                            opacity: (confirmando || (actionType !== 'Entregar' && actionType !== 'Agendar' && !actionValue)) ? 0.7 : 1
                                        }}
                                    >
                                        {confirmando ? 'Procesando...' : 'ACEPTAR Y GUARDAR'}
                                    </button>
                                </div>
                            )}
                            {(selectedDespacho.confirmado || selectedDespacho.estadoActual === 'Entregado' || selectedDespacho.estadoActual === 'Cancelado') && (
                                <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: G_COLORS.textLight, textTransform: 'uppercase', marginBottom: 4 }}>Estado Actual</div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: selectedDespacho.estadoActual === 'Cancelado' ? '#dc2626' : '#16a34a' }}>
                                        {selectedDespacho.estadoActual === 'Cancelado' ? '✕ Cancelado' : '✓ Entregado'}
                                    </div>
                                    {selectedDespacho.motivo && <div style={{ fontSize: 13, color: G_COLORS.text, marginTop: 4, fontStyle: 'italic' }}>"{selectedDespacho.motivo}"</div>}
                                    {selectedDespacho.observaciones && <div style={{ fontSize: 13, color: G_COLORS.text, marginTop: 4 }}>Obs: {selectedDespacho.observaciones}</div>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function LegendItem({ color, label }: { color: string, label: string }) {
    return (<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 14, height: 14, borderRadius: 2, background: color, border: '1px solid rgba(0,0,0,0.1)' }} /><span style={{ fontSize: 13, color: '#3c4043' }}>{label}</span></div>);
}

function InfoItem({ icon, value, sub }: { icon: any, value: string, sub?: string }) {
    return (<div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}><div style={{ color: '#5f6368', paddingTop: 2 }}>{icon}</div><div><div style={{ fontSize: 14, color: '#3c4043' }}>{value}</div>{sub && <div style={{ fontSize: 12, color: '#70757a', marginTop: 2 }}>{sub}</div>}</div></div>);
}

function ChevronDown({ size }: { size?: number }) {
    return (<svg width={size || 10} height={size || 10} viewBox="0 0 10 10" fill="none"><path d="M1 3L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>);
}

const iconBtnStyle: React.CSSProperties = { background: 'none', border: 'none', padding: 8, borderRadius: '50%', cursor: 'pointer', color: '#5f6368', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const todayBtnStyle: React.CSSProperties = { padding: '7px 16px', borderRadius: 4, border: '1px solid #dadce0', background: 'white', color: '#3c4043', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginRight: 8 };
const viewNavStyle: React.CSSProperties = { padding: '7px 16px', borderRadius: 4, border: '1px solid #dadce0', background: 'white', color: '#3c4043', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 };
const createBtnStyle: React.CSSProperties = { padding: '8px 24px 8px 16px', borderRadius: 28, border: 'none', background: 'white', boxShadow: '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)', color: '#3c4043', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', marginBottom: 8, marginLeft: 8 };
const closeBtnStyle: React.CSSProperties = { background: '#f1f3f4', border: 'none', padding: 8, borderRadius: '50%', cursor: 'pointer', color: '#5f6368', display: 'flex', alignItems: 'center', justifyContent: 'center' };
