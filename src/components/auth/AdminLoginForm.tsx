
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./AdminLoginForm.css";

interface AdminLoginFormProps {
  onSubmit: (email: string, password: string) => void;
  isLoading?: boolean;
  error?: string;
}

function AdminLoginForm({
  onSubmit,
  isLoading = false,
  error = "",
}: AdminLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // The backend is responsible for authenticating the password.
    onSubmit(email.trim(), password);
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <div className="login-form-heading">
        <h2>Welcome Back!</h2>
        <p>Sign in to access your Pawdigree admin dashboard.</p>
      </div>

      {error && (
        <div className="login-error" role="alert">
          {error}
        </div>
      )}

      <div className="login-field">
        <label htmlFor="admin-email">Email Address</label>
        <input
          id="admin-email"
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          maxLength={254}
          pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
          title="Please enter a valid email address."
          required
        />
      </div>

      <div className="login-field">
        <label htmlFor="admin-password">Password</label>

        <div className="login-password-wrapper">
          <input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((previous) => !previous)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff size={20} aria-hidden="true" />
            ) : (
              <Eye size={20} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="admin-login-button"
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}

export default AdminLoginForm;
