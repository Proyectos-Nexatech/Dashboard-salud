import React, { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

interface DeliveryEvidenceProps {
    onSave: (base64: string) => void;
    onCancel: () => void;
}

export default function DeliveryEvidence({ onSave, onCancel }: DeliveryEvidenceProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (preview) {
            onSave(preview);
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
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 16, textTransform: 'uppercase' }}>
                Evidencia de Entrega
            </h4>

            {!preview ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        height: 180,
                        border: '2px dashed #d1d5db',
                        borderRadius: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                        cursor: 'pointer',
                        background: '#f9fafb',
                        transition: 'all 0.2s',
                        marginBottom: 16
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onMouseOut={e => e.currentTarget.style.borderColor = '#d1d5db'}
                >
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Camera size={24} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Tomar Foto o Subir imagen</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>JPG, PNG o directo de cámara</div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                    />
                </div>
            ) : (
                <div style={{ position: 'relative', marginBottom: 16 }}>
                    <img
                        src={preview}
                        alt="Evidencia"
                        style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, border: '1px solid #e5e7eb' }}
                    />
                    <button
                        onClick={() => setPreview(null)}
                        style={{
                            position: 'absolute', top: 8, right: 8,
                            background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%',
                            padding: 6, cursor: 'pointer', display: 'flex'
                        }}
                    >
                        <X size={16} color="#ef4444" />
                    </button>
                    <p style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>Toca la imagen para cambiarla</p>
                </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
                <button
                    onClick={onCancel}
                    type="button"
                    style={{
                        flex: 1,
                        padding: '12px',
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: 8,
                        color: '#4b5563',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer'
                    }}
                >
                    Regresar
                </button>
                <button
                    onClick={handleSave}
                    disabled={!preview}
                    style={{
                        flex: 2,
                        padding: '12px',
                        background: '#10b981',
                        border: 'none',
                        borderRadius: 8,
                        color: 'white',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                        opacity: !preview ? 0.6 : 1
                    }}
                >
                    ACEPTAR EVIDENCIA
                </button>
            </div>
        </div>
    );
}
