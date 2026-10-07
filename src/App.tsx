import { useState, useEffect, useRef, useCallback } from 'react';
import {
  type InspectionData,
  type ScoreValue,
  type YesNoValue,
  type ObsSection,
  type Estado,
  INTERIOR_ITEMS,
  getExteriorItems,
  MECANICA_ITEMS,
  ACCESORIOS_ITEMS,
  ESTADOS,
  OBS_SECTION_LABEL,
  normalizeMarkers,
  compileObservaciones,
  suggestMantenimiento
} from './types/inspection';
import { VEHICLE_BODY_TYPES } from './data/carData';
import { VehicleHeaderForm } from './components/VehicleHeaderForm';
import { InspectionSection } from './components/InspectionSection';
import { AccessoriesSection } from './components/AccessoriesSection';
import { CarDamageMap } from './components/CarDamageMap';
import { SectionNotes } from './components/SectionNotes';
import { MaintenanceSection } from './components/MaintenanceSection';
import { RecordsView } from './components/RecordsView';
import { Sidebar, type NavStep } from './components/Sidebar';
import { ThemeMenu } from './components/ThemeMenu';
import { PinGate } from './components/PinGate';
import { repo, hasContent } from './lib/repo';
import { cloudEnabled, lockApp } from './lib/supabase';
import { applyTheme, loadTheme, type ThemeId } from './lib/theme';
import {
  FileDown,
  Plus,
  Sparkles,
  ClipboardCheck,
  Armchair,
  Car,
  Wrench,
  FileText,
  ChevronRight,
  ChevronLeft,
  Share2,
  Database,
  ArrowLeft,
  Pencil,
  Trash2
} from 'lucide-react';
import { notify, confirmAction } from './lib/dialogs';

const STORAGE_KEY = 'inspecar_draft_v3';

type TabId = 'vehiculo' | 'interior' | 'exterior' | 'mecanica' | 'accesorios' | 'carroceria' | 'resumen';
type ScoreSection = 'interior' | 'exterior' | 'mecanica';

const getInitialData = (): InspectionData => ({
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
    // Fecha local (toISOString usa UTC y después de las 21 h en Argentina da el día siguiente)
    fecha: new Date().toLocaleDateString('en-CA'),
    itvVtv: '',
    clienteNombre: '',
    clienteDni: '',
    clienteTelefono: ''
  },
  interior: {},
  exterior: {},
  mecanica: {},
  accesorios: {},
  damageMarkers: [],
  observaciones: '',
  obsSecciones: {},
  estado: 'borrador',
  conclusionGeneral: ''
});

/** Adapta cualquier inspección guardada (borrador, historial o base) a la versión actual. */
const normalize = (parsed: Partial<InspectionData>): InspectionData => {
  const base = getInitialData();
  const data: InspectionData = {
    ...base,
    ...parsed,
    vehicle: { ...base.vehicle, ...(parsed.vehicle ?? {}) },
    interior: parsed.interior ?? {},
    exterior: parsed.exterior ?? {},
    mecanica: parsed.mecanica ?? {},
    accesorios: parsed.accesorios ?? {},
    obsSecciones: parsed.obsSecciones ?? {},
    estado: parsed.estado ?? 'borrador',
    damageMarkers: normalizeMarkers(parsed.damageMarkers) // "Bollo" → "Dañado"
  };
  if (!VEHICLE_BODY_TYPES.includes(data.vehicle.tipoVehiculo)) {
    // nombres viejos (ej. "Coupé (2 puertas)") se mapean al actual; si no, sedán
    const coupe = VEHICLE_BODY_TYPES.find((t) => /coup/i.test(t));
    data.vehicle.tipoVehiculo = /coup/i.test(data.vehicle.tipoVehiculo) && coupe ? coupe : base.vehicle.tipoVehiculo;
  }
  return data;
};

const loadDraft = (): InspectionData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalize(JSON.parse(saved)) : getInitialData();
  } catch {
    return getInitialData();
  }
};

