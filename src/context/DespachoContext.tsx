import * as React from 'react';
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { subscribeToDespachos } from '../services/despachoService';
import { isDespachoCritico } from '../utils/despachoUtils';
import type { Despacho } from '../data/despachoTypes';

interface DespachoContextType {
    despachos: Despacho[];
    criticalDespachos: Despacho[];
    loading: boolean;
}

const DespachoContext = createContext<DespachoContextType | undefined>(undefined);

export const DespachoProvider = ({ children }: { children: React.ReactNode }) => {
    const [despachos, setDespachos] = useState<Despacho[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToDespachos((data) => {
            setDespachos(data);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const criticalDespachos = useMemo(() => {
        return despachos.filter(isDespachoCritico).sort((a, b) =>
            a.fechaProgramada.localeCompare(b.fechaProgramada)
        );
    }, [despachos]);

    return (
        <DespachoContext.Provider value={{ despachos, criticalDespachos, loading }}>
            {children}
        </DespachoContext.Provider>
    );
};

export const useDespachos = () => {
    const context = useContext(DespachoContext);
    if (!context) throw new Error('useDespachos must be used within a DespachoProvider');
    return context;
};
