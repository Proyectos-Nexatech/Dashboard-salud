import { useEffect, useState } from 'react';
import { AlertCircle, X, CheckCircle, HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type?: 'danger' | 'success' | 'info';
    confirmText?: string;
    cancelText?: string;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'info',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
}: ConfirmModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = 'auto';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const getColor = () => {
        switch (type) {
            case 'danger': return 'var(--danger)';
            case 'success': return 'var(--success)';
            default: return 'var(--primary)';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertCircle size={32} color={getColor()} />;
            case 'success': return <CheckCircle size={32} color={getColor()} />;
            default: return <HelpCircle size={32} color={getColor()} />;
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '80px',
                opacity: isOpen ? 1 : 0,
                transition: 'opacity 0.3s ease'
            }}
            onClick={onClose}
        >
            <div
                className="card confirm-modal-card"
                onClick={e => e.stopPropagation()}
                style={{
                    width: '90%',
                    maxWidth: 360,
                    height: 'auto',
                    padding: 24,
                    borderRadius: 20,
                    background: 'white',
                    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.2)',
                    transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 0
                }}
            >
                <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: type === 'danger' ? 'rgba(238, 93, 80, 0.1)' :
                        type === 'success' ? 'rgba(5, 205, 153, 0.1)' : 'rgba(45, 96, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16
                }}>
                    {/* Simplified icon logic for compactness */}
                    {type === 'danger' ? <AlertCircle size={24} color={getColor()} /> :
                        type === 'success' ? <CheckCircle size={24} color={getColor()} /> :
                            <HelpCircle size={24} color={getColor()} />}
                </div>

                <h3 style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    marginBottom: 8,
                    lineHeight: 1.2
                }}>
                    {title}
                </h3>

                <p style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    marginBottom: 20,
                    lineHeight: 1.5
                }}>
                    {message}
                </p>

                <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            borderRadius: 12,
                            border: '1px solid var(--gray-200)',
                            background: 'white',
                            color: 'var(--text-main)',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-body)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            borderRadius: 12,
                            border: 'none',
                            background: getColor(),
                            color: 'white',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: `0 4px 10px ${type === 'danger' ? 'rgba(238, 93, 80, 0.3)' :
                                type === 'success' ? 'rgba(5, 205, 153, 0.3)' : 'rgba(45, 96, 255, 0.3)'}`,
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                        }}
                        className="btn-primary-confirm"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
