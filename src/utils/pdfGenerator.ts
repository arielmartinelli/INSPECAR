import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InspectionData } from '../types/inspection';
import { INTERIOR_ITEMS, EXTERIOR_ITEMS, MECANICA_ITEMS, ACCESORIOS_ITEMS } from '../types/inspection';

const VIEW_TRANSLATIONS: Record<string, string> = {
  lateral_der: 'Lat. Derecho',
  lateral_izq: 'Lat. Izquierdo',
  frente: 'Frente',
  trasera: 'Trasera',
  techo: 'Planta/Techo'
};

export function generateInspectionPDF(data: InspectionData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Clean Geometric White/Black Header matching Inspecar sheet
  doc.setDrawColor(15, 23, 42); // slate-900
  doc.setLineWidth(0.8);
  doc.rect(14, 10, pageWidth - 28, 20);

  // Logo block
  doc.setFillColor(15, 23, 42);
  doc.rect(14, 10, 50, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('INSPECAR', 18, 23);

  // Center subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PLANILLA DE INSPECCIÓN PRE-COMPRA', 68, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Diagnóstico integral de estado mecánico, chapa, interior y accesorios', 68, 25);

  // Right date & VTV
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`FECHA: ${data.vehicle.fecha || 'Sin fecha'}`, pageWidth - 18, 18, { align: 'right' });
  doc.text(`VTV / ITV: ${data.vehicle.itvVtv || 'NO'}`, pageWidth - 18, 24, { align: 'right' });

  // 1. VEHICLE INFO - Sharp Geometric Grid
  let currentY = 34;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.rect(14, currentY, pageWidth - 28, 20);

  const brand = data.vehicle.marca === 'OTRA' ? (data.vehicle.marcaPersonalizada || 'Otra') : data.vehicle.marca;
  const model = data.vehicle.modelo === 'OTRO' ? (data.vehicle.modeloPersonalizado || 'Otro') : data.vehicle.modelo;

  // Row 1
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);

  doc.text('MARCA / MODELO:', 18, currentY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${brand || '-'} ${model || '-'} ${data.vehicle.version || ''}`.trim(), 50, currentY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.text('AÑO:', 125, currentY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.vehicle.anio || '-'}`, 136, currentY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.text('DOMINIO:', 158, currentY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.vehicle.dominio ? data.vehicle.dominio.toUpperCase() : '-'}`, 174, currentY + 6.5);

  // Line separator
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.line(14, currentY + 10, pageWidth - 14, currentY + 10);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text('COMBUSTIBLE:', 18, currentY + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.vehicle.combustible || '-'}`, 44, currentY + 15.5);

  doc.setFont('helvetica', 'bold');
  doc.text('KILÓMETROS:', 95, currentY + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.vehicle.kilometros ? `${Number(data.vehicle.kilometros).toLocaleString('es-AR')} km` : '-'}`, 120, currentY + 15.5);

  doc.setFont('helvetica', 'bold');
  doc.text('TIPO:', 158, currentY + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.vehicle.tipoVehiculo || '-'}`, 168, currentY + 15.5);

  currentY += 23;

  // 3-COLUMN CHECKLIST TABLE (Interior, Exterior, Mecánica)
  const maxRows = Math.max(INTERIOR_ITEMS.length, EXTERIOR_ITEMS.length, MECANICA_ITEMS.length);
  const tableBody: any[] = [];

  for (let i = 0; i < maxRows; i++) {
    const intItem = INTERIOR_ITEMS[i];
    const intScore = intItem ? (data.interior[intItem] || '-') : '';

    const extItem = EXTERIOR_ITEMS[i];
    const extScore = extItem ? (data.exterior[extItem] || '-') : '';

    const mecItem = MECANICA_ITEMS[i];
    const mecScore = mecItem ? (data.mecanica[mecItem] || '-') : '';

    tableBody.push([
      intItem || '',
      intScore,
      extItem || '',
      extScore,
      mecItem || '',
      mecScore
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        { content: 'INTERIOR', colSpan: 2, styles: { halign: 'center', fillColor: [15, 23, 42] } },
        { content: 'EXTERIOR', colSpan: 2, styles: { halign: 'center', fillColor: [15, 23, 42] } },
        { content: 'MECÁNICA', colSpan: 2, styles: { halign: 'center', fillColor: [15, 23, 42] } }
      ],
      ['Punto de Control', 'Cal.', 'Punto de Control', 'Cal.', 'Punto de Control', 'Cal.']
    ],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.1,
      textColor: [15, 23, 42],
      lineWidth: 0.12,
      lineColor: [15, 23, 42]
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      lineWidth: 0.15,
      lineColor: [15, 23, 42]
    },
    columnStyles: {
      0: { cellWidth: 47 },
      1: { cellWidth: 13, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 47 },
      3: { cellWidth: 13, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 47 },
      5: { cellWidth: 13, halign: 'center', fontStyle: 'bold' }
    },
    didParseCell: (dataCell) => {
      if ([1, 3, 5].includes(dataCell.column.index) && dataCell.section === 'body') {
        const val = dataCell.cell.raw;
        if (val === 'B') {
          dataCell.cell.styles.textColor = [22, 101, 52];
          dataCell.cell.styles.fillColor = [220, 252, 231];
        } else if (val === 'B-R') {
          dataCell.cell.styles.textColor = [161, 98, 7];
          dataCell.cell.styles.fillColor = [254, 249, 195];
        } else if (val === 'R') {
          dataCell.cell.styles.textColor = [161, 98, 7];
          dataCell.cell.styles.fillColor = [254, 240, 138];
        } else if (val === 'R-M') {
          dataCell.cell.styles.textColor = [185, 28, 28];
          dataCell.cell.styles.fillColor = [254, 205, 211];
        } else if (val === 'M') {
          dataCell.cell.styles.textColor = [185, 28, 28];
          dataCell.cell.styles.fillColor = [254, 226, 226];
        }
      }
    },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  // ACCESORIOS & REFERENCIAS (Geometric)
  const accBody = ACCESORIOS_ITEMS.map((item) => {
    const val = data.accesorios[item];
    return [item, val || '-'];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['ACCESORIOS', 'ESTADO']],
    body: accBody,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1,
      textColor: [15, 23, 42],
      lineWidth: 0.12,
      lineColor: [15, 23, 42]
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
    },
    didParseCell: (dataCell) => {
      if (dataCell.column.index === 1 && dataCell.section === 'body') {
        if (dataCell.cell.raw === 'SI') {
          dataCell.cell.styles.textColor = [22, 101, 52];
          dataCell.cell.styles.fillColor = [220, 252, 231];
        } else if (dataCell.cell.raw === 'NO') {
          dataCell.cell.styles.textColor = [185, 28, 28];
          dataCell.cell.styles.fillColor = [254, 226, 226];
        }
      }
    },
    margin: { left: 14 }
  });

  // Sharp Reference block
  const refHeight = 22;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.rect(90, currentY, pageWidth - 104, refHeight);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('REFERENCIAS:', 94, currentY + 5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text('• B = Bueno  |  B-R = Bueno a Regular (desgaste leve)', 94, currentY + 10);
  doc.text('• R = Regular (desgaste normal / atención próxima)', 94, currentY + 14.5);
  doc.text('• R-M = Regular a Malo  |  M = Malo (requiere cambio urgente)', 94, currentY + 19);

  currentY = Math.max((doc as any).lastAutoTable.finalY + 3, currentY + refHeight + 2);

  // DAÑOS DE CARROCERÍA
  if (data.damageMarkers && data.damageMarkers.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('DETALLES DE CHAPA Y PINTURA:', 14, currentY);
    currentY += 3.5;

    const damageText = data.damageMarkers
      .map((m, idx) => {
        const viewLabel = VIEW_TRANSLATIONS[m.view] || m.view;
        return `[#${idx + 1}] ${viewLabel}: ${m.type} ${m.note ? `(${m.note})` : ''}`;
      })
      .join('   |   ');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitDamage = doc.splitTextToSize(damageText, pageWidth - 28);
    doc.text(splitDamage, 14, currentY);
    currentY += splitDamage.length * 3.5 + 2;
  }

  // OBSERVACIONES
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('OBSERVACIONES GENERALES DEL TÉCNICO:', 14, currentY + 1);
  currentY += 4;

  const obsBoxHeight = 17;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.rect(14, currentY, pageWidth - 28, obsBoxHeight);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);

  const obs = data.observaciones || 'Sin observaciones adicionales registradas durante la inspección.';
  const splitObs = doc.splitTextToSize(obs, pageWidth - 32);
  doc.text(splitObs, 17, currentY + 4);

  currentY += obsBoxHeight + 3;

  // DICTAMEN FINAL
  if (data.conclusionGeneral) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`DICTAMEN FINAL: ${data.conclusionGeneral.toUpperCase()}`, 14, currentY + 1);
  }

  // Footer fijo a pie de página A4
  const footerY = pageHeight - 10;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('INSPECAR - Diagnóstico Mecánico Pre-Compra', 14, footerY);
  doc.text('Documento técnico orientativo pre-adquisición vehicular', pageWidth - 14, footerY, { align: 'right' });

  return doc;
}
