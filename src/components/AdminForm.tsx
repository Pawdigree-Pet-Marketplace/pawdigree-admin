<<<<<<< Updated upstream
import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logos/lightmode-logo.svg";
=======
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createAdministrator } from "../services/adminManagementApi";
>>>>>>> Stashed changes
import "./AdminForm.css";

function AdminForm() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const role =
    localStorage.getItem("pawdigree_active_role") ||
    localStorage.getItem("role") ||
    "";

  if (role.toUpperCase() !== "SYSTEM_ADMIN") {
    return (
      <main className="admin-content">
        <section className="admin-card">
          <h2>Access restricted</h2>
          <p>Only a SYSTEM_ADMIN account can create administrators.</p>
        </section>
      </main>
    );
  }

  function generatePassword() {
    const generated =
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-4).toUpperCase() +
      "!";
    setPassword(generated);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!username.trim() || !firstName.trim() || !lastName.trim()) {
      setError("Please complete the username and name fields.");
      return;
    }

    setIsLoading(true);

    try {
      await createAdministrator({
        username: username.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      navigate("/admin/users", {
        replace: true,
        state: { message: "Administrator created successfully." },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create administrator. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }
  return (
<<<<<<< Updated upstream
    <div className="admin-layout">
      {/* Left sidebar */}
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand">
          <img src={logo} alt="Pawdigree logo" />
        </Link>
      </aside>

      {/* Main content */}
      <div className="admin-main">
        {/* Top navigation */}
        <header className="admin-header">
          <div className="admin-heading">
            <div className="admin-breadcrumb">
              Admin / Admin Management / AdminForm
=======
    <div className="admin-content">
      <section className="admin-card">
        <div className="admin-card-heading">
          <h2>Add Admin</h2>
          <p>
            Create an administrator account. The backend assigns the ADMIN
            role automatically.
          </p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-field">
            <label htmlFor="username">Username*</label>
            <input
              id="username"
              type="text"
              placeholder="e.g. chris.ouma"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>

          <div className="admin-field">
            <label htmlFor="firstName">First Name*</label>
            <input
              id="firstName"
              type="text"
              placeholder="e.g. Chris"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </div>

          <div className="admin-field">
            <label htmlFor="lastName">Last Name*</label>
            <input
              id="lastName"
              type="text"
              placeholder="e.g. Ouma"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </div>

          <div className="admin-field">
            <label htmlFor="email">Email*</label>
            <input
              id="email"
              type="email"
              placeholder="chris@pawdigree.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="admin-field">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              placeholder="e.g. +256..."
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="password">Temporary Password*</label>
            <div className="admin-password-wrapper">
              <input
                id="password"
                type="text"
                placeholder="Enter or generate a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
              <button
                type="button"
                className="generate-password"
                onClick={generatePassword}
                aria-label="Generate temporary password"
                title="Generate password"
              >
                ↻
              </button>
>>>>>>> Stashed changes
            </div>
            <h1>Add Admin</h1>
          </div>

<<<<<<< Updated upstream
          <div className="admin-header-actions">
            <label className="admin-search">
              <span aria-hidden="true">⌕</span>
              <input type="search" placeholder="Search..." />
            </label>

            <span className="admin-badge">Super Admin</span>
=======
          <div className="admin-form-actions">
            <button
              type="submit"
              className="admin-btn admin-btn-save"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Admin"}
            </button>

            <button
              type="button"
              className="admin-btn admin-btn-cancel"
              onClick={() => navigate("/admin/users")}
              disabled={isLoading}
            >
              Cancel
            </button>
>>>>>>> Stashed changes
          </div>
        </header>

<<<<<<< Updated upstream
        {/* Page body */}
        <main className="admin-content">
          <section className="admin-card">
            <div className="admin-card-heading">
              <h2>Add Admin</h2>
              <p>
                Only Super Admins can create or edit admin accounts.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-field">
                <label htmlFor="fullName">Full Name*</label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Chris Ouma"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="email">Email*</label>
                <input
                  id="email"
                  type="email"
                  placeholder="chris@pawdigree.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Support Admin">Support Admin</option>
                </select>
              </div>

              <div className="admin-field">
                <label htmlFor="password">Temporary Password</label>
                <div className="admin-password-wrapper">
                  <input
                    id="password"
                    type="text"
                    placeholder="Auto-generated — editable"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="generate-password"
                    onClick={generatePassword}
                    aria-label="Generate temporary password"
                    title="Generate password"
                  >
                    ↻
                  </button>
                </div>
              </div>

              <label className="admin-invite">
                <input
                  type="checkbox"
                  checked={sendInvite}
                  onChange={(event) => setSendInvite(event.target.checked)}
                />
                <span>Send invite email</span>
              </label>

              <div className="admin-form-actions">
                <button type="submit" className="admin-btn admin-btn-save">
                  Edit Admin
                </button>

                <Link to="/" className="admin-btn admin-btn-cancel">
                  Cancel
                </Link>
              </div>
            </form>
          </section>

          <footer className="admin-footer">
            © Admin v1.2 | Last sync: 2m ago
          </footer>
        </main>
      </div>
=======
      <footer className="admin-footer">© Pawdigree Admin</footer>
>>>>>>> Stashed changes
    </div>
  );
}

export default AdminForm;