import { useState } from 'react';
import { Search, Download, Eye, X, Plus, Pencil, Trash2 } from 'lucide-react';
import type { Paciente } from '../data/mockData';
import { getEstadoBadge } from '../data/mockData';
import * as XLSX from 'xlsx';
import ConfirmModal from '../components/ConfirmModal';
import PacienteFormModal from '../components/PacienteFormModal';

interface PacientesProps {
    pacientes: Paciente[];
    onAddPatient?: (p: Paciente) => Promise<void>;
    onEditPatient?: (p: Paciente, originalId?: string) => Promise<void>;
    onDeletePatient?: (id: string) => Promise<void>;
    onDeleteBatch?: (ids: string[]) => Promise<void>;
    epsList: string[];
}

export default function Pacientes({ pacientes, onAddPatient, onEditPatient, onDeletePatient, onDeleteBatch, epsList }: PacientesProps) {
    const [search, setSearch] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [page, setPage] = useState(1);
    const [selectedPatient, setSelectedPatient] = useState<Paciente | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // CRUD state
    const [showForm, setShowForm] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Paciente | null>(null);
    const [deletingPatient, setDeletingPatient] = useState<Paciente | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const perPage = 10;

    const filtered = pacientes.filter(p => {
        const searchTerm = search.toLowerCase();

        const matchSearch = !search ||
            (p.nombreCompleto && p.nombreCompleto.toLowerCase().includes(searchTerm)) ||
            (p.numeroId && p.numeroId.toString().includes(searchTerm)) ||
            (p.medicamento && p.medicamento.toLowerCase().includes(searchTerm));

        const matchEstado = !filterEstado || p.estado === filterEstado;
        return matchSearch && matchEstado;
    });

    const paginated = filtered.slice((page - 1) * perPage, page * perPage);
    const totalPages = Math.ceil(filtered.length / perPage);

    // Selection helpers
    const allPageSelected = paginated.length > 0 && paginated.every(p => selectedIds.has(p.numeroId));
    const someSelected = selectedIds.size > 0;

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (allPageSelected) {
            setSelectedIds(prev => {
                const next = new Set(prev);
                paginated.forEach(p => next.delete(p.numeroId));
                return next;
            });
        } else {
            setSelectedIds(prev => {
                const next = new Set(prev);
                paginated.forEach(p => next.add(p.numeroId));
                return next;
            });
        }
    };

    // CRUD handlers
    const handleSavePatient = async (p: Paciente, originalId?: string) => {
        if (editingPatient && onEditPatient) {
            await onEditPatient(p, originalId);
        } else if (onAddPatient) {
            await onAddPatient(p);
        }
        setEditingPatient(null);
        setShowForm(false);
    };

    const handleDeleteSingle = async () => {
        if (!deletingPatient || !onDeletePatient) return;
        setActionLoading(true);
        try {
            await onDeletePatient(deletingPatient.numeroId);
        } catch (err) {
            console.error('Error eliminando paciente:', err);
        } finally {
            setActionLoading(false);
            setDeletingPatient(null);
        }
    };

    const handleDeleteBulk = async () => {
        if (!onDeleteBatch || selectedIds.size === 0) return;
        setActionLoading(true);
        try {
            await onDeleteBatch(Array.from(selectedIds));
            setSelectedIds(new Set());
        } catch (err) {
            console.error('Error eliminando pacientes:', err);
        } finally {
            setActionLoading(false);
            setShowBulkDeleteConfirm(false);
        }
    };

    const handleExportCSV = () => {
        // Preparar datos para exportación con etiquetas en español
        const exportData = filtered.map(p => ({
            'Nombre Completo': p.nombreCompleto,
            'Tipo de ID': p.tipoId,
            'Número de Identificación': p.numeroId,
            'Edad': p.edad,
            'Género': p.sexo === 'M' ? 'Masculino' : 'Femenino',
            'Fecha de Nacimiento': p.fechaNacimiento,
            'EPS': p.eps,
            'Municipio': p.municipio,
            'Teléfono': p.telefono,
            'Medicamento': p.medicamento,
            'Dosis': p.dosisEstandar,
            'Estado Actual': getEstadoBadge(p.estado).label,
            'Total Entregas (Año)': Object.keys(p.entregas).length
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Usar punto y coma (;) como separador para Excel en LatAm/España
        const csvContent = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });

        // Agregar BOM (\ufeff) para soporte de caracteres especiales y descarga vía Blob
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        const dateStr = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
        link.setAttribute('href', url);
        link.setAttribute('download', `Listado_Pacientes_PharmaCare_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setIsExportModalOpen(false);
    };

    return (
        <div className="fade-in">
            {/* Search & Filter Toolbar */}
            <div className="card" style={{ marginBottom: 24, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                    <div className="header-search" style={{ width: 320, background: 'var(--bg-body)' }}>
                        <Search size={18} color="var(--text-secondary)" />
                        <input
                            type="text"
                            placeholder="Buscar paciente..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            style={{ background: 'transparent' }}
                        />
                    </div>

                    <select
                        className="header-search"
                        style={{ width: 200, appearance: 'none', background: 'var(--bg-body)', cursor: 'pointer' }}
                        value={filterEstado}
                        onChange={e => { setFilterEstado(e.target.value); setPage(1); }}
                    >
                        <option value="">Todos los estados</option>
                        <option value="AC ONC">Activo Oral</option>
                        <option value="ACT ONC QXT">Activo + QXT</option>
                        <option value="ACT NO ONC">Activo No Onc.</option>
                        <option value="IN S">Suspendido</option>
                        <option value="IN ST">Inactivo Temporal</option>
                        <option value="IN F">Fallecido</option>
                        <option value="IN EPS">Cambio EPS</option>
                        <option value="IN C">Inactivo</option>
                        <option value="IN R">Cambio Residencia</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                        style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 30, background: '#16a34a', color: 'white', border: 'none', padding: '10px 22px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                        onClick={() => { setEditingPatient(null); setShowForm(true); }}
                    >
                        <Plus size={16} />
                        Nuevo Paciente
                    </button>
                    <button
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 30 }}
                        onClick={() => setIsExportModalOpen(true)}
                    >
                        <Download size={16} />
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {someSelected && (
                <div className="card fade-in" style={{
                    marginBottom: 16, padding: '14px 24px', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', background: '#eff6ff', border: '1.5px solid #bfdbfe'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600, color: '#1e40af' }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%', background: '#3b82f6',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 13
                        }}>
                            {selectedIds.size}
                        </div>
                        {selectedIds.size === 1 ? 'paciente seleccionado' : 'pacientes seleccionados'}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setSelectedIds(new Set())} style={{
                            padding: '8px 18px', background: 'white', border: '1px solid var(--gray-300)',
                            borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: 'var(--gray-600)'
                        }}>
                            Deseleccionar
                        </button>
                        <button onClick={() => setShowBulkDeleteConfirm(true)} style={{
                            padding: '8px 18px', background: '#ef4444', border: 'none',
                            borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: 'white',
                            display: 'flex', alignItems: 'center', gap: 6
                        }}>
                            <Trash2 size={14} />
                            Eliminar seleccionados
                        </button>
                    </div>
                </div>
            )}

            {/* Modern Table Card */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--gray-100)' }}>
                    <h3 className="card-title">Listado de Pacientes</h3>
                    <p className="card-subtitle">{filtered.length} registros encontrados</p>
                </div>

                <table className="data-table">
                    <thead>
                        <tr style={{ background: 'var(--gray-50)' }}>
                            <th style={{ paddingLeft: 24, width: 44 }}>
                                <input
                                    type="checkbox"
                                    checked={allPageSelected}
                                    onChange={toggleSelectAll}
                                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }}
                                    title="Seleccionar todos"
                                />
                            </th>
                            <th>Paciente</th>
                            <th>EPS / Municipio</th>
                            <th>Medicamento</th>
                            <th>Estado</th>
                            <th>Entregas Año</th>
                            <th style={{ paddingRight: 32, textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map(p => {
                            const badge = getEstadoBadge(p.estado);
                            const entregasCount = Object.keys(p.entregas).length;
                            const isSelected = selectedIds.has(p.numeroId);
                            return (
                                <tr key={p.id} style={{ transition: 'background 0.2s', background: isSelected ? '#f0f5ff' : undefined }}>
                                    <td style={{ paddingLeft: 24 }}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelect(p.numeroId)}
                                            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }}
                                        />
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: '50%', background: '#e0e7ff',
                                                color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 700, fontSize: 13
                                            }}>
                                                {(() => {
                                                    const parts = p.nombreCompleto.split(' ').filter(Boolean);
                                                    if (parts.length === 0) return '?';
                                                    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
                                                })()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.nombreCompleto}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ID: {p.numeroId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{p.eps}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.municipio}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{p.medicamento}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.dosisEstandar}</div>
                                    </td>
                                    <td>
                                        <span className={`badge ${badge.badgeClass}`}>{badge.label}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{entregasCount}</span>
                                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>/ 12 mes</span>
                                        </div>
                                    </td>
                                    <td style={{ paddingRight: 32, textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                            <button
                                                onClick={() => setSelectedPatient(p)}
                                                style={{
                                                    background: 'var(--primary-light)', border: 'none', cursor: 'pointer',
                                                    color: 'var(--primary)', padding: 7, borderRadius: 8,
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                title="Ver detalle"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => { setEditingPatient(p); setShowForm(true); }}
                                                style={{
                                                    background: '#f0fdf4', border: 'none', cursor: 'pointer',
                                                    color: '#16a34a', padding: 7, borderRadius: 8,
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                title="Editar paciente"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeletingPatient(p)}
                                                style={{
                                                    background: '#fef2f2', border: 'none', cursor: 'pointer',
                                                    color: '#dc2626', padding: 7, borderRadius: 8,
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                title="Eliminar paciente"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Pagination Footer */}
                <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--gray-50)' }}>
                    <button
                        disabled={page === 1} onClick={() => setPage(p => p - 1)}
                        style={{ padding: '8px 16px', border: '1px solid var(--gray-200)', borderRadius: 12, background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? 'var(--gray-400)' : 'inherit' }}
                    >
                        Anterior
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 13, color: 'var(--text-secondary)' }}>
                        Página {page} de {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                        style={{ padding: '8px 16px', border: 'none', borderRadius: 12, background: page === totalPages ? 'var(--gray-200)' : 'var(--primary)', color: page === totalPages ? 'var(--gray-500)' : 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {/* Patient Detail Modal */}
            {selectedPatient && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, backdropFilter: 'blur(4px)'
                }}>
                    <div className="card fade-in" style={{ width: 850, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: 0, position: 'relative', borderRadius: 24 }}>
                        <div style={{ padding: 24, borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 className="card-title" style={{ margin: 0 }}>Detalle del Paciente</h3>
                            <button
                                onClick={() => setSelectedPatient(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', padding: 4 }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ padding: 32 }}>
                            {/* Header Info */}
                            <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: '50%', background: 'var(--primary-light)',
                                    color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: 32, flexShrink: 0
                                }}>
                                    {selectedPatient.nombreCompleto.charAt(0)}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>{selectedPatient.nombreCompleto}</h2>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <span className={`badge ${getEstadoBadge(selectedPatient.estado).badgeClass}`}>
                                            {getEstadoBadge(selectedPatient.estado).label}
                                        </span>
                                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--gray-100)', padding: '4px 8px', borderRadius: 6 }}>
                                            ID: {selectedPatient.numeroId}
                                        </span>
                                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                            {selectedPatient.tipoId}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                {/* Personal Info */}
                                <div>
                                    <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 16 }}>Información Personal</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Edad</span>
                                            <span style={{ fontWeight: 500 }}>{selectedPatient.edad} años</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Sexo</span>
                                            <span style={{ fontWeight: 500 }}>{selectedPatient.sexo === 'F' ? 'Femenino' : 'Masculino'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Fecha Nacimiento</span>
                                            <span style={{ fontWeight: 500 }}>{selectedPatient.fechaNacimiento}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Municipio</span>
                                            <span style={{ fontWeight: 500 }}>{selectedPatient.municipio}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Teléfono</span>
                                            <span style={{ fontWeight: 500 }}>{selectedPatient.telefono}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Affiliation Info */}
                                <div>
                                    <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 16 }}>Afiliación</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>EPS</span>
                                            <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '70%' }}>{selectedPatient.eps}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Treatment Info */}
                            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--gray-100)' }}>
                                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 16 }}>Tratamiento Actual</h4>
                                <div style={{ background: 'var(--bg-body)', padding: 20, borderRadius: 16, border: '1px solid var(--gray-200)' }}>
                                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16, marginBottom: 4 }}>{selectedPatient.medicamento}</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{selectedPatient.dosisEstandar}</div>
                                        </div>
                                        <span style={{ background: 'white', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid var(--gray-200)' }}>
                                            Oral
                                        </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div style={{ background: 'white', padding: 12, borderRadius: 10 }}>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Días Administración</div>
                                            <div style={{ fontWeight: 700 }}>{selectedPatient.diasAdministracion}</div>
                                        </div>
                                        <div style={{ background: 'white', padding: 12, borderRadius: 10 }}>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Días Descanso</div>
                                            <div style={{ fontWeight: 700 }}>{selectedPatient.diasDescanso}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: 20, background: 'var(--gray-50)', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'flex-end', gap: 10, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
                            <button
                                onClick={() => {
                                    setSelectedPatient(null);
                                    setEditingPatient(selectedPatient);
                                    setShowForm(true);
                                }}
                                className="btn-primary"
                                style={{ padding: '10px 24px', borderRadius: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <Pencil size={14} />
                                Editar
                            </button>
                            <button
                                onClick={() => setSelectedPatient(null)}
                                style={{ padding: '10px 24px', background: 'white', border: '1px solid var(--gray-300)', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Patient Modal */}
            <PacienteFormModal
                isOpen={showForm}
                onClose={() => { setShowForm(false); setEditingPatient(null); }}
                onSave={handleSavePatient}
                paciente={editingPatient}
                epsList={epsList}
            />

            {/* Delete Single Confirmation Modal */}
            <ConfirmModal
                isOpen={!!deletingPatient}
                onClose={() => setDeletingPatient(null)}
                onConfirm={handleDeleteSingle}
                title="Eliminar Paciente"
                message={`¿Estás seguro que deseas eliminar a ${deletingPatient?.nombreCompleto || ''}? Esta acción no se puede deshacer.`}
                confirmText={actionLoading ? 'Eliminando...' : 'Eliminar'}
                cancelText="Cancelar"
                type="danger"
            />

            {/* Bulk Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showBulkDeleteConfirm}
                onClose={() => setShowBulkDeleteConfirm(false)}
                onConfirm={handleDeleteBulk}
                title="Eliminar Pacientes"
                message={`Se eliminarán ${selectedIds.size} pacientes seleccionados. Esta acción no se puede deshacer. ¿Deseas continuar?`}
                confirmText={actionLoading ? 'Eliminando...' : `Eliminar ${selectedIds.size} pacientes`}
                cancelText="Cancelar"
                type="danger"
            />

            {/* Export Confirmation Modal */}
            <ConfirmModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onConfirm={handleExportCSV}
                title="Confirmar exportación"
                message={`Se generará un archivo CSV con la información de los ${filtered.length} pacientes filtrados. ¿Deseas continuar con la descarga?`}
                confirmText="Exportar ahora"
                cancelText="Cancelar"
                type="info"
            />
        </div>
    );
}
