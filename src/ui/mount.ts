/**
 * Renders a calculator: its inputs as a form and its results as a list, and
 * recomputes on every change. The inputs are kept in the URL hash, so a link
 * reopens the calculator with the same numbers.
 */

interface FieldBase {
  id: string;
  label: string;
  hint?: string;
}
export interface NumberField extends FieldBase {
  kind: "number";
  value: number;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
}
export interface SelectField extends FieldBase {
  kind: "select";
  value: string;
  options: [value: string, label: string][];
}
export interface ToggleField extends FieldBase {
  kind: "toggle";
  value: boolean;
}
export type Field = NumberField | SelectField | ToggleField;
export type Values = Record<string, number | string | boolean>;

export interface Output {
  label: string;
  value: string;
  note?: string;
  tone?: "good" | "bad";
  primary?: boolean;
}

export interface Calculator {
  fields: Field[];
  compute: (values: Values) => Output[];
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function numberInput(f: NumberField): HTMLElement {
  const input = el("input", {
    type: "number",
    name: f.id,
    value: String(f.value),
    step: String(f.step ?? "any"),
    inputMode: "decimal",
  });
  if (f.min !== undefined) input.min = String(f.min);
  if (f.max !== undefined) input.max = String(f.max);
  const parts = [f.prefix ? el("span", { className: "affix" }, [f.prefix]) : "", input];
  if (f.suffix) parts.push(el("span", { className: "affix" }, [f.suffix]));
  return el("div", { className: "input-wrap" }, parts.filter(Boolean) as Node[]);
}

function selectInput(f: SelectField): HTMLElement {
  const options = f.options.map(([value, label]) =>
    el("option", { value, selected: value === f.value }, [label]),
  );
  return el("select", { name: f.id }, options);
}

function control(f: Field): HTMLElement {
  if (f.kind === "toggle") {
    const box = el("input", { type: "checkbox", name: f.id, checked: f.value });
    return el("label", { className: "toggle" }, [box, el("span", {}, [f.label])]);
  }
  const input = f.kind === "number" ? numberInput(f) : selectInput(f);
  return el("label", { className: "field" }, [el("span", { className: "label" }, [f.label]), input]);
}

function fieldBlock(f: Field): HTMLElement {
  const hint = f.hint ? el("small", { className: "hint" }, [f.hint]) : "";
  return el("div", { className: "field-block" }, [control(f), hint].filter(Boolean) as Node[]);
}

function readValues(form: HTMLFormElement, fields: Field[]): Values {
  const values: Values = {};
  for (const f of fields) {
    const input = form.elements.namedItem(f.id) as HTMLInputElement | HTMLSelectElement;
    if (f.kind === "toggle") values[f.id] = (input as HTMLInputElement).checked;
    else if (f.kind === "number") values[f.id] = Number(input.value) || 0;
    else values[f.id] = input.value;
  }
  return values;
}

function renderOutputs(list: HTMLElement, outputs: Output[]) {
  list.replaceChildren(
    ...outputs.map((o) => {
      const cls = ["result", o.primary ? "primary" : "", o.tone ?? ""].filter(Boolean).join(" ");
      const note = o.note ? el("small", {}, [o.note]) : "";
      return el("div", { className: cls }, [
        el("span", { className: "result-label" }, [o.label]),
        el("strong", {}, [o.value]),
        note,
      ].filter(Boolean) as Node[]);
    }),
  );
}

/** Field values from the URL hash, over the defaults. */
function fromHash(fields: Field[]): Field[] {
  const params = new URLSearchParams(window.location.hash.slice(1));
  return fields.map((f) => {
    const raw = params.get(f.id);
    if (raw === null) return f;
    if (f.kind === "number") return { ...f, value: Number(raw) || 0 };
    if (f.kind === "toggle") return { ...f, value: raw === "1" };
    return { ...f, value: raw };
  });
}

function toHash(values: Values) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(values)) params.set(k, v === true ? "1" : v === false ? "0" : String(v));
  history.replaceState(null, "", `#${params}`);
}

export function mount(root: HTMLElement, calc: Calculator) {
  const fields = fromHash(calc.fields);
  const form = el("form", { className: "calc-form" }, fields.map(fieldBlock));
  const results = el("div", { className: "calc-results", ariaLive: "polite" });
  const update = (saveHash: boolean) => {
    const values = readValues(form, fields);
    renderOutputs(results, calc.compute(values));
    if (saveHash) toHash(values);
  };
  form.addEventListener("input", () => update(true));
  form.addEventListener("submit", (e) => e.preventDefault());
  root.replaceChildren(form, results);
  update(false);
}
