import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InspectionData, DamageMarker, ScoreValue } from '../types/inspection';
import { INTERIOR_ITEMS, getExteriorItems, MECANICA_ITEMS, ACCESORIOS_ITEMS, SCORE_LABEL, DAMAGE_TYPES, compileObservaciones } from '../types/inspection';
import { getBlueprintKey } from '../data/carData';

const scoreText = (v: ScoreValue | undefined) => (v ? SCORE_LABEL[v] : '-');

/** dd/mm/aaaa a partir de aaaa-mm-dd */
const formatDate = (iso: string) => {
  const [y, m, d] = (iso || '').split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso || '-';
};

/** Recorta un texto con "…" para que no invada la columna de al lado. */
const fitText = (doc: jsPDF, text: string, maxW: number) => {
  if (doc.getTextWidth(text) <= maxW) return text;
  let t = text;
  while (t.length > 1 && doc.getTextWidth(t + '…') > maxW) t = t.slice(0, -1);
  return t.trimEnd() + '…';
};

const VIEW_TRANSLATIONS: Record<string, string> = {
  lateral_der: 'Lateral Derecho',
  lateral_izq: 'Lateral Izquierdo',
  frente: 'Frente',
  trasera: 'Parte Trasera',
  techo: 'Planta / Techo'
};

const TYPE_TRANSLATIONS: Record<string, { label: string; color: string }> = Object.fromEntries(
  Object.entries(DAMAGE_TYPES).map(([k, v]) => [k, { label: v.label, color: v.color }])
);

// Carga asíncrona de imagen para Canvas
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      return reject(new Error('Window or Image not available'));
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Obtener logo oficial de INSPECAR en Base64
async function getLogoBase64(): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  try {
    const img = await loadImage('/logo-card.jpg');
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.95);
  } catch {
    return null;
  }
}

