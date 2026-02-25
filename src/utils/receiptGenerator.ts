import { jsPDF } from 'jspdf';
import type { Despacho } from '../data/despachoTypes';

/**
 * Genera un PDF de Comprobante de Entrega
 */
export const generateDeliveryReceipt = async (despacho: Despacho) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(99, 102, 241); // Indigo 500
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROBANTE DE ENTREGA', 20, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const now = new Date();
    doc.text(`Fecha de Emisión: ${now.toLocaleString()}`, 20, 34);

    // Patient Info
    doc.setTextColor(31, 41, 55); // Gray 800
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL PACIENTE', 20, 55);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${despacho.nombreCompleto}`, 20, 65);
    doc.text(`Identificación: ${despacho.pacienteId}`, 20, 72);
    doc.text(`EPS: ${despacho.eps}`, 20, 79);
    doc.text(`Municipio: ${despacho.municipio}`, 20, 86);
    doc.text(`Teléfono: ${despacho.telefonos}`, 20, 93);

    // Medication Info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DEL MEDICAMENTO', 20, 110);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Medicamento: ${despacho.medicamento}`, 20, 120);
    doc.text(`Dosis: ${despacho.dosis}`, 20, 127);
    doc.text(`Ciclo: ${despacho.ciclo}`, 20, 134);

    // Delivery Info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DE LA ENTREGA', 20, 150);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Modalidad: ${despacho.modality === 'Domicilio' ? 'Entrega a Domicilio' : 'Entrega en Farmacia'}`, 20, 160);
    doc.text(`Estado: ${despacho.estadoActual}`, 20, 167);
    if (despacho.geolocalizacion) {
        doc.text(`Coordenadas: ${despacho.geolocalizacion.lat.toFixed(6)}, ${despacho.geolocalizacion.lng.toFixed(6)}`, 20, 174);
    }

    // Evidence
    const evidence = despacho.evidencia || despacho.firma;
    if (evidence) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('EVIDENCIA DE ENTREGA', 20, 195);

        try {
            // we use JPEG for photos as a guess, but jspdf is smart
            doc.addImage(evidence, 'JPEG', 20, 200, 100, 60);
        } catch (e) {
            try {
                doc.addImage(evidence, 'PNG', 20, 200, 100, 60);
            } catch (e2) {
                console.error('Error adding evidence to PDF', e2);
            }
        }

        doc.setFontSize(9);
        doc.setTextColor(156, 163, 175);
        doc.text('Fotografía/Firma capturada al momento de la entrega', 20, 265);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    const text = 'Este documento es un soporte digital generado por la plataforma Dashboard Salud Oncológico.';
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, 285);

    // Save
    doc.save(`Entrega_${despacho.pacienteId}_${new Date().getTime()}.pdf`);
};
