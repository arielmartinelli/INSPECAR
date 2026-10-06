/**
 * Diálogos de la app (reemplazan a alert / confirm del navegador).
 * Usa SweetAlert2, cargado recién la primera vez que se muestra un diálogo
 * para no sumar peso a la carga inicial.
 */
type Swal = typeof import('sweetalert2').default;
let swalPromise: Promise<Swal> | null = null;

const getSwal = () =>
  (swalPromise ??= Promise.all([import('sweetalert2'), import('sweetalert2/dist/sweetalert2.min.css')]).then(
    ([m]) => m.default
  ));

const base = {
  buttonsStyling: false,
  reverseButtons: true,
  focusCancel: false,
  customClass: {
    popup: 'insp-swal',
    confirmButton: 'insp-swal-btn insp-swal-ok',
    cancelButton: 'insp-swal-btn insp-swal-cancel',
    denyButton: 'insp-swal-btn insp-swal-cancel'
  }
} as const;

export type NotifyType = 'error' | 'warning' | 'info' | 'success';

/** Aviso con un solo botón ("Entendido"). */
export const notify = async (text: string, type: NotifyType = 'error', title?: string) => {
  const Swal = await getSwal();
  await Swal.fire({
    ...base,
    icon: type,
    title: title ?? (type === 'error' ? 'No se pudo completar' : type === 'success' ? 'Listo' : 'Atención'),
    text,
    confirmButtonText: 'Entendido'
  });
};

/** Confirmación: devuelve true si la persona confirma. `danger` pinta el botón en rojo (borrar). */
export const confirmAction = async (opts: {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}): Promise<boolean> => {
  const Swal = await getSwal();
  const r = await Swal.fire({
    ...base,
    icon: opts.danger ? 'warning' : 'question',
    title: opts.title,
    text: opts.text,
    showCancelButton: true,
    confirmButtonText: opts.confirmText ?? 'Confirmar',
    cancelButtonText: opts.cancelText ?? 'Cancelar',
    customClass: { ...base.customClass, confirmButton: `insp-swal-btn ${opts.danger ? 'insp-swal-danger' : 'insp-swal-ok'}` }
  });
  return r.isConfirmed;
};
