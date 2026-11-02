import { useEffect, useId, useRef, useState } from "react";

const paths = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  car: (
    <>
      <path d="m5 7 2-4h10l2 4M3 10l2-3h14l2 3v8H3zM5 18v3m14-3v3M3 13h18" />
      <path d="M6 10h1m10 0h1" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H5v20h14V7zM14 2v6h6M8 12h8m-8 4h5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21v-3a7 7 0 0 1 14 0v3m1-17a4 4 0 0 1 0 8m2 3c2 1 3 3 3 6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
    </>
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  plus: <path d="M12 4v16M4 12h16" />,
  search: (
    <>
      <circle cx="10" cy="10" r="6" />
      <path d="m15 15 6 6" />
    </>
  ),
  logout: (
    <>
      <path d="M9 3H3v18h6m5-15 6 6-6 6M8 12h12" />
    </>
  ),
  close: <path d="m5 5 14 14M5 19 19 5" />,
  check: <path d="m4 12 5 5L20 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 2v6m10-6v6M3 11h18m-13 4h2m4 0h2" />
    </>
  ),
  shield: (
    <>
      <path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  edit: (
    <>
      <path d="m15 4 5 5M3 21l5-1L21 7l-5-5L3 15z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" />
    </>
  ),
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  wallet: (
    <>
      <path d="M21 8H3V4h16v4M3 8v12h18V8M21 12h-6v4h6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-10h.01" />
    </>
  ),
  building: (
    <>
      <path d="M4 22V3h16v19M2 22h20M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2M10 22v-3h4v3" />
    </>
  ),
};
export function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.file}
    </svg>
  );
}
export function Logo({ light = false }) {
  return (
    <span className={`logo ${light ? "logo-light" : ""}`}>
      <svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true">
        <rect width="40" height="40" rx="12" fill="currentColor" />
        <path
          d="M12 28V12h10c9 0 10 12 0 12h-3l8 8M12 20h10"
          fill="none"
          stroke={light ? "#17343e" : "#d2edcc"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        rota<span className="logo-dot">.</span>
      </span>
    </span>
  );
}
export const money = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value || 0),
  );
export const date = (value) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
        new Date(`${value.slice(0, 10)}T12:00:00Z`),
      )
    : "—";
export const roleLabel = (role) =>
  ({ CLIENT: "Cliente", COMPANY: "Empresa", BANK: "Banco" })[role] || role;
export const statuses = {
  PENDING: "Em análise",
  APPROVED: "Aprovado",
  REJECTED: "Reprovado",
  CONTRACTED: "Contratado",
  CANCELLED: "Cancelado",
};
export function Status({ value }) {
  return (
    <span className={`status status-${value?.toLowerCase()}`}>
      <span />
      {statuses[value] || value}
    </span>
  );
}
export function ErrorMessage({ error }) {
  return error ? (
    <div className="error-box" role="alert">
      <Icon name="info" size={18} />
      <div>
        {error.message || error}
        {error.fieldErrors && (
          <ul>
            {Object.entries(error.fieldErrors).map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  ) : null;
}
export function Field({ label, hint, className = "", children }) {
  const id = useId();
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {typeof children === "function" ? children(id) : children}
      {hint && <small>{hint}</small>}
    </div>
  );
}
export function TextField({ label, hint, className, ...props }) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => <input id={id} {...props} />}
    </Field>
  );
}
export function SelectField({ label, hint, className, children, ...props }) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => (
        <select id={id} {...props}>
          {children}
        </select>
      )}
    </Field>
  );
}
export function Modal({ title, description, onClose, children, wide = false }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal-wide" : ""}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="modal-inner">
        <div className="modal-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button
            className="icon-button"
            aria-label="Fechar janela"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function Empty({ icon = "file", title, text, children }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={28} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  );
}
export function SubmitButton({
  busy,
  children = "Salvar alterações",
  ...props
}) {
  return (
    <button
      type="submit"
      className="button button-primary"
      disabled={busy}
      {...props}
    >
      {busy ? "Aguarde…" : children}
      {!busy && <Icon name="arrow" size={17} />}
    </button>
  );
}
export function FormShell({
  onSubmit,
  children,
  submitLabel,
  onClose,
  danger = false,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function submit(event) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await onSubmit();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <div className="form-content">
        {children}
        <ErrorMessage error={error} />
      </div>
      <div className="form-footer">
        <button
          type="button"
          className="button button-secondary"
          onClick={onClose}
          disabled={busy}
        >
          Voltar
        </button>
        <SubmitButton
          busy={busy}
          className={`button ${danger ? "button-danger" : "button-primary"}`}
        >
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
export function CarArt({ tone = "#b4c5ba", large = false }) {
  return (
    <svg
      className={`car-art ${large ? "car-art-large" : ""}`}
      viewBox="0 0 420 185"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="213"
        cy="151"
        rx="174"
        ry="13"
        fill="#102c36"
        opacity=".08"
      />
      <path
        d="m43 110 36-10 49-49c9-8 19-11 32-11h83c14 0 23 3 34 12l53 46 40 12c12 4 17 11 17 24v6H30v-15c0-8 4-12 13-15Z"
        fill={tone}
      />
      <path
        d="m95 99 44-43h42v43H95Zm101 0V56h45c9 0 14 2 20 8l39 35H196Z"
        fill="#17343e"
      />
      <path
        d="m145 59-35 36h65V59h-30Zm57 0v36h83l-28-29c-5-5-11-7-18-7h-37Z"
        fill="#e4eff0"
        opacity=".6"
      />
      <path d="M31 124h355v14H30l1-14Z" fill="#17343e" opacity=".13" />
      <circle cx="106" cy="137" r="29" fill="#17343e" />
      <circle cx="106" cy="137" r="16" fill="#e1e7e3" />
      <circle cx="106" cy="137" r="8" fill="#a5b0ac" />
      <circle cx="315" cy="137" r="29" fill="#17343e" />
      <circle cx="315" cy="137" r="16" fill="#e1e7e3" />
      <circle cx="315" cy="137" r="8" fill="#a5b0ac" />
      <path
        d="M219 108h19M43 109h17l-6 10H32m335-8h-17l4 10h29"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M188 105v25m-54-31-10 7M308 99l13 7"
        stroke="#17343e"
        opacity=".25"
        strokeWidth="2"
      />
    </svg>
  );
}
