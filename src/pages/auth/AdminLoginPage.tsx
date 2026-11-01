
import { useState } from "react";
import AdminLoginForm from "../../components/auth/AdminLoginForm";
import "./AdminLoginPage.css";

function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function handleLogin(email: string, password: string) {
    // Backend authentication will be connected here.
    // We are building the UI independently first.
    console.log("Login submitted:", { email, password });

    setError("");
    setIsLoading(true);

    // Temporary UI demonstration only.
    // Remove this when the real API integration is implemented.
    setTimeout(() => {
      setIsLoading(false);
      setError("Authentication is not connected yet.");
    }, 800);
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
