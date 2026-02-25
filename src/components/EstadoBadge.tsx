import React from 'react';
import { CheckCircle2, Calendar, XCircle, RotateCcw, AlertTriangle, Clock } from 'lucide-react';
import type { Despacho } from '../data/despachoTypes';
import { esEntregaVencida, esEntregaUrgente } from '../utils/despachoUtils';

export default function EstadoBadge({ despacho }: { despacho: Despacho }) {
    const estado = despacho.estadoActual || (despacho.confirmado ? 'Entregado' : 'Pendiente');

    const renderBadge = (config: { bg: string, color: string, icon: any, label: string }) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: config.bg, color: config.color, padding: '3px 10px',
                borderRadius: 20, fontSize: 11, fontWeight: 700
            }}>
                {config.icon && <config.icon size={12} />}{config.label}
            </span>
            {despacho.modificadoPor && (
                <div style={{ fontSize: 9, color: '#94a3b8', maxWidth: 120, textAlign: 'center', lineHeight: 1 }}>
                    {despacho.modificadoPor.split('@')[0]} - {despacho.ultimaModificacion && new Date(despacho.ultimaModificacion).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
            )}
        </div>
    );

    if (estado.includes('Entregado')) {
        const isDom = estado.includes('Domicilio');
        return renderBadge({
            bg: isDom ? '#ecfdf5' : '#dcfce7',
            color: isDom ? '#059669' : '#15803d',
            icon: CheckCircle2,
            label: isDom ? 'Entregado (D)' : 'Entregado (F)'
        });
    }

    if (estado === 'Agendado') {
        return renderBadge({ bg: '#e0f2fe', color: '#0369a1', icon: Calendar, label: 'Agendado' });
    }

    if (estado === 'Cancelado') {
        return renderBadge({ bg: '#fee2e2', color: '#dc2626', icon: XCircle, label: 'Cancelado' });
    }

    if (estado === 'Pospuesto') {
        return renderBadge({ bg: '#fef3c7', color: '#b45309', icon: RotateCcw, label: 'Pospuesto' });
    }

    if (esEntregaVencida(despacho)) {
        return renderBadge({ bg: '#fee2e2', color: '#dc2626', icon: AlertTriangle, label: 'Vencido' });
    }

    if (esEntregaUrgente(despacho.fechaProgramada)) {
        return renderBadge({ bg: '#fef3c7', color: '#b45309', icon: AlertTriangle, label: 'Urgente' });
    }

    return renderBadge({ bg: '#eff6ff', color: '#2563eb', icon: Clock, label: 'Pendiente' });
}
