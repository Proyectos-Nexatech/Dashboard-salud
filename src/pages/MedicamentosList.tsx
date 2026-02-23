import { useState, useMemo, useEffect } from 'react';
import { Search, Upload, FileDown, X, FileSpreadsheet, CheckCircle, AlertCircle, Trash2, Plus, Pencil, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { MedicamentoInfo } from '../data/medicamentosData';
import ConfirmModal from '../components/ConfirmModal';
import MedicamentoFormModal from '../components/MedicamentoFormModal';
import * as XLSX from 'xlsx';


interface MedicamentosProps {
    medicamentos: MedicamentoInfo[];
    onAddMed?: (m: MedicamentoInfo) => Promise<void>;
    onEditMed?: (m: MedicamentoInfo, originalName?: string) => Promise<void>;
    onDeleteMed?: (name: string) => Promise<void>;
    onDeleteBatch?: (names: string[]) => Promise<void>;
}

export default function MedicamentosList({
    medicamentos,
    onAddMed,
    onEditMed,
    onDeleteMed,
    onDeleteBatch
}: MedicamentosProps) {
    const [search, setSearch] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [uploadMsg, setUploadMsg] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [page, setPage] = useState(1);

    // Sorting and Pagination state
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortCol, setSortCol] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    // CRUD state
    const [showForm, setShowForm] = useState(false);
    const [editingMed, setEditingMed] = useState<MedicamentoInfo | null>(null);
    const [deletingMed, setDeletingMed] = useState<MedicamentoInfo | null>(null);
    const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const filteredAndSorted = useMemo(() => {
        let filtered = medicamentos.filter(m =>
            !search || m.medicamento.toLowerCase().includes(search.toLowerCase())
        );

        if (sortCol) {
            filtered.sort((a: any, b: any) => {
                const valA = a[sortCol];
                const valB = b[sortCol];

                if (typeof valA === 'string') {
                    const cmp = valA.localeCompare(valB, 'es', { sensitivity: 'base' });
                    return sortDir === 'asc' ? cmp : -cmp;
                }
                return sortDir === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
            });
        }

        return filtered;
    }, [medicamentos, search, sortCol, sortDir]);

    const paginated = useMemo(() => {
        return filteredAndSorted.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    }, [filteredAndSorted, page, itemsPerPage]);

    const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);

    // Reset to page 1 when data changes
    useEffect(() => {
        setPage(1);
    }, [search, itemsPerPage]);

    const formatCurrency = (val: any) => {
        const num = Number(val);
        if (isNaN(num)) return '$ 0';
        return `$ ${num.toLocaleString('es-CO')}`;
    };

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
    const allPageSelected = paginated.length > 0 && paginated.every(m => selectedNames.has(m.medicamento));
    const someSelected = selectedNames.size > 0;

    const toggleSelect = (name: string) => {
        setSelectedNames(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (allPageSelected) {
            setSelectedNames(prev => {
                const next = new Set(prev);
                paginated.forEach(m => next.delete(m.medicamento));
                return next;
            });
        } else {
            setSelectedNames(prev => {
                const next = new Set(prev);
                paginated.forEach(m => next.add(m.medicamento));
                return next;
            });
        }
    };

    // CRUD handlers
    const handleSaveMed = async (m: MedicamentoInfo, originalName?: string) => {
        console.log('Attempting to save medication:', { m, originalName });
        try {
            if (editingMed && onEditMed) {
                console.log('Calling onEditMed...');
                await onEditMed(m, originalName);
            } else if (onAddMed) {
                console.log('Calling onAddMed...');
                await onAddMed(m);
            }
            console.log('Save successful, closing form.');
            setShowForm(false);
            setEditingMed(null);
        } catch (err) {
            console.error('Error in handleSaveMed:', err);
            alert('Error al guardar el medicamento. Por favor revise la consola.');
        }
    };

    const handleDeleteSingle = async () => {
        if (!deletingMed || !onDeleteMed) return;
        setActionLoading(true);
        try {
            await onDeleteMed(deletingMed.medicamento);
        } catch (err) {
            console.error('Error eliminando medicamento:', err);
        } finally {
            setActionLoading(false);
            setDeletingMed(null);
        }
    };

    const handleDeleteBulk = async () => {
        if (!onDeleteBatch || selectedNames.size === 0) return;
        setActionLoading(true);
        try {
            await onDeleteBatch(Array.from(selectedNames));
            setSelectedNames(new Set());
        } catch (err) {
            console.error('Error eliminando medicamentos:', err);
        } finally {
            setActionLoading(false);
            setShowBulkDeleteConfirm(false);
        }
    };

    const handleClearIncomplete = async () => {
        if (!onDeleteBatch) return;

        const medsToDelete = medicamentos.filter(m =>
            (Number(m.presentacionComercial) === 0 || !m.presentacionComercial) &&
            (!m.dosisEstandar || m.dosisEstandar.trim() === '')
        ).map(m => m.medicamento);

        if (medsToDelete.length === 0) {
            alert('No hay medicamentos incompletos para borrar.');
            setShowClearConfirm(false);
            return;
        }

        setActionLoading(true);
        try {
            await onDeleteBatch(medsToDelete);
            setShowClearConfirm(false);
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = [
            'ATC',
            'DESCRIPCION_ATC',
            'PRECIO_COMPRA',
            'PRECIO_VENTA'
        ];
        const example = [
            'L01EF03', 'ABEMACILIB X 150 MILIGRAMOS', '1250000', '1800000'
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers, example]);
        ws['!cols'] = [{ wch: 20 }, { wch: 50 }, { wch: 20 }, { wch: 20 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Medicamentos");
        XLSX.writeFile(wb, "Plantilla_Medicamentos.xlsx");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadStatus('loading');
        setUploadMsg('Preparando archivo...');
        setUploadProgress(0);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                const wb = XLSX.read(data, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

                if (rows.length < 2) throw new Error("Archivo vacío o formato incorrecto");

                const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
                const headers = rows[0].map((h: any) => normalize(String(h || '')));

                const getColIdx = (name: string, aliases: string[] = [], isDescription = false) => {
                    const target = normalize(name);
                    const alts = aliases.map(normalize);

                    // 1. Prioridad: Coincidencia exacta
                    const exactIdx = headers.findIndex((h: string) => {
                        if (isDescription && (h.includes('COMERCIAL') || h.includes('PRODUCTO') || h.includes('MARCA'))) return false;
                        return h === target || alts.some(a => h === a);
                    });
                    if (exactIdx !== -1) return exactIdx;

                    // 2. Coincidencia parcial
                    return headers.findIndex((h: string) => {
                        if (isDescription && (h.includes('COMERCIAL') || h.includes('PRODUCTO') || h.includes('MARCA'))) return false;
                        return h.includes(target) || alts.some(a => h.includes(a));
                    });
                };

                const idxAtc = getColIdx('ATC', ['CODIGO']);
                const idxDesc = getColIdx('DESCRIPCION_ATC', ['MEDICAMENTO', 'GENERICO'], true);
                const idxPrecioC = getColIdx('PRECIO_COMPRA', ['COMPRA', 'COSTO', 'P_COMPRA', 'PRECIO_COMPRA']);
                const idxPrecioV = getColIdx('PRECIO_VENTA', ['VENTA', 'P_VENTA', 'PRECIO_VENTA']);

                if (idxAtc === -1 || idxDesc === -1) {
                    console.log("Headers detectados:", headers);
                    throw new Error("No se encontraron las columnas necesarias (ATC y DESCRIPCIÓN_ATC)");
                }

                let totalAdded = 0;
                let totalSkipped = 0;
                const totalRows = rows.length - 1;

                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row[idxAtc] || !row[idxDesc]) {
                        totalSkipped++;
                        continue;
                    }

                    const m: MedicamentoInfo = {
                        atc: String(row[idxAtc]).toUpperCase().trim(),
                        medicamento: String(row[idxDesc]).toUpperCase().trim(),
                        presentacionComercial: 0,
                        dosisEstandar: '',
                        diasAdministracion: 0,
                        diasDescanso: 0,
                        total: 0,
                        frecuenciaEntrega: 0,
                        precioCompra: idxPrecioC !== -1 ? Number(row[idxPrecioC]) || 0 : 0,
                        precioVenta: idxPrecioV !== -1 ? Number(row[idxPrecioV]) || 0 : 0
                    };

                    // Verificar si ya existe (con checks defensivos)
                    const exists = medicamentos.some(existing => {
                        const existingAtc = (existing.atc || '').toUpperCase().trim();
                        const existingMed = (existing.medicamento || '').toUpperCase().trim();
                        return existingAtc === m.atc && existingMed === m.medicamento;
                    });

                    if (exists) {
                        totalSkipped++;
                    } else if (onAddMed) {
                        try {
                            await onAddMed(m);
                            totalAdded++;
                        } catch (e) {
                            console.error("Error al agregar fila ", i, e);
                            totalSkipped++;
                        }
                    } else {
                        totalSkipped++;
                    }

                    setUploadProgress(Math.round((i / totalRows) * 100));
                }

                setUploadStatus('success');
                setUploadMsg(`Proceso completado: ${totalAdded} nuevos, ${totalSkipped} saltados (duplicados o incompletos).`);
                setTimeout(() => {
                    setShowUploadModal(false);
                    setUploadStatus('idle');
                    setUploadProgress(0);
                }, 4000);

            } catch (err: any) {
                console.error(err);
                setUploadStatus('error');
                setUploadMsg(err.message || 'Error al procesar el archivo');
            }
        };
        reader.readAsArrayBuffer(file);
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
                            placeholder="Buscar medicamento..."
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
                        style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 30, background: '#16a34a', color: 'white', border: 'none', padding: '10px 22px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                        onClick={() => { setEditingMed(null); setShowForm(true); }}
                    >
                        <Plus size={16} />
                        Nuevo Medicamento
                    </button>
                    <button
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 30 }}
                        onClick={() => setShowUploadModal(true)}
                    >
                        <Upload size={16} />
                        Cargar Excel
                    </button>
                    <button
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 30, background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca' }}
                        onClick={() => setShowClearConfirm(true)}
                    >
                        <Trash2 size={16} />
                        Limpiar Lista
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
                            {selectedNames.size}
                        </div>
                        {selectedNames.size === 1 ? 'medicamento seleccionado' : 'medicamentos seleccionados'}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setSelectedNames(new Set())} style={{
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
                    <h3 className="card-title">Listado de Medicamentos</h3>
                    <p className="card-subtitle">{filteredAndSorted.length} medicamentos encontrados</p>
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
                                    { key: 'atc', label: 'Código ATC', align: 'center' },
                                    { key: 'medicamento', label: 'Medicamento' },
                                    { key: 'presentacionComercial', label: 'Presentación', align: 'center' },
                                    { key: 'precioCompra', label: 'P. Compra', align: 'right' },
                                    { key: 'precioVenta', label: 'P. Venta', align: 'right' },
                                    { key: 'dosisEstandar', label: 'Dosis Estándar' },
                                    { key: 'diasAdministracion', label: 'Días Adm.', align: 'center' },
                                    { key: 'diasDescanso', label: 'Días Desc.', align: 'center' },
                                    { key: 'total', label: 'Total', align: 'center' },
                                    { key: 'frecuenciaEntrega', label: 'Frec. Entrega', align: 'center' },
                                ] as { key: string; label: string; align?: string }[]).map(col => (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.key)}
                                        style={{
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            color: sortCol === col.key ? 'var(--primary)' : 'var(--gray-500)',
                                            whiteSpace: 'nowrap',
                                            textAlign: col.align === 'center' ? 'center' : 'left'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.align === 'center' ? 'center' : 'flex-start' }}>
                                            {col.label}
                                            {sortIcon(col.key)}
                                        </div>
                                    </th>
                                ))}
                                <th style={{ paddingRight: 32, textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((m, i) => {
                                const isSelected = selectedNames.has(m.medicamento);
                                return (
                                    <tr key={i} style={{ transition: 'background 0.2s', background: isSelected ? '#f0f5ff' : undefined }}>
                                        <td style={{ paddingLeft: 24 }}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(m.medicamento)}
                                                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{
                                                background: 'var(--gray-100)',
                                                padding: '4px 8px',
                                                borderRadius: 6,
                                                fontWeight: 700,
                                                fontSize: 11,
                                                color: 'var(--gray-700)'
                                            }}>
                                                {m.atc || 'N/A'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 13 }}>
                                            {m.medicamento}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{m.presentacionComercial}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                            {formatCurrency(m.precioCompra)}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                                            {formatCurrency(m.precioVenta)}
                                        </td>
                                        <td style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 13 }}>{m.dosisEstandar}</td>
                                        <td style={{ textAlign: 'center' }}>{m.diasAdministracion}</td>
                                        <td style={{ textAlign: 'center' }}>{m.diasDescanso}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{m.total}</td>
                                        <td style={{ textAlign: 'center' }}>{m.frecuenciaEntrega}</td>
                                        <td style={{ paddingRight: 32, textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => { setEditingMed(m); setShowForm(true); }}
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
                                                    onClick={() => setDeletingMed(m)}
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
            <MedicamentoFormModal
                isOpen={showForm}
                onClose={() => { setShowForm(false); setEditingMed(null); }}
                onSave={handleSaveMed}
                medicamento={editingMed}
            />

            <ConfirmModal
                isOpen={!!deletingMed}
                onClose={() => setDeletingMed(null)}
                onConfirm={handleDeleteSingle}
                title="Eliminar Medicamento"
                message={`¿Estás seguro de que deseas eliminar el medicamento "${deletingMed?.medicamento}"? Esta acción no se puede deshacer.`}
                confirmText={actionLoading ? 'Eliminando...' : 'Eliminar'}
                type="danger"
            />

            <ConfirmModal
                isOpen={showBulkDeleteConfirm}
                onClose={() => setShowBulkDeleteConfirm(false)}
                onConfirm={handleDeleteBulk}
                title="Eliminar Medicamentos"
                message={`Se eliminarán ${selectedNames.size} medicamentos seleccionados. ¿Deseas continuar?`}
                confirmText={actionLoading ? 'Eliminando...' : `Eliminar ${selectedNames.size}`}
                type="danger"
            />

            <ConfirmModal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={handleClearIncomplete}
                title="Limpiar Listado"
                message="Se eliminarán todos los medicamentos que NO tengan datos de Presentación ni Dosis Estándar. ¿Deseas continuar?"
                confirmText={actionLoading ? 'Limpiando...' : 'Sí, Limpiar'}
                type="danger"
            />

            {showUploadModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', paddingTop: '100px' }}>
                    <div className="card fade-in" style={{ width: 500, padding: 24, position: 'relative', borderRadius: 24, height: 'auto', minHeight: 'unset' }}>
                        <button onClick={() => setShowUploadModal(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)' }}>
                            <X size={20} />
                        </button>
                        <h3 className="card-title" style={{ marginBottom: 4 }}>Cargar Medicamentos Masivamente</h3>
                        <p className="card-subtitle" style={{ marginBottom: 20 }}>Importa el listado desde un archivo Excel.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ background: 'var(--bg-body)', padding: 16, borderRadius: 16, border: '1px dashed var(--gray-300)' }}>
                                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>1. Descarga la plantilla base.</p>
                                <button onClick={downloadTemplate} className="btn-primary" style={{ fontSize: 12, background: 'white', color: 'var(--text-main)', border: '1px solid var(--gray-300)', padding: '6px 12px', borderRadius: 8 }}>
                                    Descargar Plantilla
                                </button>
                            </div>
                            <div style={{ background: 'var(--bg-body)', padding: 16, borderRadius: 16, border: '1px dashed var(--gray-300)' }}>
                                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>2. Sube el archivo completado.</p>
                                {uploadStatus === 'loading' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                                                <span style={{ fontSize: 13, fontWeight: 600 }}>Procesando...</span>
                                            </div>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>{uploadProgress}%</span>
                                        </div>
                                        <div style={{ width: '100%', height: 8, background: 'var(--gray-200)', borderRadius: 10, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--primary)', transition: 'width 0.3s ease' }}></div>
                                        </div>
                                    </div>
                                ) : (
                                    <input type="file" onChange={handleFileUpload} accept=".xlsx, .xls" style={{ fontSize: 13, width: '100%' }} />
                                )}
                                {uploadStatus === 'success' && <p style={{ color: '#16a34a', marginTop: 8, fontSize: 13, fontWeight: 600 }}>{uploadMsg}</p>}
                                {uploadStatus === 'error' && <p style={{ color: '#ef4444', marginTop: 8, fontSize: 13, fontWeight: 600 }}>{uploadMsg}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
