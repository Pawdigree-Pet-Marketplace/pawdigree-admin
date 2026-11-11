import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PasswordFlowShell, PasswordInputField, PasswordPairFields } from "../../components/auth/PasswordFlowShell";
import { ApiError } from "../../services/api";
import {
  changeAdminPassword,
  clearStoredAdminCredentials,
  confirmAdminPasswordReset,
  requestAdminPasswordReset,
  setAdminPassword,
} from "../../services/adminPasswordService";
import "../../components/auth/PasswordFlows.css";

const messageFor = (error: unknown, fallback: string) => error instanceof ApiError ? error.message : error instanceof Error ? error.message : fallback;

function PasswordForm({ onSubmit, submitLabel, loading, error, password, onPasswordChange, confirmation, onConfirmationChange, extraFields }: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  loading: boolean;
  error: string;
  password: string;
  onPasswordChange: (value: string) => void;
  confirmation: string;
  onConfirmationChange: (value: string) => void;
  extraFields?: ReactNode;
}) {
  return <form className="password-flow-form" onSubmit={onSubmit}>
    {extraFields}
    <PasswordPairFields password={password} onPasswordChange={onPasswordChange} confirmation={confirmation} onConfirmationChange={onConfirmationChange} />
    {error && <div className="login-error" role="alert">{error}</div>}
    <button className="admin-login-button" type="submit" disabled={loading}>{loading ? "Saving…" : submitLabel}</button>
  </form>;
}

export function SetAdminPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token")?.trim() || "";
  const navigate = useNavigate();
  const [password, setPasswordValue] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!token) { setError("This invitation link is missing its token. Ask your administrator to send a new invitation."); return; }
    if (password !== confirmation) { setError("The passwords do not match."); return; }
    setLoading(true);
    try {
      const result = await setAdminPassword(token, password);
      clearStoredAdminCredentials();
      navigate("/login", { replace: true, state: { message: result.detail || "Your password has been set. Sign in to continue." } });
    } catch (cause) {
      setError(messageFor(cause, "The invitation could not be accepted. It may have expired; ask your administrator for a new one."));
    } finally { setLoading(false); }
  }

  return <PasswordFlowShell title="Set your password" description="Choose a password to activate your Pawdigree administrator account.">
    {!token && <div className="login-error" role="alert">This invitation link is missing its token or has expired.</div>}
    {token && <PasswordForm onSubmit={submit} submitLabel="Set password" loading={loading} error={error} password={password} onPasswordChange={setPasswordValue} confirmation={confirmation} onConfirmationChange={setConfirmation} />}
    <div className="password-flow-links"><Link className="password-flow-link" to="/login">Back to admin sign in</Link></div>
  </PasswordFlowShell>;
}

export function ForgotAdminPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const result = await requestAdminPasswordReset(email);
      setNotice(result.detail || "If an administrator account exists for that email, password reset instructions will be sent.");
    } catch (cause) {
      setError(messageFor(cause, "We could not process the request. Please try again."));
    } finally { setLoading(false); }
  }

  return <PasswordFlowShell title="Forgot your password?" description="Enter your administrator email and we’ll send password reset instructions if an account matches.">
    <form className="password-flow-form" onSubmit={submit}>
      <div className="login-field"><label htmlFor="reset-email">Email address</label><input id="reset-email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
      {error && <div className="login-error" role="alert">{error}</div>}
      {notice && <div className="password-flow-notice" role="status">{notice}</div>}
      <button className="admin-login-button" type="submit" disabled={loading}>{loading ? "Sending…" : "Send reset instructions"}</button>
    </form>
    <div className="password-flow-links"><Link className="password-flow-link" to="/login">Back to admin sign in</Link></div>
  </PasswordFlowShell>;
}

export function ResetAdminPasswordPage() {
  const [params] = useSearchParams();
  const uid = params.get("uid")?.trim() || "";
  const token = params.get("token")?.trim() || "";
  const navigate = useNavigate();
  const [password, setPasswordValue] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!uid || !token) { setError("This password reset link is incomplete or expired. Request a new reset email."); return; }
    if (password !== confirmation) { setError("The passwords do not match."); return; }
    setLoading(true);
    try {
      const result = await confirmAdminPasswordReset(uid, token, password);
      clearStoredAdminCredentials();
      navigate("/login", { replace: true, state: { message: result.detail || "Your password has been reset. Sign in with your new password." } });
    } catch (cause) {
      setError(messageFor(cause, "This password reset link is invalid or expired. Request a new reset email."));
    } finally { setLoading(false); }
  }

  const hasToken = Boolean(uid && token);
  return <PasswordFlowShell title="Reset your password" description="Choose a new password for your administrator account.">
    {!hasToken && <div className="login-error" role="alert">This password reset link is incomplete or expired. Request a new reset email.</div>}
    {hasToken && <PasswordForm onSubmit={submit} submitLabel="Reset password" loading={loading} error={error} password={password} onPasswordChange={setPasswordValue} confirmation={confirmation} onConfirmationChange={setConfirmation} />}
    <div className="password-flow-links"><Link className="password-flow-link" to="/forgot-password">Request another reset link</Link></div>
  </PasswordFlowShell>;
}

export function ChangeAdminPasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPasswordValue] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) { setError("The new passwords do not match."); return; }
    if (password === currentPassword) { setError("Choose a new password that differs from your current password."); return; }
    setLoading(true);
    try {
      await changeAdminPassword(currentPassword, password);
      clearStoredAdminCredentials();
      navigate("/login", { replace: true, state: { message: "Your password has been changed. Sign in with your new password." } });
    } catch (cause) {
      setError(messageFor(cause, "Could not change your password. Check your current password and try again."));
    } finally { setLoading(false); }
  }

  return <main className="admin-management-page">
    <section className="admin-management-heading"><div><p className="admin-management-breadcrumb">Admin / Settings / Security</p><h1>Change password</h1><p className="admin-management-description">For your security, you’ll be signed out after changing your password.</p></div></section>
    <section className="admin-password-settings-card">
      <form className="password-flow-form" onSubmit={submit}>
        <PasswordInputField id="current-password" label="Current password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
        <PasswordPairFields password={password} onPasswordChange={setPasswordValue} confirmation={confirmation} onConfirmationChange={setConfirmation} />
        {error && <div className="login-error" role="alert">{error}</div>}
        <button className="admin-login-button" type="submit" disabled={loading}>{loading ? "Changing password…" : "Change password"}</button>
      </form>
    </section>
  </main>;
}
