export default function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  autoComplete,
  maxLength,
}) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>{" "}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && <p id={`${id}-error`}>Error: {error}</p>}
    </div>
  );
}