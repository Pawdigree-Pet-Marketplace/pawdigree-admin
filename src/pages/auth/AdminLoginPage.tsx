
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLoginForm from "../../components/auth/AdminLoginForm";
import { adminLogin } from "../../services/adminAuthService";
import "./AdminLoginPage.css";

function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin(email: string, password: string) {
    setError("");
    setIsLoading(true);

    try {
      const tokens = await adminLogin(email, password);

      // Save tokens for authenticated API requests.
      localStorage.setItem("access", tokens.access);
      localStorage.setItem("refresh", tokens.refresh);

      // Open the admin dashboard after successful authentication.
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-brand">
          <img
            src="/src/assets/logos/lightmode-logo.svg"
            alt="Pawdigree"
          />
          <span>ADMIN PORTAL</span>
        </div>

        <div className="admin-login-intro">
          <h1>Manage with confidence.</h1>
          <p>
            Your central workspace for keeping the Pawdigree
            community safe, trusted and connected.
          </p>
        </div>

        <AdminLoginForm
          onSubmit={handleLogin}
          isLoading={isLoading}
          error={error}
        />

        <p className="admin-login-footer">
          © {new Date().getFullYear()} Pawdigree. All rights reserved.
        </p>
      </section>
    </main>
  );
}

export default AdminLoginPage;
