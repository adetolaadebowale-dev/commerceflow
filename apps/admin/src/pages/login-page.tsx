import { ApiClientError } from "@commerceflow/api-client";
import { loginSchema } from "@commerceflow/validation";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/auth-context";
import "../styles/auth.css";

interface LoginLocationState {
  readonly from?: {
    readonly pathname: string;
  };
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath =
    (location.state as LoginLocationState | null)?.from?.pathname ?? "/";

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectPath]);

  if (isLoading) {
    return (
      <div className="auth-status" role="status" aria-live="polite">
        Loading session...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;

      setFieldErrors({
        email: flattened.email?.[0],
        password: flattened.password?.[0],
      });

      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await login(parsed.data);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      if (error instanceof ApiClientError) {
        setFormError(error.message);
      } else {
        setFormError("Unable to sign in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">CommerceFlow Admin</h1>
        <p className="auth-subtitle">Sign in to manage the platform.</p>

        {formError ? (
          <p className="auth-alert" role="alert">
            {formError}
          </p>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="auth-input"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              aria-invalid={fieldErrors.email ? "true" : "false"}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
            />
            {fieldErrors.email ? (
              <p className="auth-error">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="auth-input"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              aria-invalid={fieldErrors.password ? "true" : "false"}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
            />
            {fieldErrors.password ? (
              <p className="auth-error">{fieldErrors.password}</p>
            ) : null}
          </div>

          <button className="auth-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
