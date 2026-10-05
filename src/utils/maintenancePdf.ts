import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PLAZOS, type InspectionData } from '../types/inspection';

/** Informe de Mantenimiento Preventivo (servicio adicional): PDF independiente del informe de inspección. */

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const loadLogo = () =>
  new Promise<string | null>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      resolve(c.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => resolve(null);
    img.src = '/logo-card.jpg';
  });

const fmtDate = (iso: string) => {
  const [y, m, d] = (iso || '').split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso || '-';
};

export async function generateMaintenancePDF(data: InspectionData): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const v = data.vehicle;
  const brand = v.marca === 'OTRA' ? v.marcaPersonalizada : v.marca;
  const model = v.modelo === 'OTRO' ? v.modeloPersonalizado : v.modelo;
  const vehiculo = [brand, model, v.version].filter(Boolean).join(' ') || '-';
  const items = data.mantenimiento?.items ?? [];

  // Encabezado
  const logo = await loadLogo();
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.rect(14, 10, W - 28, 20);
  if (logo) doc.addImage(logo, 'JPEG', 16, 13.5, 52, 12.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('INFORME DE MANTENIMIENTO PREVENTIVO', 72, 18.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Recomendaciones sobre mantenimientos pendientes, por plazo', 72, 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`FECHA: ${fmtDate(v.fecha)}`, W - 18, 18, { align: 'right' });
  doc.text(`DOMINIO: ${(v.dominio || '-').toUpperCase()}`, W - 18, 24, { align: 'right' });

  // Datos
  autoTable(doc, {
    startY: 34,
    body: [
      ['VEHÍCULO', vehiculo, 'AÑO', v.anio || '-'],
      ['KILÓMETROS', v.kilometros ? `${Number(v.kilometros).toLocaleString('es-AR')} km` : '-', 'CLIENTE', [v.clienteNombre, v.clienteDni && `DNI ${v.clienteDni}`].filter(Boolean).join(' · ') || '-']
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.8, textColor: [15, 23, 42], lineColor: [15, 23, 42], lineWidth: 0.2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 26, fillColor: [241, 245, 249] },
      2: { fontStyle: 'bold', cellWidth: 20, fillColor: [241, 245, 249] }
    },
    margin: { left: 14, right: 14 }
  });

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;

  // Una tabla por plazo
  for (const p of PLAZOS) {
    const rows = items.filter((i) => i.plazo === p.id);
    const rgb = hexToRgb(p.color);
    if (y > H - 40) {
      doc.addPage();
      y = 16;
    }
    doc.setFillColor(...rgb);
    doc.rect(14, y - 4, 3, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...rgb);
    doc.text(p.label.toUpperCase(), 20, y + 1);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(p.detalle, 20, y + 4.6);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [['#', 'Tarea recomendada', 'Detalle', 'Costo estimado']],
      body: rows.length
        ? rows.map((r, i) => [String(i + 1), r.tarea, r.detalle || '-', r.costo ? `$ ${r.costo}` : '-'])
        : [['', 'Sin tareas en este plazo.', '', '']],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, textColor: [15, 23, 42], lineColor: [203, 213, 225], lineWidth: 0.15 },
      headStyles: { fillColor: rgb, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 62, fontStyle: 'bold' }, 3: { cellWidth: 30, halign: 'right' } },
      margin: { left: 14, right: 14, bottom: 16 }
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;
  }

  // Notas
  const notas = data.mantenimiento?.notas?.trim();
  if (notas) {
    autoTable(doc, {
      startY: y,
      head: [['NOTAS DEL PLAN']],
      body: [[notas]],
      theme: 'grid',
      styles: { fontSize: 8.2, cellPadding: 3, textColor: [15, 23, 42], lineColor: [15, 23, 42], lineWidth: 0.2 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      margin: { left: 14, right: 14, bottom: 16 }
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // Aclaración + firma
  if (y > H - 45) {
    doc.addPage();
    y = 20;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    doc.splitTextToSize(
      'Las recomendaciones se basan en la inspección visual y funcional realizada en la fecha indicada. Los plazos y costos son estimativos y pueden variar según el uso del vehículo y los precios del taller.',
      W - 28
    ),
    14,
    y
  );
  doc.setDrawColor(71, 85, 105);
  doc.line(W - 84, y + 22, W - 18, y + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('FIRMA Y SELLO TÉCNICO', W - 51, y + 26, { align: 'center' });

  // Pie
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);
    doc.line(14, H - 14, W - 14, H - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`INSPECAR · Mantenimiento preventivo · ${(v.dominio || '').toUpperCase()}`, 14, H - 10);
    doc.text(`Página ${i} de ${pages}`, W - 14, H - 10, { align: 'right' });
  }
  return doc;
}