const buildFileName = (d: InspectionData, prefix = 'INSPECAR') => {
  const v = d.vehicle;
  const brand = v.marca === 'OTRA' ? v.marcaPersonalizada : v.marca;
  const model = v.modelo === 'OTRO' ? v.modeloPersonalizado : v.modelo;
  return `${prefix}-${(v.dominio || 'AUTO').toUpperCase()}-${brand || ''}-${model || ''}.pdf`
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

const TABS: { id: TabId; label: string; icon: typeof Car }[] = [
  { id: 'vehiculo', label: 'Vehículo', icon: Car },
  { id: 'interior', label: 'Interior', icon: Armchair },
  { id: 'exterior', label: 'Exterior', icon: Car },
  { id: 'mecanica', label: 'Mecánica', icon: Wrench },
  { id: 'accesorios', label: 'Accesorios', icon: ClipboardCheck },
  { id: 'carroceria', label: 'Chapa', icon: Sparkles },
  { id: 'resumen', label: 'Resumen', icon: FileText }
];

export function App() {
  return (
    <PinGate>
      <Inspecar />
    </PinGate>
  );
}

function Inspecar() {
  const [data, setData] = useState<InspectionData>(loadDraft);
  const [view, setView] = useState<'inspeccion' | 'registros'>('inspeccion');
  const [activeTab, setActiveTab] = useState<TabId>('vehiculo');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [shareSupported] = useState(canShareFiles);
  const [theme, setTheme] = useState<ThemeId>(loadTheme);
  const [sync, setSync] = useState<'local' | 'saving' | 'saved' | 'pending'>(cloudEnabled ? 'saved' : 'local');
  const [refreshKey, setRefreshKey] = useState(0);
  const [vehKey, setVehKey] = useState(0); // fuerza a reiniciar el formulario del vehículo al limpiarlo
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => applyTheme(theme), [theme]);

  // Borrador local inmediato (debounce corto)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [data]);

  // Guardado en registros / base de datos (debounce más largo para no escribir en cada tecla)
  useEffect(() => {
    if (!hasContent(data)) return;
    const t = setTimeout(async () => {
      if (cloudEnabled) setSync('saving');
      const ok = await repo.save(data);
      if (cloudEnabled) setSync(ok ? 'saved' : 'pending');
    }, 1500);
    return () => clearTimeout(t);
  }, [data]);

  // Al volver la señal, subir lo pendiente
  useEffect(() => {
    const flush = () =>
      repo.flush().then((n) => {
        if (n > 0) {
          setSync('saved');
          setRefreshKey((k) => k + 1);
        }
      });
    flush();
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeTab, view]);

  const exteriorItems = getExteriorItems(data.vehicle.tipoVehiculo);
  const sectionItems = { interior: INTERIOR_ITEMS, exterior: exteriorItems, mecanica: MECANICA_ITEMS };

  // ── edición ───────────────────────────────────────────────
  const handleScoreChange = (section: ScoreSection, item: string, value: ScoreValue) =>
    setData((prev) => ({ ...prev, [section]: { ...prev[section], [item]: value } }));
  const handleScoreBulk = (section: ScoreSection, updates: Record<string, ScoreValue>) =>
    setData((prev) => ({ ...prev, [section]: { ...prev[section], ...updates } }));
  const handleAccessoryChange = (item: string, value: YesNoValue) =>
    setData((prev) => ({ ...prev, accesorios: { ...prev.accesorios, [item]: value } }));
  const handleAccessoryBulk = (updates: Record<string, YesNoValue>) =>
    setData((prev) => ({ ...prev, accesorios: { ...prev.accesorios, ...updates } }));
  const setObs = (k: ObsSection, v: string) => setData((prev) => ({ ...prev, obsSecciones: { ...prev.obsSecciones, [k]: v } }));

  const notesFor = (k: ObsSection) => (
    <SectionNotes id={`obs-${k}`} title={OBS_SECTION_LABEL[k]} value={data.obsSecciones?.[k] ?? ''} onChange={(v) => setObs(k, v)} />
  );

  // ── PDF ───────────────────────────────────────────────────
  // jsPDF pesa ~400 KB: se descarga recién cuando se pide el PDF.
  const buildPdf = async (d: InspectionData) => (await import('./utils/pdfGenerator')).generateInspectionPDF(d);

  const runPdf = async (fn: () => Promise<void>) => {
    setIsGeneratingPdf(true);
    try {
      await fn();
    } catch (error) {
      console.error(error);
      notify('Hubo un error al generar el PDF. Revisá los datos e intentá de nuevo.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPDF = (d: InspectionData = data) =>
    runPdf(async () => {
      (await buildPdf(d)).save(buildFileName(d));
      if (d.id === data.id && (data.estado ?? 'borrador') === 'borrador') setData((p) => ({ ...p, estado: 'finalizada' }));
    });

  const handleDownloadMaintenance = () =>
    runPdf(async () => {
      const { generateMaintenancePDF } = await import('./utils/maintenancePdf');
      (await generateMaintenancePDF(data)).save(buildFileName(data, 'INSPECAR-MANTENIMIENTO'));
    });

  const handleSharePDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = await buildPdf(data);
      const file = new File([doc.output('blob')], buildFileName(data), { type: 'application/pdf' });
      await navigator.share({ files: [file], title: 'Informe INSPECAR' });
      if ((data.estado ?? 'borrador') !== 'compro' && data.estado !== 'no_compro') setData((p) => ({ ...p, estado: 'entregada' }));
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') console.error(error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // ── registros ─────────────────────────────────────────────
  const openRecord = useCallback(async (id: string) => {
    const current = dataRef.current;
    if (hasContent(current)) await repo.save(current); // la planilla actual no se pierde
    const d = await repo.get(id);
    if (!d) {
      notify('No se encontró la inspección. Puede que se haya borrado desde otro dispositivo.');
      return;
    }
    setData(normalize(d));
    setActiveTab('vehiculo');
    setView('inspeccion');
  }, []);

  const downloadRecord = async (id: string) => {
    const d = await repo.get(id);
    if (d) handleDownloadPDF(normalize(d));
  };

  const handleNew = async () => {
    const msg = hasContent(data) ? '¿Empezar una nueva inspección? La actual queda guardada en Registros.' : '¿Empezar una nueva inspección?';
    if (!(await confirmAction({ title: 'Nueva inspección', text: msg, confirmText: 'Empezar nueva' }))) return;
    if (hasContent(data)) await repo.save(data);
    setData(getInitialData());
    setActiveTab('vehiculo');
    setView('inspeccion');
    setRefreshKey((k) => k + 1);
  };

  // Borra la ficha abierta completa: los datos cargados y su registro (también en la nube)
  const handleDeleteCurrent = async () => {
    if (!hasContent(data)) {
      notify('La ficha está vacía, no hay nada para borrar.', 'info', 'Ficha vacía');
      return;
    }
    const ok = await confirmAction({
      title: `¿Borrar la ficha ${data.vehicle.dominio || 'actual'}?`,
      text: 'Se borran todos los datos cargados de esta inspección (vehículo, cliente, checklist, chapa, observaciones) y su registro. No se puede deshacer.',
      confirmText: 'Borrar ficha',
      danger: true
    });
    if (!ok) return;
    try {
      await repo.remove(data.id);
    } catch {
      notify('Se limpió la ficha, pero no se pudo borrar el registro de la nube. Borralo desde Registros cuando tengas señal.', 'warning');
    }
    setData(getInitialData());
    setActiveTab('vehiculo');
    setRefreshKey((k) => k + 1);
  };

  // Limpia sólo el paso actual (sus datos y sus observaciones), con confirmación
  const SECTION_CLEAR: Partial<Record<TabId, string>> = {
    vehiculo: 'los datos del vehículo y del cliente',
    interior: 'las calificaciones y observaciones de Interior',
    exterior: 'las calificaciones y observaciones de Exterior',
    mecanica: 'las calificaciones y observaciones de Mecánica',
    accesorios: 'los accesorios marcados y sus observaciones',
    carroceria: 'todos los puntos de chapa y sus observaciones'
  };
  const sectionHasData = (t: TabId): boolean => {
    const obs = (k: ObsSection) => Boolean(data.obsSecciones?.[k]?.trim());
    switch (t) {
      case 'vehiculo': {
        const v = data.vehicle, b = getInitialData().vehicle;
        return (Object.keys(v) as (keyof typeof v)[]).some((k) => k !== 'fecha' && (v[k] ?? '') !== (b[k] ?? ''));
      }
      case 'interior':
      case 'exterior':
      case 'mecanica':
        return Object.values(data[t]).some((x) => x != null) || obs(t);
      case 'accesorios':
        return Object.values(data.accesorios).some((x) => x != null) || obs('accesorios');
      case 'carroceria':
        return data.damageMarkers.length > 0 || obs('carroceria');
      default:
        return false;
    }
  };
  const handleClearSection = async (t: TabId) => {
    const what = SECTION_CLEAR[t];
    if (!what) return;
    const label = TABS.find((x) => x.id === t)?.label ?? '';
    const ok = await confirmAction({
      title: `¿Limpiar ${label}?`,
      text: `Se borran ${what}. El resto de la ficha queda igual.`,
      confirmText: 'Limpiar',
      danger: true
    });
    if (!ok) return;
    if (t === 'vehiculo') setVehKey((k) => k + 1);
    setData((p) => {
      const obsSecciones = { ...p.obsSecciones };
      switch (t) {
        case 'vehiculo':
          return { ...p, vehicle: { ...getInitialData().vehicle, fecha: p.vehicle.fecha } };
        case 'interior':
        case 'exterior':
        case 'mecanica':
          delete obsSecciones[t];
          return { ...p, [t]: {}, obsSecciones };
        case 'accesorios':
          delete obsSecciones.accesorios;
          return { ...p, accesorios: {}, obsSecciones };
        case 'carroceria':
          delete obsSecciones.carroceria;
          return { ...p, damageMarkers: [], obsSecciones };
        default:
          return p;
      }
    });
  };

  // ── totales ───────────────────────────────────────────────
  let totalB = 0,
    totalR = 0,
    totalM = 0;
  const pendingBySection: Record<ScoreSection, number> = { interior: 0, exterior: 0, mecanica: 0 };
  (Object.keys(sectionItems) as ScoreSection[]).forEach((sec) => {
    sectionItems[sec].forEach((item) => {
      const v = data[sec][item];
      if (v === 'B' || v === 'B-R') totalB++;
      else if (v === 'R') totalR++;
      else if (v === 'M' || v === 'R-M') totalM++;
      else if (v == null) pendingBySection[sec]++;
    });
  });
  const totalPending = pendingBySection.interior + pendingBySection.exterior + pendingBySection.mecanica;
  const accPending = ACCESORIOS_ITEMS.filter((i) => data.accesorios[i] == null).length;

  const navSteps: NavStep[] = TABS.map((t) => ({
    id: t.id,
    label: t.label,
    icon: t.icon,
    pending: t.id in pendingBySection ? pendingBySection[t.id as ScoreSection] : t.id === 'accesorios' ? accPending : 0,
    done:
      t.id === 'vehiculo'
        ? Boolean(data.vehicle.dominio && data.vehicle.marca)
        : t.id === 'resumen'
          ? Boolean(data.conclusionGeneral)
          : t.id === 'carroceria'
            ? false
            : true
  }));

  const currentTabIndex = TABS.findIndex((t) => t.id === activeTab);
  const prevTab = currentTabIndex > 0 ? TABS[currentTabIndex - 1] : null;
  const nextTab = currentTabIndex < TABS.length - 1 ? TABS[currentTabIndex + 1] : null;
  const goTab = (id: string) => {
    setActiveTab(id as TabId);
    setView('inspeccion');
  };
  const compiled = compileObservaciones(data);

  return (
    <div className="min-h-screen lg:flex text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      <Sidebar
        steps={navSteps}
        activeStep={activeTab}
        view={view}
        sync={sync}
        canLock={cloudEnabled}
        onStep={goTab}
        onRecords={() => setView('registros')}
        onNew={handleNew}
        onDelete={handleDeleteCurrent}
        onLock={() => lockApp()}
      />

      <div className="flex-1 min-w-0 flex flex-col pb-24 lg:pb-0">
        {/* Cabecera */}
        <header className="app-topbar sticky top-0 z-40 bg-white border-b-2 border-slate-900 shadow-sm">
          <div className="max-w-3xl lg:max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative lg:hidden shrink-0">
                <img src="/logo.png" alt="INSPECAR" className="logo-img h-7 sm:h-8 w-auto object-contain" />
                <span
                  className={`absolute -top-1 -right-2 w-2.5 h-2.5 rounded-full ring-2 ring-white ${sync === 'pending' ? 'bg-amber-500' : sync === 'saving' ? 'bg-slate-400 animate-pulse' : 'bg-emerald-500'}`}
                  role="status"
                  aria-label={sync === 'pending' ? 'Sin señal: se sube después' : sync === 'saving' ? 'Guardando' : 'Guardado'}
                  title={sync === 'pending' ? 'Sin señal: se sube después' : sync === 'saving' ? 'Guardando…' : 'Guardado'}
                />
              </span>
              <div className="hidden lg:block min-w-0">
                <p className="text-[11px] font-mono uppercase tracking-widest opacity-60">
                  {view === 'registros' ? 'Gestión' : `Paso ${currentTabIndex + 1} de ${TABS.length}`}
                </p>
                <h1 className="text-xl font-black tracking-tight truncate">
                  {view === 'registros' ? 'Registros y seguimiento' : TABS[currentTabIndex].label}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeMenu value={theme} onChange={setTheme} />
              <button
                type="button"
                onClick={() => setView(view === 'registros' ? 'inspeccion' : 'registros')}
                className="lg:hidden p-2 border-2 border-slate-300 text-slate-600 hover:border-slate-900 bg-white"
                title="Registros"
                aria-label={view === 'registros' ? 'Volver a la inspección' : 'Ver registros'}
              >
                {view === 'registros' ? <ArrowLeft className="w-4 h-4" /> : <Database className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleNew}
                className="p-2 border-2 border-slate-300 text-slate-600 hover:border-slate-900 bg-white"
                title="Nueva inspección"
                aria-label="Nueva inspección"
              >
                <Plus className="w-4 h-4" />
              </button>
              {view === 'inspeccion' && (
                <button
                  type="button"
                  onClick={handleDeleteCurrent}
                  className="p-2 border-2 border-rose-200 text-rose-600 hover:border-rose-600 hover:bg-rose-50 bg-white"
                  title="Borrar ficha completa"
                  aria-label="Borrar ficha completa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDownloadPDF()}
                disabled={isGeneratingPdf}
                className="btn-accent flex items-center gap-1.5 disabled:opacity-60 font-black px-4 py-2.5 text-xs uppercase tracking-wider border-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
              >
                <FileDown className="w-4 h-4" aria-hidden />
                <span>{isGeneratingPdf ? 'Creando…' : 'PDF'}</span>
              </button>
            </div>
          </div>

          {/* Pasos (sólo celular/tablet; en PC está la barra lateral) */}
          {view === 'inspeccion' && (
            <nav aria-label="Pasos" className="lg:hidden border-t border-slate-200 bg-slate-50 overflow-x-auto scrollbar-none px-3 py-2">
              <div className="max-w-3xl mx-auto flex items-center gap-2 min-w-max">
                {TABS.map((tab, i) => {
                  const active = activeTab === tab.id;
                  const Icon = tab.icon;
                  const pend = navSteps[i].pending;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      aria-current={active ? 'step' : undefined}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 border-2 text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap ${
                        active ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300 text-slate-700 hover:border-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" aria-hidden />
                      <span>
                        {i + 1}. {tab.label}
                      </span>
                      {pend > 0 && !active && <span className="text-[9px] bg-amber-200 text-amber-900 px-1">{pend}</span>}
                    </button>
                  );
                })}
              </div>
            </nav>
          )}
        </header>

        <main className="flex-1 max-w-3xl lg:max-w-5xl w-full mx-auto p-3 sm:p-5 lg:p-8">
          {view === 'registros' ? (
            <RecordsView
              currentId={data.id}
              refreshKey={refreshKey}
              busy={isGeneratingPdf}
              onOpen={openRecord}
              onDownload={downloadRecord}
              onDeleted={(id) => {
                if (id === data.id) setData(getInitialData());
              }}
            />
          ) : (
            <>
              {activeTab === 'vehiculo' && (
                <VehicleHeaderForm key={`${data.id}-${vehKey}`} step={`${currentTabIndex + 1}/${TABS.length}`} onClear={() => handleClearSection('vehiculo')} canClear={sectionHasData('vehiculo')} vehicle={data.vehicle} onChange={(vehicle) => setData((p) => ({ ...p, vehicle }))} />
              )}

              {(['interior', 'exterior', 'mecanica'] as const).map(
                (sec) =>
                  activeTab === sec && (
                    <div key={sec}>
                      <InspectionSection
                        title={`Puntos de control: ${OBS_SECTION_LABEL[sec]}`}
                        stepNumber={`${currentTabIndex + 1}/${TABS.length}`}
                        onClear={() => handleClearSection(sec)}
                        canClear={sectionHasData(sec)}
                        items={sectionItems[sec]}
                        values={data[sec]}
                        onChange={(item, val) => handleScoreChange(sec, item, val)}
                        onBulkChange={(u) => handleScoreBulk(sec, u)}
                        icon={sec === 'interior' ? <Armchair className="w-5 h-5" /> : sec === 'mecanica' ? <Wrench className="w-5 h-5" /> : <Car className="w-5 h-5" />}
                      />
                      {notesFor(sec)}
                    </div>
                  )
              )}

              {activeTab === 'accesorios' && (
                <>
                  <AccessoriesSection
                    items={ACCESORIOS_ITEMS}
                    values={data.accesorios}
                    onChange={handleAccessoryChange}
                    onBulkChange={handleAccessoryBulk}
                    step={`${currentTabIndex + 1}/${TABS.length}`}
                    onClear={() => handleClearSection('accesorios')}
                    canClear={sectionHasData('accesorios')}
                  />
                  {notesFor('accesorios')}
                </>
              )}

              {activeTab === 'carroceria' && (
                <>
                  <CarDamageMap
                    markers={data.damageMarkers}
                    bodyType={data.vehicle.tipoVehiculo}
                    onBodyTypeChange={(tipoVehiculo) => setData((p) => ({ ...p, vehicle: { ...p.vehicle, tipoVehiculo } }))}
                    onChange={(damageMarkers) => setData((p) => ({ ...p, damageMarkers }))}
                    step={`${currentTabIndex + 1}/${TABS.length}`}
                    onClear={() => handleClearSection('carroceria')}
                    canClear={sectionHasData('carroceria')}
                  />
                  {notesFor('carroceria')}
                </>
              )}

              {activeTab === 'resumen' && (
                <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
                  <section className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-4">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 border-b-2 border-slate-900 pb-1.5">
                      Balance total de inspección
                    </h2>
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
                        {(Object.keys(pendingBySection) as ScoreSection[])
                          .filter((s) => pendingBySection[s] > 0)
                          .map((s, i, arr) => (
                            <span key={s}>
                              <button type="button" className="underline font-bold" onClick={() => setActiveTab(s)}>
                                {OBS_SECTION_LABEL[s]} ({pendingBySection[s]})
                              </button>
                              {i < arr.length - 1 ? ' · ' : ''}
                            </span>
                          ))}
                      </div>
                    )}
                  </section>

                  <section className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-4">
                    <label htmlFor="dictamen" className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                      Dictamen final pre-compra
                    </label>
                    <select
                      id="dictamen"
                      value={data.conclusionGeneral || ''}
                      onChange={(e) => setData((p) => ({ ...p, conclusionGeneral: e.target.value as InspectionData['conclusionGeneral'] }))}
                      className="w-full bg-slate-50 border-2 border-slate-900 px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:bg-white"
                    >
                      <option value="">— Elegir dictamen —</option>
                      <option value="Recomendado">🟢 Recomendado (buen estado general)</option>
                      <option value="Con reparaciones pendientes">🟡 Recomendado con reparaciones a considerar</option>
                      <option value="No recomendado">🔴 No recomendado (riesgos mecánicos severos)</option>
                      <option value="A criterio del comprador">⚪ A criterio del comprador</option>
                    </select>

                    <p className="block text-xs font-black uppercase tracking-wider text-slate-900 mt-4 mb-2">Estado del seguimiento</p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5" role="radiogroup" aria-label="Estado">
                      {ESTADOS.map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          role="radio"
                          aria-checked={(data.estado ?? 'borrador') === e.id}
                          onClick={() => setData((p) => ({ ...p, estado: e.id as Estado }))}
                          className={`px-1.5 py-2 border-2 text-[11px] font-bold ${
                            (data.estado ?? 'borrador') === e.id ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 hover:border-slate-900'
                          }`}
                        >
                          {e.label}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-4 lg:col-span-2">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">Observaciones del informe</h2>
                    {compiled.filter((c) => c.titulo !== 'General').length === 0 ? (
                      <p className="text-xs text-slate-500 mb-3">
                        Todavía no hay observaciones por sección. Se cargan al final de Interior, Exterior, Mecánica, Accesorios y Chapa.
                      </p>
                    ) : (
                      <ul className="mb-3 space-y-2">
                        {(Object.keys(OBS_SECTION_LABEL) as ObsSection[])
                          .filter((k) => data.obsSecciones?.[k]?.trim())
                          .map((k) => (
                            <li key={k} className="bg-slate-50 border border-slate-200 p-2.5 text-sm">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">{OBS_SECTION_LABEL[k]}</span>
                                <button type="button" onClick={() => setActiveTab(k)} className="text-[11px] font-bold text-slate-600 flex items-center gap-1 hover:underline">
                                  <Pencil className="w-3 h-3" aria-hidden /> Editar
                                </button>
                              </div>
                              <p className="whitespace-pre-wrap text-slate-800">{data.obsSecciones?.[k]}</p>
                            </li>
                          ))}
                      </ul>
                    )}
                    <label htmlFor="observaciones" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Observaciones generales (opcional)
                    </label>
                    <textarea
                      id="observaciones"
                      rows={4}
                      value={data.observaciones}
                      onChange={(e) => setData((p) => ({ ...p, observaciones: e.target.value }))}
                      placeholder="Algo que no entre en ninguna sección, o una conclusión para el comprador…"
                      className="w-full bg-slate-50 border-2 border-slate-900 p-3 text-sm font-medium text-slate-900 focus:outline-none focus:bg-white leading-relaxed"
                    />
                  </section>

                  <div className="lg:col-span-2 grid gap-2.5 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadPDF()}
                      disabled={isGeneratingPdf}
                      className="btn-accent h-12 border-2 font-black text-sm uppercase flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <FileDown className="w-4 h-4" aria-hidden /> Descargar informe PDF
                    </button>
                    {shareSupported && (
                      <button
                        type="button"
                        onClick={handleSharePDF}
                        disabled={isGeneratingPdf}
                        className="h-12 border-2 border-emerald-700 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black text-sm uppercase flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-4 h-4" aria-hidden /> Compartir PDF (WhatsApp…)
                      </button>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <MaintenanceSection
                      value={data.mantenimiento}
                      onChange={(mantenimiento) => setData((p) => ({ ...p, mantenimiento }))}
                      onSuggest={() => suggestMantenimiento(data, exteriorItems)}
                      onDownload={handleDownloadMaintenance}
                      busy={isGeneratingPdf}
                    />
                  </div>
                </div>
              )}

              {/* Anterior / siguiente en PC (en el celular está la barra fija de abajo) */}
              <div className="hidden lg:flex items-center justify-between mt-8">
                {prevTab ? (
                  <button type="button" onClick={() => setActiveTab(prevTab.id)} className="h-11 px-4 border-2 border-slate-900 bg-white font-bold text-sm flex items-center gap-1.5">
                    <ChevronLeft className="w-4 h-4" aria-hidden /> {prevTab.label}
                  </button>
                ) : (
                  <span />
                )}
                {nextTab && (
                  <button type="button" onClick={() => setActiveTab(nextTab.id)} className="btn-accent h-11 px-5 border-2 font-black text-sm flex items-center gap-1.5">
                    Siguiente: {nextTab.label} <ChevronRight className="w-4 h-4" aria-hidden />
                  </button>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Barra inferior (celular) */}
      {view === 'inspeccion' && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t-2 border-slate-900 p-2 sm:p-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
            {prevTab ? (
              <button
                type="button"
                onClick={() => setActiveTab(prevTab.id)}
                className="h-11 px-3.5 border-2 border-slate-900 bg-white text-slate-900 font-bold text-xs uppercase font-mono flex items-center gap-1 shrink-0"
              >
                <ChevronLeft className="w-4 h-4 stroke-[3]" aria-hidden /> Volver
              </button>
            ) : (
              <div className="w-20" />
            )}
            <div className="flex border-2 border-slate-900 font-mono text-xs font-black divide-x-2 divide-slate-900 bg-white">
              <span className="px-2 py-1.5 text-emerald-700 bg-emerald-50">B:{totalB}</span>
              <span className="px-2 py-1.5 text-amber-700 bg-amber-50">R:{totalR}</span>
              <span className="px-2 py-1.5 text-rose-700 bg-rose-50">M:{totalM}</span>
            </div>
            {nextTab ? (
              <button
                type="button"
                onClick={() => setActiveTab(nextTab.id)}
                className="btn-accent h-11 px-4 border-2 font-black text-xs uppercase font-mono flex items-center gap-1.5 shrink-0"
              >
                Siguiente <ChevronRight className="w-4 h-4 stroke-[3]" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleDownloadPDF()}
                disabled={isGeneratingPdf}
                className="btn-accent h-11 px-4 border-2 font-black text-xs uppercase font-mono flex items-center gap-1.5 shrink-0"
              >
                <FileDown className="w-4 h-4" aria-hidden /> {isGeneratingPdf ? 'Creando…' : 'PDF final'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
