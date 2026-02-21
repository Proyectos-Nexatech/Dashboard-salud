import {
    LayoutDashboard, Users, AlertTriangle, FileText, ChevronRight, Settings, Pill, Building2, PackageCheck
} from 'lucide-react';

interface SidebarProps {
    activePage: string;
    onNavigate: (page: string) => void;
    sidebarOpen?: boolean;
}

const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'pacientes', icon: Users, label: 'Pacientes' },
    { id: 'medicamentos', icon: Pill, label: 'Medicamentos' },
    { id: 'entidades', icon: Building2, label: 'Entidades' },
    { id: 'despachos', icon: PackageCheck, label: 'Control Despachos' },
    { id: 'reportes', icon: FileText, label: 'Reportes' },
    { id: 'riesgos', icon: AlertTriangle, label: 'Riesgos' },
];

export default function Sidebar({ activePage, onNavigate, sidebarOpen = false }: SidebarProps) {
    return (
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            {/* Logo */}
            <div className="sidebar-logo">
                <div style={{ width: 32, height: 32, background: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: 18 }}>P</span>
                </div>
                <span>PharmaCare</span>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map(item => {
                    const isActive = activePage === item.id;
                    return (
                        <div key={item.id} style={{ position: 'relative', paddingRight: 0 }}>
                            {/* Curve effect container is handled by CSS ::before/::after on .active */}
                            <button
                                className={`sidebar-item ${isActive ? 'active' : ''}`}
                                onClick={() => onNavigate(item.id)}
                                title={item.label}
                                style={{
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    paddingLeft: 32,
                                    borderTopRightRadius: 0,
                                    borderBottomRightRadius: 0,
                                    borderTopLeftRadius: 30,
                                    borderBottomLeftRadius: 30,
                                    marginLeft: 16
                                }}
                            >
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: 36, height: 36, borderRadius: 10,
                                    background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                    color: isActive ? 'white' : 'inherit',
                                    transition: 'all 0.3s'
                                }}>
                                    <item.icon size={18} />
                                </div>
                                <span style={{
                                    marginLeft: 12, fontSize: 15, fontWeight: isActive ? 700 : 500,
                                    color: isActive ? 'var(--text-main)' : 'rgba(255,255,255,0.7)'
                                }}>
                                    {item.label}
                                </span>

                                {isActive && <ChevronRight size={16} style={{ marginLeft: 'auto', marginRight: 20, color: 'var(--primary)' }} />}
                            </button>
                        </div>
                    );
                })}
            </nav>

            {/* Bottom Section */}

            <div style={{ marginTop: 'auto', padding: '0 32px 20px' }}>
                <button className="sidebar-item" style={{ paddingLeft: 0, color: 'rgba(255,255,255,0.6)' }} onClick={() => onNavigate('configuracion')}>
                    <Settings size={20} />
                    <span style={{ marginLeft: 12 }}>Configuración</span>
                </button>
            </div>
        </aside>
    );
}
