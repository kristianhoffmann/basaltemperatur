"use client";

import { useState } from "react";
import Link from "next/link";
import { WITHDRAWAL_LIMITS, type WithdrawalField } from "@/lib/withdrawal";

type FieldErrors = Partial<Record<WithdrawalField, string>>;

const EMPTY = { name: "", email: "", contractReference: "", contractDate: "", message: "" };

export function WithdrawalForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<{ summary: string; acknowledgementSent: boolean } | null>(null);

  function update(field: keyof typeof EMPTY, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setFormError(null);
    setErrors({});
    try {
      const response = await fetch("/api/widerruf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (response.ok) {
        setReceipt({ summary: data.summary, acknowledgementSent: Boolean(data.acknowledgementSent) });
        return;
      }
      if (response.status === 422 && data.errors) {
        setErrors(data.errors as FieldErrors);
        setFormError("Bitte prüfe die markierten Felder.");
        return;
      }
      setFormError(data.error ?? "Das hat leider nicht geklappt. Bitte versuche es erneut.");
    } catch {
      setFormError(
        "Wir konnten deinen Widerruf gerade nicht entgegennehmen. Bitte sende ihn per E-Mail an moin@kristianhoffmann.de — dein Widerrufsrecht bleibt davon unberührt.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (receipt) {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6">
        <h2 className="text-xl font-bold text-emerald-900">Dein Widerruf ist eingegangen</h2>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900">
          Wir haben deine Erklärung mit dem folgenden Inhalt aufgenommen. Der Widerruf gilt mit dem
          Absenden als fristwahrend erklärt.
        </p>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl border border-emerald-200 bg-white p-4 text-sm leading-relaxed text-slate-800">
          {receipt.summary}
        </pre>
        <p className="mt-4 text-sm text-emerald-900">
          {receipt.acknowledgementSent
            ? "Eine Eingangsbestätigung mit diesem Inhalt ist zusätzlich per E-Mail an dich unterwegs. Bewahre sie als Nachweis auf."
            : "Die Bestätigungsmail konnte gerade nicht zugestellt werden. Bitte sichere dir diesen Text — dein Widerruf ist trotzdem wirksam bei uns eingegangen."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Field
        id="name"
        label="Vor- und Nachname"
        required
        value={values.name}
        error={errors.name}
        maxLength={WITHDRAWAL_LIMITS.name}
        autoComplete="name"
        onChange={(value) => update("name", value)}
      />
      <Field
        id="email"
        label="E-Mail-Adresse"
        type="email"
        required
        value={values.email}
        error={errors.email}
        maxLength={WITHDRAWAL_LIMITS.email}
        autoComplete="email"
        hint="An diese Adresse schicken wir die Eingangsbestätigung."
        onChange={(value) => update("email", value)}
      />
      <Field
        id="contractReference"
        label="Welchen Vertrag möchtest du widerrufen?"
        required
        value={values.contractReference}
        error={errors.contractReference}
        maxLength={WITHDRAWAL_LIMITS.contractReference}
        hint="Bestellnummer, oder einfach die beim Kauf verwendete E-Mail-Adresse bzw. eine kurze Beschreibung."
        onChange={(value) => update("contractReference", value)}
      />
      <Field
        id="contractDate"
        label="Datum des Vertragsabschlusses (optional)"
        type="date"
        value={values.contractDate}
        error={errors.contractDate}
        onChange={(value) => update("contractDate", value)}
      />

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-slate-900">
          Mitteilung (optional)
        </label>
        <textarea
          id="message"
          rows={4}
          maxLength={WITHDRAWAL_LIMITS.message}
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500"
        />
        {errors.message && <p className="mt-1 text-sm text-red-700">{errors.message}</p>}
        <p className="mt-1 text-xs text-slate-500">
          Eine Begründung ist nicht erforderlich — ein Widerruf ist ohne Angabe von Gründen wirksam.
        </p>
      </div>

      {formError && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full cursor-pointer rounded-xl bg-sky-600 py-3 text-center text-sm font-bold uppercase tracking-wider text-white transition-transform hover:bg-sky-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Einen Moment …" : "Widerruf bestätigen"}
      </button>

      <p className="text-xs leading-relaxed text-slate-500">
        Du kannst den Widerruf auch formlos per E-Mail an{" "}
        <a href="mailto:moin@kristianhoffmann.de" className="underline">moin@kristianhoffmann.de</a> oder
        per Post erklären. Die vollständige{" "}
        <Link href="/widerruf" className="underline">Widerrufsbelehrung</Link> erklärt Fristen und Folgen.
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  required = false,
  maxLength,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-900">
        {label}
        {required && <span className="text-sky-700"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        maxLength={maxLength}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500"
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}
