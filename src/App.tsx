import { useState, useEffect } from 'react';
import {
  type InspectionData,
  getInteriorItems,
  EXTERIOR_ITEMS,
  MECANICA_ITEMS,
  ACCESORIOS_ITEMS,
  type ScoreValue,
  type YesNoValue
} from './types/inspection';
import { VehicleHeaderForm } from './components/VehicleHeaderForm';
import { InspectionSection } from './components/InspectionSection';
import { AccessoriesSection } from './components/AccessoriesSection';
import { CarDamageMap } from './components/CarDamageMap';
import {
  FileDown,
  RotateCcw,
  Sparkles,
  ClipboardCheck,
  Armchair,
  Car,
  Wrench,
  FileText,
  ChevronRight,
  ChevronLeft,
  Share2,
  type LucideIcon
} from 'lucide-react';
import { VEHICLE_BODY_TYPES } from './data/carData';

const STORAGE_KEY = 'inspecar_draft_v3';

const getInitialData = (): InspectionData => {
  // Fecha local (toISOString usa UTC y después de las 21 h en Argentina da el día siguiente)
  const today = new Date().toLocaleDateString('en-CA');
  return {
    id: 'INSP-' + Date.now().toString(36).toUpperCase(),
    createdAt: new Date().toISOString(),
    vehicle: {
      tipoVehiculo: 'Sedán (Con baúl)',
      marca: '',
      modelo: '',
      version: '',
      anio: '',
      dominio: '',
      combustible: 'Nafta',
      kilometros: '',
      fecha: today,
      itvVtv: '',
      clienteNombre: '',
      clienteTelefono: ''
    },
    interior: {},
    exterior: {},
    mecanica: {},
    accesorios: {},
    damageMarkers: [],
    observaciones: '',
    conclusionGeneral: ''
  };
};

/** Lee el borrador guardado y lo adapta a la versión actual (ej: carrocerías que ya no existen). */
const loadDraft = (): InspectionData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return getInitialData();
    const parsed = JSON.parse(saved) as Partial<InspectionData>;
    const base = getInitialData();
    const data: InspectionData = {
      ...base,
      ...parsed,
      vehicle: { ...base.vehicle, ...(parsed.vehicle ?? {}) },
      interior: parsed.interior ?? {},
      exterior: parsed.exterior ?? {},
      mecanica: parsed.mecanica ?? {},
      accesorios: parsed.accesorios ?? {},
      damageMarkers: Array.isArray(parsed.damageMarkers) ? parsed.damageMarkers : []
    };
    if (!VEHICLE_BODY_TYPES.includes(data.vehicle.tipoVehiculo)) {
      data.vehicle.tipoVehiculo = base.vehicle.tipoVehiculo; // ej: borradores viejos con "Furgón / Utilitario"
    }
    return data;
  } catch (e) {
    console.error(e);
    return getInitialData();
  }
};

