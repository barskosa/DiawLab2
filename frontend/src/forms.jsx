import { useRef, useState } from "react";
import {
  CarArt,
  Field,
  FormShell,
  Icon,
  SelectField,
  TextField,
  money,
  roleLabel,
} from "./components.jsx";

export const blankClient = {
  name: "",
  rg: "",
  cpf: "",
  address: "",
  profession: "",
  employments: [],
};
export const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const change = (setter, value, key) => (event) =>
  setter({ ...value, [key]: event.target.value });
const clientPayload = (value) => ({
  name: value.name,
  rg: value.rg,
  cpf: value.cpf.replace(/\D/g, ""),
  address: value.address,
  profession: value.profession,
  employments: value.employments.map((item) => ({
    ...item,
    income: Number(item.income),
  })),
});

export function ClientFields({ value, onChange }) {
  const addEmployment = useRef(null);
  function employment(index, key, data) {
    onChange({
      ...value,
      employments: value.employments.map((entry, i) =>
        i === index ? { ...entry, [key]: data } : entry,
      ),
    });
  }
  return (
    <>
      <div className="form-grid">
        <TextField
          label="Nome completo"
          autoComplete="name"
          required
          maxLength={120}
          className="span-2"
          value={value.name}
          onChange={change(onChange, value, "name")}
        />
        <TextField
          label="CPF"
          required
          inputMode="numeric"
          autoComplete="off"
          maxLength={14}
          placeholder="000.000.000-00"
          value={value.cpf}
          onChange={change(onChange, value, "cpf")}
        />
        <TextField
          label="RG"
          required
          maxLength={30}
          value={value.rg}
          onChange={change(onChange, value, "rg")}
        />
        <TextField
          label="Endereço completo"
          required
          autoComplete="street-address"
          maxLength={250}
          className="span-2"
          value={value.address}
          onChange={change(onChange, value, "address")}
        />
        <TextField
          label="Profissão"
          required
          maxLength={120}
          className="span-2"
          value={value.profession}
          onChange={change(onChange, value, "profession")}
        />
      </div>
      <div className="section-title">
        <div>
          <h3>Vínculos e rendimentos</h3>
          <p>Informe até três fontes de renda, se houver.</p>
        </div>
        <button
          ref={addEmployment}
          type="button"
          className="button button-text button-small"
          disabled={value.employments.length >= 3}
          onClick={() =>
            onChange({
              ...value,
              employments: [...value.employments, { employer: "", income: "" }],
            })
          }
        >
          <Icon name="plus" size={16} />
          Adicionar
        </button>
      </div>
      {value.employments.length === 0 && (
        <p className="muted small">Nenhum vínculo informado.</p>
      )}
      {value.employments.map((item, index) => (
        <div className="employment-row" key={index}>
          <TextField
            label={`Empregador ${index + 1}`}
            required
            maxLength={120}
            value={item.employer}
            onChange={(event) =>
              employment(index, "employer", event.target.value)
            }
          />
          <TextField
            label="Renda mensal (R$)"
            required
            type="number"
            min="0.01"
            step="0.01"
            value={item.income}
            onChange={(event) =>
              employment(index, "income", event.target.value)
            }
          />
          <button
            type="button"
            className="icon-button danger-text"
            aria-label={`Remover vínculo ${index + 1}`}
            onClick={() => {
              onChange({
                ...value,
                employments: value.employments.filter((_, i) => i !== index),
              });
              requestAnimationFrame(() => addEmployment.current?.focus());
            }}
          >
            <Icon name="trash" size={18} />
          </button>
        </div>
      ))}
    </>
  );
}
export function ProfileForm({ profile, onSubmit, onClose }) {
  const [value, setValue] = useState({
    ...blankClient,
    ...profile,
    employments: profile.employments || [],
  });
  return (
    <FormShell
      onSubmit={() => onSubmit(clientPayload(value))}
      onClose={onClose}
      submitLabel="Salvar cadastro"
    >
      <ClientFields value={value} onChange={setValue} />
    </FormShell>
  );
}
export function VehicleForm({ vehicle, onSubmit, onClose }) {
  const [value, setValue] = useState(
    vehicle || {
      registration: "",
      year: new Date().getFullYear(),
      brand: "",
      model: "",
      plate: "",
      dailyRate: "",
      category: "Econômico",
    },
  );
  return (
    <FormShell
      onSubmit={() =>
        onSubmit({
          registration: value.registration.trim(),
          year: Number(value.year),
          brand: value.brand.trim(),
          model: value.model.trim(),
          plate: value.plate.replace(/[^a-z0-9]/gi, "").toUpperCase(),
          dailyRate: Number(value.dailyRate),
          category: value.category,
        })
      }
      onClose={onClose}
      submitLabel={vehicle ? "Salvar automóvel" : "Cadastrar automóvel"}
    >
      <div className="form-grid">
        <TextField
          label="Marca"
          placeholder="Ex.: Volkswagen"
          maxLength={80}
          required
          value={value.brand}
          onChange={change(setValue, value, "brand")}
        />
        <TextField
          label="Modelo"
          placeholder="Ex.: Polo"
          maxLength={80}
          required
          value={value.model}
          onChange={change(setValue, value, "model")}
        />
        <TextField
          label="Matrícula / registro"
          placeholder="Identificação do veículo"
          maxLength={40}
          required
          value={value.registration}
          onChange={change(setValue, value, "registration")}
        />
        <TextField
          label="Placa"
          placeholder="ABC1D23"
          maxLength={8}
          required
          value={value.plate}
          onChange={change(setValue, value, "plate")}
        />
        <TextField
          label="Ano"
          required
          type="number"
          min="1900"
          max={new Date().getFullYear() + 1}
          value={value.year}
          onChange={change(setValue, value, "year")}
        />
        <SelectField
          label="Categoria"
          value={value.category}
          onChange={change(setValue, value, "category")}
        >
          <option>Econômico</option>
          <option>Hatch</option>
          <option>Sedan</option>
          <option>SUV</option>
          <option>Picape</option>
          <option>Executivo</option>
          <option>Utilitário</option>
        </SelectField>
        <TextField
          label="Valor da diária (R$)"
          required
          type="number"
          min="0.01"
          max="999999.99"
          step="0.01"
          value={value.dailyRate}
          onChange={change(setValue, value, "dailyRate")}
          className="span-2"
        />
      </div>
      <p className="info-note">
        <Icon name="info" size={18} />O automóvel será registrado em nome do
        agente responsável. A propriedade pode ser definida na contratação.
      </p>
    </FormShell>
  );
}
export function OrderForm({ order, vehicleId, vehicles, onSubmit, onClose }) {
  const [value, setValue] = useState({
    vehicleId:
      order?.vehicleId ||
      order?.vehicle?.id ||
      vehicleId ||
      vehicles[0]?.id ||
      "",
    startDate: order?.startDate || today(),
    endDate: order?.endDate || today(),
    notes: order?.notes || "",
  });
  const vehicle = vehicles.find((item) => item.id === value.vehicleId);
  const days =
    value.startDate && value.endDate
      ? Math.max(
          1,
          Math.round(
            (Date.parse(value.endDate) - Date.parse(value.startDate)) /
              86400000,
          ),
        )
      : 1;
  return (
    <FormShell
      onSubmit={() => onSubmit(value)}
      onClose={onClose}
      submitLabel={order ? "Salvar pedido" : "Enviar pedido"}
    >
      <SelectField
        label="Automóvel"
        required
        value={value.vehicleId}
        onChange={change(setValue, value, "vehicleId")}
      >
        <option value="" disabled>
          Selecione um automóvel
        </option>
        {vehicles.map((item) => (
          <option key={item.id} value={item.id}>
            {item.brand} {item.model} · {item.plate} · {money(item.dailyRate)}
            /dia
          </option>
        ))}
      </SelectField>
      {vehicle && (
        <div className="selected-car">
          <CarArt />
          <div>
            <strong>
              {vehicle.brand} {vehicle.model}
            </strong>
            <span>
              {vehicle.year} · {vehicle.category}
            </span>
          </div>
          <b>
            {money(vehicle.dailyRate)}
            <small>/dia</small>
          </b>
        </div>
      )}
      <div className="form-grid">
        <TextField
          label="Retirada"
          required
          type="date"
          min={today()}
          value={value.startDate}
          onChange={(event) => {
            const startDate = event.target.value;
            setValue({
              ...value,
              startDate,
              endDate: value.endDate < startDate ? startDate : value.endDate,
            });
          }}
        />
        <TextField
          label="Devolução"
          required
          type="date"
          min={value.startDate || today()}
          value={value.endDate}
          onChange={change(setValue, value, "endDate")}
        />
      </div>
      <Field
        label="Observações"
        hint="Opcional. Conte ao agente o que ele precisa saber."
      >
        {(id) => (
          <textarea
            id={id}
            rows={3}
            maxLength={2000}
            value={value.notes}
            onChange={change(setValue, value, "notes")}
            placeholder="Informações adicionais sobre o aluguel"
          />
        )}
      </Field>
      <div className="cost-summary">
        <span>
          Estimativa · {days} {days === 1 ? "diária" : "diárias"}
        </span>
        <strong>{money(days * Number(vehicle?.dailyRate || 0))}</strong>
      </div>
      <p className="muted small">
        A retirada e devolução no mesmo dia correspondem a uma diária. O valor é
        confirmado pelo servidor. O pedido será encaminhado para análise
        financeira.{order && " A alteração exige uma nova análise."}
      </p>
    </FormShell>
  );
}
export function ReviewForm({ order, onSubmit, onClose }) {
  const [approved, setApproved] = useState("true");
  const [reviewNotes, setNotes] = useState("");
  return (
    <FormShell
      onSubmit={() => onSubmit({ approved: approved === "true", reviewNotes })}
      onClose={onClose}
      submitLabel="Confirmar parecer"
    >
      <div className="review-summary">
        <span>{order.clientName}</span>
        <strong>{money(order.totalAmount)}</strong>
      </div>
      <SelectField
        label="Parecer financeiro"
        value={approved}
        onChange={(event) => setApproved(event.target.value)}
      >
        <option value="true">Aprovar pedido</option>
        <option value="false">Reprovar pedido</option>
      </SelectField>
      <Field
        label="Justificativa"
        hint="O cliente poderá consultar este parecer."
      >
        {(id) => (
          <textarea
            id={id}
            required
            rows={4}
            minLength={3}
            maxLength={2000}
            value={reviewNotes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Descreva o resultado da análise financeira"
          />
        )}
      </Field>
      <p className="info-note">
        <Icon name="shield" size={18} />A aprovação permite que um agente
        execute o contrato. A contratação é uma etapa separada.
      </p>
    </FormShell>
  );
}
export function ContractForm({ order, user, onSubmit, onClose }) {
  const [ownerType, setOwnerType] = useState("CLIENT");
  const [financed, setFinanced] = useState(false);
  const [credit, setCredit] = useState({
    amount: Number(order.totalAmount),
    interestRate: 0,
    installments: 1,
  });
  return (
    <FormShell
      onSubmit={() =>
        onSubmit({
          ownerType,
          ...(financed
            ? {
                credit: {
                  bankId: user.id,
                  amount: Number(credit.amount),
                  interestRate: Number(credit.interestRate),
                  installments: Number(credit.installments),
                },
              }
            : {}),
        })
      }
      onClose={onClose}
      submitLabel="Executar contrato"
    >
      <div className="review-summary">
        <span>Valor do aluguel</span>
        <strong>{money(order.totalAmount)}</strong>
      </div>
      <SelectField
        label="Registrar automóvel em nome de"
        value={ownerType}
        onChange={(event) => setOwnerType(event.target.value)}
      >
        <option value="CLIENT">Cliente · {order.clientName}</option>
        <option value={user.role}>
          {roleLabel(user.role)} · {user.name}
        </option>
      </SelectField>
      <p className="muted small">
        A propriedade do automóvel seguirá o tipo de contrato selecionado.
      </p>
      {user.role === "BANK" && (
        <>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={financed}
              onChange={(event) => setFinanced(event.target.checked)}
            />
            <span>
              <strong>Associar um contrato de crédito</strong>
              <small>Crédito concedido por {user.name}</small>
            </span>
          </label>
          {financed && (
            <div className="credit-fields">
              <TextField
                label="Valor financiado (R$)"
                type="number"
                required
                min="0.01"
                max={order.totalAmount}
                step="0.01"
                value={credit.amount}
                onChange={change(setCredit, credit, "amount")}
              />
              <div className="form-grid">
                <TextField
                  label="Taxa de juros (%)"
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={credit.interestRate}
                  onChange={change(setCredit, credit, "interestRate")}
                />
                <TextField
                  label="Quantidade de parcelas"
                  type="number"
                  required
                  min="1"
                  max="360"
                  value={credit.installments}
                  onChange={change(setCredit, credit, "installments")}
                />
              </div>
            </div>
          )}
        </>
      )}
      <p className="info-note">
        <Icon name="info" size={18} />
        Ao confirmar, o pedido será contratado e o período será reservado. A
        disponibilidade será verificada novamente.
      </p>
    </FormShell>
  );
}
