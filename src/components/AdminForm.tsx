import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createAdministrator } from "../services/adminManagementApi";
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

     navigate("/adminManagement", {
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
    <div className="admin-content">
      <section className="admin-card">
        <div className="admin-card-heading">
          <h2>Add Admin</h2>
          <p>
            Create an administrator account. 
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
            </div>
          </div>

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
              onClick={() => navigate("/adminManagement")}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>

      <footer className="admin-footer">© Pawdigree Admin</footer>
    </div>
  );
}

export default AdminForm;