const buildFileName = (data: InspectionData) => {
  const v = data.vehicle;
  const brand = v.marca === 'OTRA' ? v.marcaPersonalizada : v.marca;
  const model = v.modelo === 'OTRO' ? v.modeloPersonalizado : v.modelo;
  return `INSPECAR-${(v.dominio || 'AUTO').toUpperCase()}-${brand || ''}-${model || ''}.pdf`
    .replace(/\s+/g, '_')
    .replace(/[\\/:*?"<>|]/g, '');
};

const canShareFiles = () => {
  try {
    return !!navigator.canShare?.({ files: [new File([''], 'x.pdf', { type: 'application/pdf' })] });
  } catch {
    return false;
  }
};

export function App() {
  const [data, setData] = useState<InspectionData>(loadDraft);

  const [activeTab, setActiveTab] = useState<'vehiculo' | 'interior' | 'exterior' | 'mecanica' | 'accesorios' | 'carroceria' | 'resumen'>('vehiculo');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [shareSupported] = useState(canShareFiles);

  // Autoguardado con debounce (no escribe en cada tecla)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [data]);

  // Al cambiar de paso, volver arriba (en el celular quedaba scrolleado abajo)
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeTab]);

  const interiorItems = getInteriorItems(data.vehicle.tipoVehiculo);
  const sectionItems = { interior: interiorItems, exterior: EXTERIOR_ITEMS, mecanica: MECANICA_ITEMS };

  const handleScoreChange = (
    section: 'interior' | 'exterior' | 'mecanica',
    item: string,
    value: ScoreValue
  ) => {
    setData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [item]: value
      }
    }));
  };

  const handleScoreBulk = (section: 'interior' | 'exterior' | 'mecanica', updates: Record<string, ScoreValue>) => {
    setData((prev) => ({ ...prev, [section]: { ...prev[section], ...updates } }));
  };

  const handleAccessoryBulk = (updates: Record<string, YesNoValue>) => {
    setData((prev) => ({ ...prev, accesorios: { ...prev.accesorios, ...updates } }));
  };

  const handleAccessoryChange = (item: string, value: YesNoValue) => {
    setData((prev) => ({
      ...prev,
      accesorios: {
        ...prev.accesorios,
        [item]: value
      }
    }));
  };

  // jsPDF pesa ~400 KB: se descarga recién cuando se pide el PDF, así la app abre más rápido.
  const buildPdf = async () => {
    const { generateInspectionPDF } = await import('./utils/pdfGenerator');
    return generateInspectionPDF(data);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = await buildPdf();
      doc.save(buildFileName(data));
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Hubo un error al generar el PDF. Verificá los datos.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Compartir el PDF directo (WhatsApp, mail, etc.) en celulares compatibles
  const handleSharePDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = await buildPdf();
      const file = new File([doc.output('blob')], buildFileName(data), { type: 'application/pdf' });
      await navigator.share({ files: [file], title: 'Informe INSPECAR' });
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') console.error(error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('¿Deseas reiniciar la planilla para un nuevo vehículo? Se borrarán todos los datos cargados.')) {
      const fresh = getInitialData();
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      } catch (e) {
        console.error(e);
      }
      setData(fresh);
      setActiveTab('vehiculo');
    }
  };

  // Totales sólo sobre los ítems visibles (ej: "Caja de carga" no cuenta en un sedán)
  let totalB = 0, totalR = 0, totalM = 0;
  const pendingBySection = { interior: 0, exterior: 0, mecanica: 0 };
  (Object.keys(sectionItems) as (keyof typeof sectionItems)[]).forEach((sec) => {
    sectionItems[sec].forEach((item) => {
      const v = data[sec][item];
      if (v === 'B' || v === 'B-R') totalB++;
      else if (v === 'R') totalR++;
      else if (v === 'M' || v === 'R-M') totalM++;
      else if (v == null) pendingBySection[sec]++;
    });
  });
  const totalPending = pendingBySection.interior + pendingBySection.exterior + pendingBySection.mecanica;

  const tabs: { id: typeof activeTab; step: string; label: string; icon: LucideIcon }[] = [
    { id: 'vehiculo', step: '01', label: '1. Vehículo', icon: Car },
    { id: 'interior', step: '02', label: '2. Interior', icon: Armchair },
    { id: 'exterior', step: '03', label: '3. Exterior', icon: Car },
    { id: 'mecanica', step: '04', label: '4. Mecánica', icon: Wrench },
    { id: 'accesorios', step: '05', label: '5. Accesorios', icon: ClipboardCheck },
    { id: 'carroceria', step: '06', label: '6. Chapa', icon: Sparkles },
    { id: 'resumen', step: '07', label: '7. Resumen', icon: FileText }
  ];

  const currentTabIndex = tabs.findIndex((t) => t.id === activeTab);
  const prevTab = currentTabIndex > 0 ? tabs[currentTabIndex - 1] : null;
  const nextTab = currentTabIndex < tabs.length - 1 ? tabs[currentTabIndex + 1] : null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white pb-24">
      {/* Top Header Bar Sticky: Título INSPECAR + Botón PDF */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-slate-900 shadow-sm">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="INSPECAR"
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </div>

          {/* Top Actions: Reset + Botón PDF Directo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="p-2 border-2 border-slate-300 text-slate-500 hover:text-rose-600 hover:border-slate-900 transition-colors"
              title="Reiniciar planilla"
              aria-label="Reiniciar planilla (nueva inspección)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-black px-4 py-2.5 text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <FileDown className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Creando...' : 'PDF'}</span>
            </button>
          </div>
        </div>

        {/* BARRA DE PASOS EN LÍNEA ARRIBA CON SCROLL HORIZONTAL */}
        <div className="border-t border-slate-200 bg-slate-50 overflow-x-auto scrollbar-none px-3 py-2 sm:py-2.5">
          <div className="max-w-3xl mx-auto flex items-center gap-2 min-w-max">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 border-2 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    active
                      ? 'bg-slate-900 border-slate-900 text-white shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] scale-[1.02]'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-slate-900 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-3 sm:p-5">
        {/* Autosave status line */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 px-1 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-600 inline-block" />
            <span>Auto guardado</span>
          </div>
          <span className="font-bold text-slate-600">
            Paso {tabs[currentTabIndex].step} de 07: {tabs[currentTabIndex].label}
          </span>
        </div>

        {/* TAB 1: VEHICULO */}
        {activeTab === 'vehiculo' && (
          <VehicleHeaderForm
            vehicle={data.vehicle}
            onChange={(updated) => setData((prev) => ({ ...prev, vehicle: updated }))}
          />
        )}

        {/* TAB 2: INTERIOR */}
        {activeTab === 'interior' && (
          <InspectionSection
            title="Puntos de Control: Interior"
            stepNumber="02"
            items={interiorItems}
            values={data.interior}
            onChange={(item, val) => handleScoreChange('interior', item, val)}
            onBulkChange={(updates) => handleScoreBulk('interior', updates)}
            icon={<Armchair className="w-5 h-5 text-slate-900" />}
          />
        )}

        {/* TAB 3: EXTERIOR */}
        {activeTab === 'exterior' && (
          <InspectionSection
            title="Puntos de Control: Exterior"
            stepNumber="03"
            items={EXTERIOR_ITEMS}
            values={data.exterior}
            onChange={(item, val) => handleScoreChange('exterior', item, val)}
            onBulkChange={(updates) => handleScoreBulk('exterior', updates)}
            icon={<Car className="w-5 h-5 text-slate-900" />}
          />
        )}

        {/* TAB 4: MECANICA */}
        {activeTab === 'mecanica' && (
          <InspectionSection
            title="Puntos de Control: Mecánica"
            stepNumber="04"
            items={MECANICA_ITEMS}
            values={data.mecanica}
            onChange={(item, val) => handleScoreChange('mecanica', item, val)}
            onBulkChange={(updates) => handleScoreBulk('mecanica', updates)}
            icon={<Wrench className="w-5 h-5 text-slate-900" />}
          />
        )}

        {/* TAB 5: ACCESORIOS */}
        {activeTab === 'accesorios' && (
          <AccessoriesSection
            items={ACCESORIOS_ITEMS}
            values={data.accesorios}
            onChange={handleAccessoryChange}
            onBulkChange={handleAccessoryBulk}
          />
        )}

        {/* TAB 6: CARROCERIA & DAÑOS */}
        {activeTab === 'carroceria' && (
          <CarDamageMap
            markers={data.damageMarkers}
            bodyType={data.vehicle.tipoVehiculo}
            onBodyTypeChange={(newType) =>
              setData((prev) => ({
                ...prev,
                vehicle: { ...prev.vehicle, tipoVehiculo: newType }
              }))
            }
            onChange={(markers) => setData((prev) => ({ ...prev, damageMarkers: markers }))}
          />
        )}

        {/* TAB 7: RESUMEN, OBSERVACIONES & DICTAMEN */}
        {activeTab === 'resumen' && (
          <div className="space-y-4">
            {/* Balance general */}
            <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 border-b-2 border-slate-900 pb-1.5">
                Balance Total de Inspección
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="border-2 border-slate-900 bg-emerald-50 p-2.5 text-center">
                  <div className="text-2xl font-black font-mono text-emerald-800">{totalB}</div>
                  <div className="text-[10px] font-bold uppercase text-emerald-900">Buenos</div>
                </div>
                <div className="border-2 border-slate-900 bg-amber-50 p-2.5 text-center">
                  <div className="text-2xl font-black font-mono text-amber-800">{totalR}</div>
                  <div className="text-[10px] font-bold uppercase text-amber-900">Regulares</div>
                </div>
                <div className="border-2 border-slate-900 bg-rose-50 p-2.5 text-center">
                  <div className="text-2xl font-black font-mono text-rose-800">{totalM}</div>
                  <div className="text-[10px] font-bold uppercase text-rose-900">Malos</div>
                </div>
              </div>

              {totalPending > 0 && (
                <div className="mt-3 border-2 border-amber-500 bg-amber-50 p-2.5 text-xs text-amber-900">
                  <strong>Faltan {totalPending} ítems sin evaluar:</strong>{' '}
                  {(Object.keys(pendingBySection) as (keyof typeof pendingBySection)[])
                    .filter((sec) => pendingBySection[sec] > 0)
                    .map((sec, i, arr) => (
                      <span key={sec}>
                        <button type="button" className="underline font-bold" onClick={() => setActiveTab(sec)}>
                          {sec === 'interior' ? 'Interior' : sec === 'exterior' ? 'Exterior' : 'Mecánica'} ({pendingBySection[sec]})
                        </button>
                        {i < arr.length - 1 ? ' · ' : ''}
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Dictamen */}
            <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-4">
              <label htmlFor="dictamen" className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                Dictamen Final Pre-Compra
              </label>
              <select
                id="dictamen"
                value={data.conclusionGeneral || ''}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, conclusionGeneral: e.target.value as InspectionData['conclusionGeneral'] }))
                }
                className="w-full bg-slate-50 border-2 border-slate-900 px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white"
              >
                <option value="">— Elegir dictamen —</option>
                <option value="Recomendado">🟢 Recomendado (Buen estado general)</option>
                <option value="Con reparaciones pendientes">🟡 Recomendado con reparaciones / mantenimiento a considerar</option>
                <option value="No recomendado">🔴 No recomendado (Riesgos mecánicos severos)</option>
                <option value="A criterio del comprador">⚪ A criterio del comprador</option>
              </select>
            </div>

            {/* Observaciones */}
            <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-4">
              <label htmlFor="observaciones" className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                Observaciones Detalladas
              </label>
              <textarea
                id="observaciones"
                rows={6}
                value={data.observaciones}
                onChange={(e) => setData((prev) => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Escribe el reporte técnico detallado..."
                className="w-full bg-slate-50 border-2 border-slate-900 p-3 text-sm font-medium text-slate-900 focus:outline-none focus:bg-white leading-relaxed"
              />
            </div>

            {shareSupported && (
              <button
                type="button"
                onClick={handleSharePDF}
                disabled={isGeneratingPdf}
                className="w-full h-12 border-2 border-slate-900 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black text-sm uppercase flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]"
              >
                <Share2 className="w-4 h-4" aria-hidden />
                Compartir PDF (WhatsApp, mail…)
              </button>
            )}
          </div>
        )}
      </main>

      {/* BARRA INFERIOR FIJA: VOLVER + RESUMEN EN EL MEDIO + SIGUIENTE */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t-2 border-slate-900 p-2 sm:p-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_10px_rgba(15,23,42,0.08)]">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          {/* Botón Volver */}
          {prevTab ? (
            <button
              type="button"
              onClick={() => setActiveTab(prevTab.id)}
              className="h-11 px-3.5 border-2 border-slate-900 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs uppercase font-mono flex items-center gap-1 active:scale-95 transition-all shrink-0"
            >
              <ChevronLeft className="w-4 h-4 stroke-[3]" />
              <span>Volver</span>
            </button>
          ) : (
            <div className="w-20" />
          )}

          {/* Resumen en el medio: B / R / M */}
          <div className="flex border-2 border-slate-900 font-mono text-xs font-black divide-x-2 divide-slate-900 bg-white shadow-sm">
            <span className="px-2.5 py-1.5 text-emerald-700 bg-emerald-50">B:{totalB}</span>
            <span className="px-2.5 py-1.5 text-amber-700 bg-amber-50">R:{totalR}</span>
            <span className="px-2.5 py-1.5 text-rose-700 bg-rose-50">M:{totalM}</span>
          </div>

          {/* Botón Siguiente / Descargar PDF final */}
          {nextTab ? (
            <button
              type="button"
              onClick={() => setActiveTab(nextTab.id)}
              className="h-11 px-4 border-2 border-slate-900 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase font-mono flex items-center gap-1.5 active:scale-95 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all shrink-0"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="h-11 px-4 border-2 border-slate-900 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase font-mono flex items-center gap-1.5 active:scale-95 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all shrink-0"
            >
              <FileDown className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Creando...' : 'PDF Final'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
