import { useState, useMemo, useEffect } from 'react';
import { Search, Building2, Trash2, Plus, Pencil, CheckCircle, XCircle, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { EntidadInfo } from '../services/epsService';
import ConfirmModal from '../components/ConfirmModal';
import EntidadFormModal from '../components/EntidadFormModal';

interface EntidadesProps {
    entidades: EntidadInfo[];
    onAddEntidad?: (e: EntidadInfo) => Promise<void>;
    onEditEntidad?: (e: EntidadInfo, originalNombre?: string) => Promise<void>;
    onDeleteEntidad?: (nombre: string) => Promise<void>;
    onDeleteBatch?: (nombres: string[]) => Promise<void>;
}

export default function Entidades({
    entidades,
    onAddEntidad,
    onEditEntidad,
    onDeleteEntidad,
    onDeleteBatch
}: EntidadesProps) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Sorting and Pagination state
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortCol, setSortCol] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    // CRUD state
    const [showForm, setShowForm] = useState(false);
    const [editingEntidad, setEditingEntidad] = useState<EntidadInfo | null>(null);
    const [deletingEntidad, setDeletingEntidad] = useState<EntidadInfo | null>(null);
    const [selectedNombres, setSelectedNombres] = useState<Set<string>>(new Set());
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const filteredAndSorted = useMemo(() => {
        let filtered = entidades.filter(e =>
            !search || e.nombre.toLowerCase().includes(search.toLowerCase()) || (e.nit && e.nit.includes(search))
        );

        if (sortCol) {
            filtered.sort((a: any, b: any) => {
                const valA = a[sortCol] || '';
                const valB = b[sortCol] || '';

                if (typeof valA === 'string') {
                    const cmp = valA.localeCompare(valB, 'es', { sensitivity: 'base' });
                    return sortDir === 'asc' ? cmp : -cmp;
                }
                return sortDir === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
            });
        }

        return filtered;
    }, [entidades, search, sortCol, sortDir]);

    const paginated = useMemo(() => {
        return filteredAndSorted.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    }, [filteredAndSorted, page, itemsPerPage]);

    const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);

    // Reset to page 1 when data changes
    useEffect(() => {
        setPage(1);
    }, [search, itemsPerPage]);

    const handleSort = (col: string) => {
        if (sortCol === col) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortCol(col);
            setSortDir('asc');
        }
    };

    const sortIcon = (col: string) => {
        if (sortCol !== col) return <span style={{ opacity: 0.3, marginLeft: 6, fontSize: 13 }}>⇅</span>;
        return <span style={{ marginLeft: 6, fontSize: 13 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
    };

    // Selection helpers
    const allPageSelected = paginated.length > 0 && paginated.every(e => selectedNombres.has(e.nombre));
    const someSelected = selectedNombres.size > 0;

    const toggleSelect = (nombre: string) => {
        setSelectedNombres(prev => {
            const next = new Set(prev);
            if (next.has(nombre)) next.delete(nombre);
            else next.add(nombre);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (allPageSelected) {
            setSelectedNombres(prev => {
                const next = new Set(prev);
                paginated.forEach(e => next.delete(e.nombre));
                return next;
            });
        } else {
            setSelectedNombres(prev => {
                const next = new Set(prev);
                paginated.forEach(e => next.add(e.nombre));
                return next;
            });
        }
    };

    // CRUD handlers
    const handleSaveEntidad = async (e: EntidadInfo, originalNombre?: string) => {
        if (editingEntidad && onEditEntidad) {
            await onEditEntidad(e, originalNombre);
        } else if (onAddEntidad) {
            await onAddEntidad(e);
        }
    };

    const handleDeleteSingle = async () => {
        if (!deletingEntidad || !onDeleteEntidad) return;
        setActionLoading(true);
        try {
            await onDeleteEntidad(deletingEntidad.nombre);
        } catch (err) {
            console.error('Error eliminando entidad:', err);
        } finally {
            setActionLoading(false);
            setDeletingEntidad(null);
        }
    };

    const handleDeleteBulk = async () => {
        if (!onDeleteBatch || selectedNombres.size === 0) return;
        setActionLoading(true);
        try {
            await onDeleteBatch(Array.from(selectedNombres));
            setSelectedNombres(new Set());
        } catch (err) {
            console.error('Error eliminando entidades:', err);
        } finally {
            setActionLoading(false);
            setShowBulkDeleteConfirm(false);
        }
    };

    return (
        <div className="fade-in">
            {/* Toolbar */}
            <div className="card" style={{ marginBottom: 24, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                    <div className="header-search" style={{ width: 400, background: 'var(--bg-body)' }}>
                        <Search size={18} color="var(--text-secondary)" />
                        <input
                            type="text"
                            placeholder="Buscar entidad o NIT..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            style={{ background: 'transparent' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginRight: 'auto', marginLeft: 16 }}>
                    <span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 500 }}>Mostrar</span>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={itemsPerPage}
                            onChange={e => { setItemsPerPage(Number(e.target.value)); setPage(1); }}
                            style={{
                                padding: '7px 32px 7px 12px', borderRadius: 10,
                                border: '1.5px solid #c7d2fe', fontSize: 12,
                                fontWeight: 700, color: '#4f46e5',
                                background: '#eef2ff',
                                cursor: 'pointer', outline: 'none', appearance: 'none',
                            }}
                        >
                            <option value={10}>10 / página</option>
                            <option value={25}>25 / página</option>
                            <option value={50}>50 / página</option>
                            <option value={100}>100 / página</option>
                        </select>
                        <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#4f46e5', pointerEvents: 'none' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, borderRadius: 30,
                            background: '#16a34a', color: 'white', border: 'none',
                            padding: '10px 22px', fontWeight: 600, fontSize: 14, cursor: 'pointer'
                        }}
                        onClick={() => { setEditingEntidad(null); setShowForm(true); }}
                    >
                        <Plus size={16} />
                        Nueva Entidad
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
                            {selectedNombres.size}
                        </div>
                        {selectedNombres.size === 1 ? 'entidad seleccionada' : 'entidades seleccionadas'}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setSelectedNombres(new Set())} style={{
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

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--gray-100)' }}>
                    <h3 className="card-title">Listado de Entidades / EPS</h3>
                    <p className="card-subtitle">{filteredAndSorted.length} entidades registradas</p>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr style={{ background: 'var(--gray-50)' }}>
                                <th style={{ paddingLeft: 24, width: 44 }}>
                                    <input
                                        type="checkbox"
                                        checked={allPageSelected}
                                        onChange={toggleSelectAll}
                                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }}
                                    />
                                </th>
                                {([
                                    { key: 'nombre', label: 'Nombre Entidad' },
                                    { key: 'nit', label: 'NIT' },
                                    { key: 'tipo', label: 'Tipo' },
                                    { key: 'activo', label: 'Estado' },
                                ] as { key: string; label: string }[]).map(col => (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.key)}
                                        style={{
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            color: sortCol === col.key ? 'var(--primary)' : 'var(--gray-500)',
                                            whiteSpace: 'nowrap',
                                            textAlign: (col.key === 'tipo' || col.key === 'activo') ? 'center' : 'left'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: (col.key === 'tipo' || col.key === 'activo') ? 'center' : 'flex-start' }}>
                                            {col.label}
                                            {sortIcon(col.key)}
                                        </div>
                                    </th>
                                ))}
                                <th style={{ paddingRight: 32, textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((e, idx) => {
                                const isSelected = selectedNombres.has(e.nombre);
                                return (
                                    <tr key={idx} style={{ transition: 'background 0.2s', background: isSelected ? '#f0f5ff' : undefined }}>
                                        <td style={{ paddingLeft: 24 }}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(e.nombre)}
                                                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }}
                                            />
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 13 }}>
                                            {e.nombre}
                                        </td>
                                        <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{e.nit || '---'}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                                background: e.tipo === 'Otro' ? '#f3f4f6' : '#e0f2fe',
                                                color: e.tipo === 'Otro' ? '#4b5563' : '#0369a1'
                                            }}>
                                                {e.tipo}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                {e.activo ? (
                                                    <><CheckCircle size={14} color="#16a34a" /> <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 600 }}>Activo</span></>
                                                ) : (
                                                    <><XCircle size={14} color="#dc2626" /> <span style={{ color: '#dc2626', fontSize: 12, fontWeight: 600 }}>Inactivo</span></>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ paddingRight: 32, textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => { setEditingEntidad(e); setShowForm(true); }}
                                                    style={{
                                                        background: '#f0fdf4', border: 'none', cursor: 'pointer',
                                                        color: '#16a34a', padding: 7, borderRadius: 8,
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingEntidad(e)}
                                                    style={{
                                                        background: '#fef2f2', border: 'none', cursor: 'pointer',
                                                        color: '#dc2626', padding: 7, borderRadius: 8,
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                    title="Eliminar"
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
                </div>
                {/* Pagination */}
                <div style={{
                    padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#f8fafc', borderTop: '1px solid var(--gray-100)'
                }}>
                    <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 500 }}>
                        Total: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{filteredAndSorted.length}</span> registros encontrados
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                                border: '1.5px solid var(--gray-200)', borderRadius: 12, background: 'white',
                                cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 600,
                                color: page === 1 ? 'var(--gray-400)' : 'var(--gray-700)',
                                opacity: page === 1 ? 0.6 : 1
                            }}
                        >
                            <ChevronLeft size={16} />
                            Anterior
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', minWidth: 100, textAlign: 'center' }}>
                            Página {page} de {Math.max(1, totalPages)}
                        </span>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                                border: '1.5px solid var(--gray-200)', borderRadius: 12, background: 'white',
                                cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontWeight: 600,
                                color: page >= totalPages ? 'var(--gray-400)' : 'var(--gray-700)',
                                opacity: page >= totalPages ? 0.6 : 1
                            }}
                        >
                            Siguiente
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <EntidadFormModal
                isOpen={showForm}
                onClose={() => { setShowForm(false); setEditingEntidad(null); }}
                onSave={handleSaveEntidad}
                entidad={editingEntidad}
            />

            <ConfirmModal
                isOpen={!!deletingEntidad}
                onClose={() => setDeletingEntidad(null)}
                onConfirm={handleDeleteSingle}
                title="Eliminar Entidad"
                message={`¿Estás seguro de que deseas eliminar la entidad "${deletingEntidad?.nombre}"? Esta acción no se puede deshacer.`}
                confirmText={actionLoading ? 'Eliminando...' : 'Eliminar'}
                type="danger"
            />

            <ConfirmModal
                isOpen={showBulkDeleteConfirm}
                onClose={() => setShowBulkDeleteConfirm(false)}
                onConfirm={handleDeleteBulk}
                title="Eliminar Entidades"
                message={`Se eliminarán ${selectedNombres.size} entidades seleccionadas. ¿Deseas continuar?`}
                confirmText={actionLoading ? 'Eliminando...' : `Eliminar ${selectedNombres.size}`}
                type="danger"
            />
        </div>
    );
}