// Genera un plano esquemático compuesto de 5 vistas en Canvas con los puntos marcados
async function generateVehicleBlueprintImage(
  bodyType: string,
  markers: DamageMarker[]
): Promise<string | null> {
  if (typeof document === 'undefined') return null;

  try {
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 580;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fondo blanco nítido
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const vehicleKey = getBlueprintKey(bodyType);

    // Definición de las 5 cajas de vistas
    // Fila superior: Lateral Derecho y Lateral Izquierdo
    // Fila inferior: Frente, Techo/Planta, Trasera
    const viewBoxes: {
      id: DamageMarker['view'];
      label: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }[] = [
      { id: 'lateral_der', label: '1. LATERAL DERECHO', x: 12, y: 12, w: 580, h: 268 },
      { id: 'lateral_izq', label: '2. LATERAL IZQUIERDO', x: 608, y: 12, w: 580, h: 268 },
      { id: 'frente', label: '3. FRENTE', x: 12, y: 296, w: 382, h: 272 },
      { id: 'techo', label: '4. PLANTA / TECHO', x: 409, y: 296, w: 382, h: 272 },
      { id: 'trasera', label: '5. PARTE TRASERA', x: 806, y: 296, w: 382, h: 272 }
    ];

    for (const vb of viewBoxes) {
      // Borde sutil del marco
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(vb.x, vb.y, vb.w, vb.h);

      // Cargar y dibujar el blueprint CAD de la vista
      const imgSrc = `/blueprints/crops/${vehicleKey}_${vb.id}.jpg`;
      let img: HTMLImageElement | null = null;
      try {
        img = await loadImage(imgSrc);
      } catch {
        // En caso de falla de carga, dibujar fondo neutro
        img = null;
      }

      // Dibujar imagen centrada conservando aspecto 16:9
      const imgAspect = 16 / 9;
      const boxAspect = vb.w / vb.h;
      let drawW = vb.w;
      let drawH = vb.h;
      let drawX = vb.x;
      let drawY = vb.y;

      if (boxAspect > imgAspect) {
        drawW = vb.h * imgAspect;
        drawX = vb.x + (vb.w - drawW) / 2;
      } else {
        drawH = vb.w / imgAspect;
        drawY = vb.y + (vb.h - drawH) / 2;
      }

      if (img) {
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      } else {
        // p. ej. el furgón no tiene plano de techo
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 14px helvetica, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Vista no disponible para esta carrocería', vb.x + vb.w / 2, vb.y + vb.h / 2);
      }

      // Badge de título de la vista (Esquina superior izquierda)
      // Reset de alineación: los marcadores dejan textAlign='center' y cortaban los títulos ("L IZQUIERDO", "RENTE")
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(vb.x, vb.y, 160, 22);
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(vb.label, vb.x + 8, vb.y + 15);

      // Dibujar marcadores de daño correspondientes a esta vista
      const viewMarkers = markers.filter((m) => m.view === vb.id);
      for (const vm of viewMarkers) {
        const markerIndex = markers.findIndex((m) => m.id === vm.id) + 1;
        const px = drawX + (vm.x / 100) * drawW;
        const py = drawY + (vm.y / 100) * drawH;

        const cfg = TYPE_TRANSLATIONS[vm.type] || { label: vm.type, color: '#e11d48' };

        // Sombra suave para visibilidad
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Círculo del marcador
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.fillStyle = cfg.color;
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.restore();

        // Número de orden (#1, #2, ...)
        ctx.font = 'bold 12px helvetica, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(markerIndex), px, py);

        // Badge secundario con el tipo de daño (D, Rep, etc.)
        ctx.beginPath();
        ctx.arc(px + 10, py - 10, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.font = 'bold 7px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(vm.type.slice(0, 2), px + 10, py - 10);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    }

    return canvas.toDataURL('image/jpeg', 0.92);
  } catch (err) {
    console.error('Error generating vehicle blueprint image:', err);
    return null;
  }
}

export async function generateInspectionPDF(data: InspectionData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const brand = data.vehicle.marca === 'OTRA' ? (data.vehicle.marcaPersonalizada || 'Otra') : data.vehicle.marca;
  const model = data.vehicle.modelo === 'OTRO' ? (data.vehicle.modeloPersonalizado || 'Otro') : data.vehicle.modelo;
  const vehicleTitle = `${brand || '-'} ${model || '-'} ${data.vehicle.version || ''}`.trim();
  const dominioFormatted = (data.vehicle.dominio || '-').toUpperCase();

  // Carga paralela de Logo oficial y Diagrama CAD
  const [logoImgData, blueprintImgData] = await Promise.all([
    getLogoBase64(),
    generateVehicleBlueprintImage(data.vehicle.tipoVehiculo, data.damageMarkers || [])
  ]);

  // =========================================================================
  // ============================ PÁGINA 1 ===================================
  // =========================================================================

  // HEADER PÁGINA 1
  doc.setDrawColor(15, 23, 42); // slate-900
  doc.setLineWidth(0.8);
  doc.rect(14, 10, pageWidth - 28, 20);

  // Logo Oficial INSPECAR en Header (Sin marco exterior)
  if (logoImgData) {
    doc.addImage(logoImgData, 'JPEG', 16, 13.5, 52, 12.5);
  } else {
    // Bloque Logo alternativo
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 10, 50, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('INSPECAR', 18, 23);
  }

  // Subtítulo central
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('PLANILLA DE INSPECCIÓN PRE-COMPRA', 72, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Diagnóstico integral de estado mecánico, chapa, interior y accesorios', 68, 25);

  // Fecha e ITV / VTV
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`FECHA: ${formatDate(data.vehicle.fecha)}`, pageWidth - 18, 18, { align: 'right' });
  doc.text(`VTV / ITV: ${data.vehicle.itvVtv || '-'}`, pageWidth - 18, 24, { align: 'right' });

  // 1. FICHA TÉCNICA DEL VEHÍCULO
  let currentY = 34;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.rect(14, currentY, pageWidth - 28, 20);

  // Fila 1 datos
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('MARCA / MODELO:', 18, currentY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(fitText(doc, vehicleTitle, 73), 50, currentY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.text('AÑO:', 125, currentY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.vehicle.anio || '-'}`, 136, currentY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.text('DOMINIO:', 158, currentY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(fitText(doc, dominioFormatted, pageWidth - 16 - 174), 174, currentY + 6.5);

  // Línea divisoria interna
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.line(14, currentY + 10, pageWidth - 14, currentY + 10);

  // Fila 2 datos
  doc.setFont('helvetica', 'bold');
  doc.text('COMBUSTIBLE:', 18, currentY + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.text(fitText(doc, data.vehicle.combustible || '-', 48), 44, currentY + 15.5);

  doc.setFont('helvetica', 'bold');
  doc.text('KILÓMETROS:', 95, currentY + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${data.vehicle.kilometros ? `${Number(data.vehicle.kilometros).toLocaleString('es-AR')} km` : '-'}`,
    120,
    currentY + 15.5
  );

  doc.setFont('helvetica', 'bold');
  doc.text('CARROCERÍA:', 145, currentY + 15.5);
  doc.setFont('helvetica', 'normal');
  // "SUV / Camioneta cerrada" se salía de la hoja: se muestra sólo el tipo principal
  const bodyShort = (data.vehicle.tipoVehiculo || '-').split(/[(/]/)[0].trim();
  doc.text(fitText(doc, bodyShort, pageWidth - 16 - 168), 168, currentY + 15.5);

  // Fila 3: cliente (si se cargó)
  const v = data.vehicle;
  if (v.clienteNombre || v.clienteDni || v.clienteTelefono) {
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.rect(14, currentY + 20, pageWidth - 28, 8);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', 18, currentY + 25.3);
    doc.setFont('helvetica', 'normal');
    doc.text(fitText(doc, v.clienteNombre || '-', 70), 36, currentY + 25.3);
    doc.setFont('helvetica', 'bold');
    doc.text('DNI:', 110, currentY + 25.3);
    doc.setFont('helvetica', 'normal');
    doc.text(v.clienteDni || '-', 119, currentY + 25.3);
    doc.setFont('helvetica', 'bold');
    doc.text('TEL:', 150, currentY + 25.3);
    doc.setFont('helvetica', 'normal');
    doc.text(fitText(doc, v.clienteTelefono || '-', pageWidth - 16 - 159), 159, currentY + 25.3);
    currentY += 8;
  }

  currentY += 24;

  // 2. TABLA DE CONTROL DE 3 COLUMNAS (Interior, Exterior, Mecánica)
  const extItems = getExteriorItems(data.vehicle.tipoVehiculo); // con "Caja de carga" sólo si es pick-up
  const maxRows = Math.max(INTERIOR_ITEMS.length, extItems.length, MECANICA_ITEMS.length);
  const tableBody: any[] = [];

  for (let i = 0; i < maxRows; i++) {
    const intItem = INTERIOR_ITEMS[i];
    const intScore = intItem ? scoreText(data.interior[intItem]) : '';

    const extItem = extItems[i];
    const extScore = extItem ? scoreText(data.exterior[extItem]) : '';

    const mecItem = MECANICA_ITEMS[i];
    const mecScore = mecItem ? scoreText(data.mecanica[mecItem]) : '';

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
      cellPadding: 1.35,
      textColor: [15, 23, 42],
      lineWidth: 0.12,
      lineColor: [15, 23, 42]
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
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
        } else if (val === 'B/R') {
          dataCell.cell.styles.textColor = [161, 98, 7];
          dataCell.cell.styles.fillColor = [254, 249, 195];
        } else if (val === 'R') {
          dataCell.cell.styles.textColor = [161, 98, 7];
          dataCell.cell.styles.fillColor = [254, 240, 138];
        } else if (val === 'R/M') {
          dataCell.cell.styles.textColor = [185, 28, 28];
          dataCell.cell.styles.fillColor = [254, 205, 211];
        } else if (val === 'M') {
          dataCell.cell.styles.textColor = [185, 28, 28];
          dataCell.cell.styles.fillColor = [254, 226, 226];
        } else if (val === 'N/A') {
          dataCell.cell.styles.textColor = [100, 116, 139];
          dataCell.cell.styles.fillColor = [241, 245, 249];
        }
      }
    },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // 3. TABLA DE ACCESORIOS (Columna izquierda)
  const accBody = ACCESORIOS_ITEMS.map((item) => {
    const val = data.accesorios[item];
    return [item, val || '-'];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['ACCESORIOS Y EQUIPAMIENTO', 'ESTADO']],
    body: accBody,
    theme: 'grid',
    styles: {
      fontSize: 7.2,
      cellPadding: 1.1,
      textColor: [15, 23, 42],
      lineWidth: 0.12,
      lineColor: [15, 23, 42]
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2
    },
    columnStyles: {
      0: { cellWidth: 46 },
      1: { cellWidth: 16, halign: 'center', fontStyle: 'bold' }
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

  // 4. BLOQUE DERECHO: REFERENCIAS & BALANCE GENERAL
  const rightColX = 80;
  const rightColWidth = pageWidth - rightColX - 14;

  // Cuadro de Referencias
  const refHeight = 22;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.rect(rightColX, currentY, rightColWidth, refHeight);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('ESCALA DE CALIFICACIONES:', rightColX + 4, currentY + 5.5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text('• B = Bueno (óptimo funcionamiento sin desgaste relevante)', rightColX + 4, currentY + 10);
  doc.text('• B/R = Bueno a Regular  |  R = Regular (atención sugerida)', rightColX + 4, currentY + 14.5);
  doc.text('• R/M = Regular a Malo  |  M = Malo (reparar/cambiar)  |  N/A = No aplica', rightColX + 4, currentY + 19);

  // Cuadro de Balance General (Buenos / Regulares / Malos)
  // Sólo se cuentan los ítems visibles para esta carrocería
  const allScores = [
    ...INTERIOR_ITEMS.map((i) => data.interior[i]),
    ...extItems.map((i) => data.exterior[i]),
    ...MECANICA_ITEMS.map((i) => data.mecanica[i])
  ];
  const countB = allScores.filter((s) => s === 'B' || s === 'B-R').length;
  const countR = allScores.filter((s) => s === 'R').length;
  const countM = allScores.filter((s) => s === 'M' || s === 'R-M').length;

  const balanceY = currentY + refHeight + 4;
  const balanceHeight = 24;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.rect(rightColX, balanceY, rightColWidth, balanceHeight);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('BALANCE TOTAL DE ÍTEMS REVISADOS:', rightColX + 4, balanceY + 5.5);

  const metricW = (rightColWidth - 8) / 3;
  // Box Buenos
  doc.setFillColor(220, 252, 231);
  doc.rect(rightColX + 3, balanceY + 8, metricW - 2, 13, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(22, 101, 52);
  doc.text(`${countB}`, rightColX + 3 + (metricW - 2) / 2, balanceY + 14, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('BUENOS', rightColX + 3 + (metricW - 2) / 2, balanceY + 19, { align: 'center' });

  // Box Regulares
  doc.setFillColor(254, 240, 138);
  doc.rect(rightColX + 3 + metricW, balanceY + 8, metricW - 2, 13, 'F');
  doc.setFontSize(10);
  doc.setTextColor(161, 98, 7);
  doc.text(`${countR}`, rightColX + 3 + metricW + (metricW - 2) / 2, balanceY + 14, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('REGULARES', rightColX + 3 + metricW + (metricW - 2) / 2, balanceY + 19, { align: 'center' });

  // Box Malos
  doc.setFillColor(254, 226, 226);
  doc.rect(rightColX + 3 + metricW * 2, balanceY + 8, metricW - 2, 13, 'F');
  doc.setFontSize(10);
  doc.setTextColor(185, 28, 28);
  doc.text(`${countM}`, rightColX + 3 + metricW * 2 + (metricW - 2) / 2, balanceY + 14, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('OBSERVADOS', rightColX + 3 + metricW * 2 + (metricW - 2) / 2, balanceY + 19, { align: 'center' });

  // Banner aviso página 2
  const bannerY = balanceY + balanceHeight + 4;
  doc.setFillColor(15, 23, 42);
  doc.rect(rightColX, bannerY, rightColWidth, 11, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('➔ CONTINÚA EN HOJA 2:', rightColX + 4, bannerY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text('Plano CAD de Carrocería con puntos marcados y dictamen técnico.', rightColX + 4, bannerY + 8.5);

  // =========================================================================
  // ============================ PÁGINA 2 ===================================
  // =========================================================================
  doc.addPage();

  // HEADER PÁGINA 2
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.rect(14, 10, pageWidth - 28, 15);

  if (logoImgData) {
    doc.addImage(logoImgData, 'JPEG', 16, 12.5, 40, 9.5);
  } else {
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 10, 42, 15, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text('INSPECAR', 17, 20);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PLANO DE CARROCERÍA Y REGISTRO DE DAÑOS DETECTADOS', 60, 16.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`VEHÍCULO: ${vehicleTitle}  |  DOMINIO: ${dominioFormatted}`, 60, 21.5);

  let page2Y = 28;

  // 1. ESQUEMA CAD DEL VEHÍCULO CON PUNTOS MARCADOS
  const diagramHeight = 88;
  const diagramWidth = pageWidth - 28; // 182mm

  if (blueprintImgData) {
    doc.addImage(blueprintImgData, 'JPEG', 14, page2Y, diagramWidth, diagramHeight);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.rect(14, page2Y, diagramWidth, diagramHeight);
  } else {
    // Si no está disponible Canvas, dibujar recuadro informativo
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.rect(14, page2Y, diagramWidth, diagramHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('PLANO ESQUEMÁTICO DE VISTAS VEHICULARES', pageWidth / 2, page2Y + 40, { align: 'center' });
  }

  page2Y += diagramHeight + 4;

  // 2. TABLA DETALLADA DE DAÑOS MARCADOS
  const markers = data.damageMarkers || [];

  if (markers.length > 0) {
    const damageRows = markers.map((m, idx) => {
      const viewLabel = VIEW_TRANSLATIONS[m.view] || m.view;
      const typeInfo = TYPE_TRANSLATIONS[m.type] || { label: m.type, color: '#e11d48' };
      const detailText = m.note && m.note.trim() ? m.note.trim() : 'Sin nota técnica especificada';

      return [
        `#${idx + 1}`,
        viewLabel,
        typeInfo.label,
        detailText
      ];
    });

    autoTable(doc, {
      startY: page2Y,
      head: [['#', 'VISTA / ZONA', 'TIPO DE DAÑO', 'DESCRIPCIÓN / OBSERVACIÓN']],
      body: damageRows,
      theme: 'grid',
      styles: {
        fontSize: 7.2,
        cellPadding: 1.4,
        textColor: [15, 23, 42],
        lineWidth: 0.12,
        lineColor: [15, 23, 42]
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 38, fontStyle: 'bold' },
        2: { cellWidth: 36, fontStyle: 'bold' },
        3: { cellWidth: 96 }
      },
      didParseCell: (dataCell) => {
        if (dataCell.column.index === 0 && dataCell.section === 'body') {
          dataCell.cell.styles.fillColor = [241, 245, 249];
          dataCell.cell.styles.textColor = [15, 23, 42];
        }
      },
      margin: { left: 14, right: 14 }
    });

    page2Y = (doc as any).lastAutoTable.finalY + 4;
  } else {
    // Si no hay daños marcados
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.4);
    doc.rect(14, page2Y, pageWidth - 28, 12, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52);
    doc.text('SIN DAÑOS REGISTRADOS:', 20, page2Y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(
      'La inspección visual de chapa y pintura no constató rayones, abolladuras ni repintados visibles.',
      20,
      page2Y + 9.5
    );

    page2Y += 16;
  }

  // 3. OBSERVACIONES GENERALES DEL TÉCNICO
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('OBSERVACIONES GENERALES DEL TÉCNICO EVALUADOR:', 14, page2Y + 1);
  page2Y += 3.5;

  // El recuadro crece con el texto (antes tenía alto fijo y el texto largo se pisaba con el dictamen)
  // Observaciones de cada sección (Interior, Exterior, Mecánica…) + la general, juntas
  const obsParts = compileObservaciones(data);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  const obsLines: string[] = obsParts.length
    ? obsParts.flatMap((o) => doc.splitTextToSize(`${o.titulo.toUpperCase()}: ${o.texto}`, pageWidth - 36) as string[])
    : (doc.splitTextToSize('Sin observaciones mecánicas adicionales registradas durante la evaluación.', pageWidth - 36) as string[]);
  const lineH = 3.3;
  const footerLimit = pageHeight - 16;
  let lineIdx = 0;
  while (lineIdx < obsLines.length) {
    const available = footerLimit - page2Y - 6;
    let fit = Math.max(1, Math.floor(available / lineH));
    if (available < 15) {
      doc.addPage();
      page2Y = 16;
      continue;
    }
    fit = Math.min(fit, obsLines.length - lineIdx);
    const boxH = Math.max(22, fit * lineH + 6);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);
    doc.setFillColor(248, 250, 252);
    doc.rect(14, page2Y, pageWidth - 28, boxH, 'FD');
    doc.setTextColor(15, 23, 42);
    doc.text(obsLines.slice(lineIdx, lineIdx + fit), 18, page2Y + 5);
    lineIdx += fit;
    page2Y += boxH + 4;
    if (lineIdx < obsLines.length) {
      doc.addPage();
      page2Y = 16;
    }
  }

  // Si el dictamen y la firma no entran, pasan a una hoja nueva
  if (page2Y + 26 > footerLimit) {
    doc.addPage();
    page2Y = 16;
  }

  // 4. DICTAMEN FINAL & BLOQUE DE FIRMA
  const verdictWidth = 100;
  const signatureWidth = pageWidth - 28 - verdictWidth - 6;

  // Recuadro Dictamen Final (Izquierda)
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.rect(14, page2Y, verdictWidth, 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DICTAMEN TÉCNICO PRE-COMPRA:', 18, page2Y + 5.5);

  const verdict = data.conclusionGeneral || 'Sin dictamen cargado';
  let verdictColor: [number, number, number] = [15, 23, 42];
  let verdictBg: [number, number, number] = [241, 245, 249];

  if (verdict.includes('Recomendado') && !verdict.includes('reparaciones') && !verdict.includes('No')) {
    verdictColor = [22, 101, 52];
    verdictBg = [220, 252, 231];
  } else if (verdict.includes('reparaciones') || verdict.includes('pendientes')) {
    verdictColor = [161, 98, 7];
    verdictBg = [254, 240, 138];
  } else if (verdict.includes('No recomendado')) {
    verdictColor = [185, 28, 28];
    verdictBg = [254, 226, 226];
  }

  doc.setFillColor(...verdictBg);
  doc.rect(18, page2Y + 8, verdictWidth - 8, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...verdictColor);
  doc.text(verdict.toUpperCase(), 18 + (verdictWidth - 8) / 2, page2Y + 13.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Documento de carácter consultivo pre-compra emitido por INSPECAR.', 18, page2Y + 20.5);

  // Recuadro de Firma Técnica (Derecha)
  const signX = 14 + verdictWidth + 6;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.rect(signX, page2Y, signatureWidth, 24);

  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.2);
  doc.line(signX + 8, page2Y + 14, signX + signatureWidth - 8, page2Y + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('FIRMA Y SELLO TÉCNICO EVALUADOR', signX + signatureWidth / 2, page2Y + 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text('INSPECAR Diagnóstico Automotor', signX + signatureWidth / 2, page2Y + 21.5, { align: 'center' });

  // Pie de página en todas las hojas con numeración real (antes decía siempre "de 2")
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const footerY = pageHeight - 10;
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);
    doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`INSPECAR - Diagnóstico Mecánico y Estructural Pre-Compra  ·  ${dominioFormatted}`, 14, footerY);
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - 14, footerY, { align: 'right' });
  }

  return doc;
}
