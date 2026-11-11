import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import lightLogo from "../../assets/logos/lightmode-logo.svg";
import "./PasswordFlows.css";

export function PasswordFlowShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <main className="admin-login-page password-flow-page">
    <section className="admin-login-card password-flow-card">
      <Link className="password-flow-brand" to="/login" aria-label="Pawdigree admin login"><img src={lightLogo} alt="Pawdigree" /><span>ADMIN PORTAL</span></Link>
      <div className="admin-login-intro"><h1>{title}</h1><p>{description}</p></div>
      {children}
      <p className="admin-login-footer">© {new Date().getFullYear()} Pawdigree. All rights reserved.</p>
    </section>
  </main>;
}

export function PasswordInputField({ id, label, value, onChange, autoComplete = "new-password", minLength }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  return <div className="login-field">
    <label htmlFor={id}>{label}</label>
    <div className="login-password-wrapper">
      <input id={id} type={visible ? "text" : "password"} autoComplete={autoComplete} minLength={minLength} required value={value} onChange={(event) => onChange(event.target.value)} />
      <button type="button" className="password-toggle" onClick={() => setVisible((shown) => !shown)} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} title={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}>
        {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
  </div>;
}

export function PasswordPairFields({ password, onPasswordChange, confirmation, onConfirmationChange }: {
  password: string;
  onPasswordChange: (value: string) => void;
  confirmation: string;
  onConfirmationChange: (value: string) => void;
}) {
  return <>
    <PasswordInputField id="new-password" label="New password" value={password} onChange={onPasswordChange} minLength={8} />
    <PasswordInputField id="confirm-password" label="Confirm new password" value={confirmation} onChange={onConfirmationChange} minLength={8} />
  </>;
}
