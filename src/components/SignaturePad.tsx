import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
    onSave: (base64: string) => void;
    onCancel: () => void;
}

export default function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
    const sigPad = useRef<SignatureCanvas>(null);

    const clear = () => {
        sigPad.current?.clear();
    };

    const save = () => {
        const pad = sigPad.current;
        if (!pad || pad.isEmpty()) {
            alert('Por favor, firme para continuar.');
            return;
        }

        try {
            // Intentamos obtener el canvas recortado (puede fallar por problemas de dependencias en Vite)
            const canvas = pad.getTrimmedCanvas();
            const data = canvas.toDataURL('image/png');
            if (data) {
                onSave(data);
            }
        } catch (error) {
            console.error('Error al recortar la firma (getTrimmedCanvas), usando canvas original:', error);
            // Fallback al canvas completo si el recorte falla
            const canvas = pad.getCanvas();
            const data = canvas.toDataURL('image/png');
            if (data) {
                onSave(data);
            }
        }
    };

    return (
        <div style={{
            background: '#fff',
            border: '1.5px solid #e5e7eb',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center'
        }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12, textTransform: 'uppercase' }}>
                Firma de Recibido
            </h4>

            <div style={{
                border: '1px solid #d1d5db',
                borderRadius: 8,
                overflow: 'hidden',
                background: '#f9fafb',
                height: 180,
                marginBottom: 16
            }}>
                <SignatureCanvas
                    ref={sigPad}
                    penColor="black"
                    canvasProps={{
                        width: 400,
                        height: 180,
                        className: 'sigCanvas'
                    }}
                />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
                <button
                    onClick={clear}
                    style={{
                        flex: 1,
                        padding: '10px',
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: 8,
                        color: '#4b5563',
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                    }}
                >
                    <RotateCcw size={14} /> REPETIR
                </button>
                <button
                    onClick={save}
                    style={{
                        flex: 1,
                        padding: '10px',
                        background: '#10b981',
                        border: 'none',
                        borderRadius: 8,
                        color: 'white',
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer'
                    }}
                >
                    ACEPTAR FIRMA
                </button>
                <button
                    onClick={onCancel}
                    type="button"
                    style={{
                        padding: '10px',
                        background: '#fee2e2',
                        border: 'none',
                        borderRadius: 8,
                        color: '#dc2626',
                        cursor: 'pointer'
                    }}
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
