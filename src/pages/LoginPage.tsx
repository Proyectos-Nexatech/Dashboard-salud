import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Credenciales inválidas. Por favor intente de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                background: 'white',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.8)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'var(--primary-light)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        color: 'var(--primary)'
                    }}>
                        <LogIn size={32} />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '8px' }}>
                        PharmaCare
                    </h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>
                        Ingrese sus credenciales para acceder
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ position: 'relative' }}>
                        <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                        <input
                            type="email"
                            placeholder="Correo electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 14px 12px 42px',
                                borderRadius: '12px',
                                border: '1.5px solid var(--gray-200)',
                                outline: 'none',
                                fontSize: '14px',
                                transition: 'all 0.2s',
                                background: '#f8fafc'
                            }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 14px 12px 42px',
                                borderRadius: '12px',
                                border: '1.5px solid var(--gray-200)',
                                outline: 'none',
                                fontSize: '14px',
                                transition: 'all 0.2s',
                                background: '#f8fafc'
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#dc2626',
                            fontSize: '13px',
                            background: '#fef2f2',
                            padding: '10px 14px',
                            borderRadius: '10px'
                        }}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'var(--primary)',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: 700,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            marginTop: '8px',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
                        © {new Date().getFullYear()} PharmaCare · Oncológicos
                    </p>
                </div>
            </div>
        </div>
    );
}
