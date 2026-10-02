import { useState, useEffect } from 'react';
import {
  type InspectionData,
  INTERIOR_ITEMS,
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
import { generateInspectionPDF } from './utils/pdfGenerator';
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
  ChevronLeft
} from 'lucide-react';

const STORAGE_KEY = 'inspecar_draft_v3';

const getInitialData = (): InspectionData => {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: 'INSP-' + Date.now().toString(36).toUpperCase(),
    createdAt: new Date().toISOString(),
    vehicle: {
      tipoVehiculo: 'Pick-up (Con caja)',
      marca: 'Fiat',
      modelo: 'Toro Freedom',
      version: '2.0 MultiJet 4x4 AT9',
      anio: '2018',
      dominio: 'AC 073 DR',
      combustible: 'Diesel',
      kilometros: '138600',
      fecha: today,
      itvVtv: 'NO'
    },
    interior: {},
    exterior: {},
    mecanica: {},
    accesorios: {},
    damageMarkers: [],
    observaciones:
      'Cubiertas del 2021 al 40% | Frenos delanteros al 40% | Lona marítima en buen estado, faltan varillas | Pérdida de aceite por junta del depresor | Ópticas delanteras sucias | Tapones traseros rotos | Ópticas antinieblas con humedad | Respaldar asiento trasero no traba | Salidas de ventilación centrales rotas | Distribución y correa de accesorios desgastados | Admisión tapada de hollín.',
    conclusionGeneral: 'Con reparaciones pendientes'
  };
};

