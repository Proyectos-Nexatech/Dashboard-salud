import React from 'react';
import { Package, Truck, CheckCircle2 } from 'lucide-react';

interface TimelineEvent {
    hito: string;
    timestamp: string;
    usuario: string;
}

interface DeliveryTimelineProps {
    events: TimelineEvent[];
    currentStep: 'Despachado' | 'En Camino' | 'Entregado (Domicilio)' | 'Entregado (Farmacia)';
}

export default function DeliveryTimeline({ events, currentStep }: DeliveryTimelineProps) {
    const steps = [
        { key: 'Despachado', label: 'Despachado', icon: Package },
        { key: 'En Camino', label: 'En Transporte', icon: Truck },
        { key: 'Entregado (Domicilio)', label: 'Entregado', icon: CheckCircle2 },
    ];

    const getStepIndex = (step: string) => {
        if (step === 'Despachado') return 0;
        if (step === 'En Camino') return 1;
        if (step.includes('Entregado')) return 2;
        return -1;
    };

    const currentIndex = getStepIndex(currentStep);

    return (
        <div style={{ padding: '20px 0', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 10px' }}>
                {/* Connecting Line */}
                <div style={{
                    position: 'absolute',
                    top: 15,
                    left: '10%',
                    right: '10%',
                    height: 2,
                    background: '#e5e7eb',
                    zIndex: 0
                }} />

                {steps.map((step, idx) => {
                    const isActive = idx <= currentIndex;
                    const Icon = step.icon;
                    const event = events.find(e => e.hito.includes(step.key.split(' ')[0]));

                    return (
                        <div key={step.key} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: isActive ? '#6366f1' : 'white',
                                border: `2px solid ${isActive ? '#6366f1' : '#e5e7eb'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isActive ? 'white' : '#9ca3af',
                                boxShadow: isActive ? '0 0 10px rgba(99, 102, 241, 0.3)' : 'none',
                                transition: 'all 0.3s'
                            }}>
                                <Icon size={16} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#111827' : '#9ca3af' }}>
                                    {step.label}
                                </div>
                                {event && (
                                    <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>
                                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
