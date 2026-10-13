import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import Field from "../components/Field.jsx";


export default function AuthPage() {
  const { user, loading, authenticate } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";
  const submitLabel = isRegister ? "Register" : "Log in";

  if (loading) {
    return <p role="status">Loading...</p>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const update = (name) => (event) => {
    setForm({ ...form, [name]: event.target.value });
  };

  function switchMode() {
    setMode(isRegister ? "login" : "register");
    setErrors({});
    setServerError("");
  }

  function validate() {
    const found = {};
    if (isRegister && !form.name.trim()) {
      found.name = "Name is required";
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      found.email = "Enter a valid email";
    }
    if (!form.password) {
      found.password = "Password is required";
    } else if (isRegister && form.password.length < 8) {
      found.password = "Password must be at least 8 characters";
    }
    return found;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const body = isRegister
        ? form
        : { email: form.email, password: form.password };
      await authenticate(mode, body);
    } catch (error) {
      if (error.details) {
        const fromServer = {};
        error.details.forEach((detail) => {
          fromServer[detail.field] = detail.message;
        });
        setErrors(fromServer);
      } else {
        setServerError(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth">
      <h1>{isRegister ? "Create account" : "Log in"}</h1>
      <form onSubmit={handleSubmit} noValidate>
        {isRegister && (
          <Field
            id="name"
            label="Name"
            value={form.name}
            onChange={update("name")}
            error={errors.name}
            autoComplete="name"
          />
        )}
        <Field
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={update("email")}
          error={errors.email}
          autoComplete="email"
        />
        <Field
          id="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={update("password")}
          error={errors.password}
          autoComplete={isRegister ? "new-password" : "current-password"}
        />
        {serverError && (
          <p role="alert" className="error">
            Error: {serverError}
          </p>
        )}
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? "Please wait..." : submitLabel}
        </button>
      </form>
      <p>
        {isRegister ? "Already have an account? " : "Need an account? "}
        <button type="button" onClick={switchMode}>
          {isRegister ? "Log in" : "Register"}
        </button>
      </p>
    </main>
  );
}