export function App() {
  const [data, setData] = useState<InspectionData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return getInitialData();
  });

  const [activeTab, setActiveTab] = useState<'vehiculo' | 'interior' | 'exterior' | 'mecanica' | 'accesorios' | 'carroceria' | 'resumen'>('vehiculo');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSaveToast(true);
      const timer = setTimeout(() => setSaveToast(false), 2000);
      return () => clearTimeout(timer);
    } catch (e) {
      console.error(e);
    }
  }, [data]);

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

  const handleAccessoryChange = (item: string, value: YesNoValue) => {
    setData((prev) => ({
      ...prev,
      accesorios: {
        ...prev.accesorios,
        [item]: value
      }
    }));
  };

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = generateInspectionPDF(data);
      const brand = data.vehicle.marca === 'OTRA' ? data.vehicle.marcaPersonalizada : data.vehicle.marca;
      const model = data.vehicle.modelo === 'OTRO' ? data.vehicle.modeloPersonalizado : data.vehicle.modelo;
      const filename = `INSPECAR-${(data.vehicle.dominio || 'AUTO').toUpperCase()}-${(brand || '')}-${(model || '')}.pdf`.replace(/\s+/g, '_');
      doc.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Hubo un error al generar el PDF. Verifica los datos.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('¿Deseas reiniciar la planilla para un nuevo vehículo?')) {
      const fresh = getInitialData();
      fresh.vehicle.marca = 'Fiat';
      fresh.vehicle.modelo = '';
      fresh.vehicle.dominio = '';
      fresh.vehicle.anio = '';
      fresh.vehicle.kilometros = '';
      fresh.observaciones = '';
      fresh.interior = {};
      fresh.exterior = {};
      fresh.mecanica = {};
      fresh.accesorios = {};
      fresh.damageMarkers = [];
      setData(fresh);
      setActiveTab('vehiculo');
    }
  };

  // Quick stats
  const countCategory = (cat: 'interior' | 'exterior' | 'mecanica', score: 'B' | 'R' | 'M') => {
    return Object.values(data[cat]).filter((val) => {
      if (score === 'B') return val === 'B' || val === 'B-R';
      if (score === 'R') return val === 'R';
      if (score === 'M') return val === 'M' || val === 'R-M';
      return false;
    }).length;
  };

  const totalB = countCategory('interior', 'B') + countCategory('exterior', 'B') + countCategory('mecanica', 'B');
  const totalR = countCategory('interior', 'R') + countCategory('exterior', 'R') + countCategory('mecanica', 'R');
  const totalM = countCategory('interior', 'M') + countCategory('exterior', 'M') + countCategory('mecanica', 'M');

  const tabs: { id: typeof activeTab; step: string; label: string; icon: any }[] = [
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_0px_rgba(203,213,225,1)]">
              IN
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900 leading-tight">
                INSPECAR
              </h1>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                {data.vehicle.dominio ? data.vehicle.dominio : 'NUEVA INSPECCIÓN'}
              </span>
            </div>
          </div>

          {/* Top Actions: Reset + Botón PDF Directo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 border-2 border-slate-300 text-slate-500 hover:text-rose-600 hover:border-slate-900 transition-colors"
              title="Reiniciar planilla"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-2 text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <FileDown className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Creando...' : 'PDF'}</span>
            </button>
          </div>
        </div>

        {/* BARRA DE PASOS EN LÍNEA ARRIBA CON SCROLL HORIZONTAL */}
        <div className="border-t border-slate-200 bg-slate-50 overflow-x-auto scrollbar-none px-2 py-1.5">
          <div className="max-w-3xl mx-auto flex items-center gap-1.5 min-w-max">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border-2 text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    active
                      ? 'bg-slate-900 border-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] scale-[1.02]'
                      : 'bg-white border-slate-300 text-slate-600 hover:border-slate-900 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
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
            {saveToast && <span className="text-emerald-700 font-bold">✓</span>}
          </div>
          <span className="font-bold text-slate-600">
            Paso {tabs[currentTabIndex].step} de 07: {tabs[currentTabIndex].label}
          </span>
        </div>

        {/* TAB 1: VEHICULO */}
        {activeTab === 'vehiculo' && (
          <VehicleHeaderForm
            vehicle={data.vehicle}
            onChange={(updated) => setData({ ...data, vehicle: updated })}
          />
        )}

        {/* TAB 2: INTERIOR */}
        {activeTab === 'interior' && (
          <InspectionSection
            title="Puntos de Control: Interior"
            stepNumber="02"
            items={INTERIOR_ITEMS}
            values={data.interior}
            onChange={(item, val) => handleScoreChange('interior', item, val)}
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
            icon={<Wrench className="w-5 h-5 text-slate-900" />}
          />
        )}

        {/* TAB 5: ACCESORIOS */}
        {activeTab === 'accesorios' && (
          <AccessoriesSection
            items={ACCESORIOS_ITEMS}
            values={data.accesorios}
            onChange={handleAccessoryChange}
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
            onChange={(markers) => setData({ ...data, damageMarkers: markers })}
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
            </div>

            {/* Dictamen */}
            <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-4">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                Dictamen Final Pre-Compra
              </label>
              <select
                value={data.conclusionGeneral || ''}
                onChange={(e) => setData({ ...data, conclusionGeneral: e.target.value as any })}
                className="w-full bg-slate-50 border-2 border-slate-900 px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white"
              >
                <option value="Recomendado">🟢 Recomendado (Buen estado general)</option>
                <option value="Con reparaciones pendientes">🟡 Recomendado con reparaciones / mantenimiento a considerar</option>
                <option value="No recomendado">🔴 No recomendado (Riesgos mecánicos severos)</option>
                <option value="A criterio del comprador">⚪ A criterio del comprador</option>
              </select>
            </div>

            {/* Observaciones */}
            <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-4">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                Observaciones Detalladas
              </label>
              <textarea
                rows={5}
                value={data.observaciones}
                onChange={(e) => setData({ ...data, observaciones: e.target.value })}
                placeholder="Escribe el reporte técnico detallado..."
                className="w-full bg-slate-50 border-2 border-slate-900 p-3 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white leading-relaxed"
              />
            </div>
          </div>
        )}
      </main>

      {/* BARRA INFERIOR FIJA: VOLVER + RESUMEN EN EL MEDIO + SIGUIENTE */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t-2 border-slate-900 p-2 sm:p-3 shadow-[0_-4px_10px_rgba(15,23,42,0.08)]">
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
              <span>PDF Final</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
