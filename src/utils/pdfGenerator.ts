import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InspectionData } from '../types/inspection';
import { INTERIOR_ITEMS, EXTERIOR_ITEMS, MECANICA_ITEMS, ACCESORIOS_ITEMS } from '../types/inspection';

export function generateInspectionPDF(data: InspectionData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Clean Geometric White/Black Header matching Inspecar sheet
  doc.setDrawColor(15, 23, 42); // slate-900
  doc.setLineWidth(0.8);
  doc.rect(14, 10, pageWidth - 28, 22);

  // Logo block
  doc.setFillColor(15, 23, 42);
  doc.rect(14, 10, 52, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('INSPECAR', 18, 24);

  // Center subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('PLANILLA DE INSPECCIÓN PRE-COMPRA', 72, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Chequeo integral de estado mecánico, chapa, interior y accesorios', 72, 26);

  // Right date & VTV
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`FECHA: ${data.vehicle.fecha || 'Sin fecha'}`, pageWidth - 18, 19, { align: 'right' });
  doc.text(`VTV / ITV: ${data.vehicle.itvVtv || 'NO'}`, pageWidth - 18, 26, { align: 'right' });

  // 1. VEHICLE INFO - Sharp Geometric Grid
  let currentY = 36;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.rect(14, currentY, pageWidth - 28, 22);

  const brand = data.vehicle.marca === 'OTRA' ? (data.vehicle.marcaPersonalizada || 'Otra') : data.vehicle.marca;
  const model = data.vehicle.modelo === 'OTRO' ? (data.vehicle.modeloPersonalizado || 'Otro') : data.vehicle.modelo;

  // Row 1
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);

  doc.text('MARCA / MODELO:', 18, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${brand} ${model} ${data.vehicle.version || ''}`.trim(), 52, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('AÑO:', 125, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.vehicle.anio || '-'}`, 138, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('DOMINIO:', 160, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.vehicle.dominio.toUpperCase() || '-'}`, 180, currentY + 7);

  // Line separator
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.line(14, currentY + 11, pageWidth - 14, currentY + 11);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text('COMBUSTIBLE:', 18, currentY + 17);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.vehicle.combustible || '-'}`, 48, currentY + 17);

  doc.setFont('helvetica', 'bold');
  doc.text('KILÓMETROS:', 95, currentY + 17);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.vehicle.kilometros ? `${Number(data.vehicle.kilometros).toLocaleString('es-AR')} km` : '-'}`, 122, currentY + 17);

  doc.setFont('helvetica', 'bold');
  doc.text('TIPO:', 160, currentY + 17);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.vehicle.tipoVehiculo || '-'}`, 172, currentY + 17);

  currentY += 26;

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
      fontSize: 7.5,
      cellPadding: 1.4,
      textColor: [15, 23, 42],
      lineWidth: 0.15,
      lineColor: [15, 23, 42]
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      lineWidth: 0.2,
      lineColor: [15, 23, 42]
    },
    columnStyles: {
      0: { cellWidth: 46 },
      1: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 46 },
      3: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 46 },
      5: { cellWidth: 14, halign: 'center', fontStyle: 'bold' }
    },
    didParseCell: (dataCell) => {
      if ([1, 3, 5].includes(dataCell.column.index) && dataCell.section === 'body') {
        const val = dataCell.cell.raw;
        if (val === 'B') {
          dataCell.cell.styles.textColor = [22, 101, 52];
          dataCell.cell.styles.fillColor = [220, 252, 231];
        } else if (val === 'B-R') {
          dataCell.cell.styles.textColor = [161, 98, 7];
          dataCell.cell.styles.fillColor = [254, 249, 195]; // lighter amber-100
        } else if (val === 'R') {
          dataCell.cell.styles.textColor = [161, 98, 7];
          dataCell.cell.styles.fillColor = [254, 240, 138];
        } else if (val === 'R-M') {
          dataCell.cell.styles.textColor = [185, 28, 28];
          dataCell.cell.styles.fillColor = [254, 205, 211]; // rose-200
        } else if (val === 'M') {
          dataCell.cell.styles.textColor = [185, 28, 28];
          dataCell.cell.styles.fillColor = [254, 226, 226];
        }
      }
    },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

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
      fontSize: 7.5,
      cellPadding: 1.3,
      textColor: [15, 23, 42],
      lineWidth: 0.15,
      lineColor: [15, 23, 42]
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
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
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.rect(90, currentY, pageWidth - 104, 26);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('REFERENCIAS:', 94, currentY + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text('• B = Bueno  |  B-R = Bueno a Regular (desgaste leve)', 94, currentY + 11);
  doc.text('• R = Regular (desgaste normal / atención próxima)', 94, currentY + 16);
  doc.text('• R-M = Regular a Malo  |  M = Malo (requiere cambio urgente)', 94, currentY + 21);

  currentY = Math.max((doc as any).lastAutoTable.finalY + 4, currentY + 30);

  // DAÑOS DE CARROCERÍA
  if (data.damageMarkers && data.damageMarkers.length > 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('DETALLES DE CHAPA Y PINTURA:', 14, currentY);
    currentY += 4;

    const damageText = data.damageMarkers
      .map((m, idx) => `[${idx + 1}] ${m.view.toUpperCase()}: ${m.type} ${m.note ? `(${m.note})` : ''}`)
      .join('   |   ');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitDamage = doc.splitTextToSize(damageText, pageWidth - 28);
    doc.text(splitDamage, 14, currentY);
    currentY += splitDamage.length * 4 + 2;
  }

  // OBSERVACIONES
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('OBSERVACIONES GENERALES DEL TÉCNICO:', 14, currentY + 2);
  currentY += 5;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.rect(14, currentY, pageWidth - 28, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  const obs = data.observaciones || 'Sin observaciones adicionales registradas durante la inspección.';
  const splitObs = doc.splitTextToSize(obs, pageWidth - 32);
  doc.text(splitObs, 17, currentY + 5);

  currentY += 26;

  // DICTAMEN FINAL
  if (data.conclusionGeneral) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`DICTAMEN FINAL: ${data.conclusionGeneral.toUpperCase()}`, 14, currentY + 2);
  }

  // Footer
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(14, 283, pageWidth - 14, 283);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('INSPECAR - Diagnóstico Mecánico Pre-Compra', 14, 287);
  doc.text('Documento técnico orientativo pre-adquisición vehicular', pageWidth - 14, 287, { align: 'right' });

  return doc;
}
