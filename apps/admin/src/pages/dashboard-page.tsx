import { useState } from "react";

import { useAuth } from "../auth/auth-context";
import "../styles/auth.css";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout(): Promise<void> {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <button
          className="logout-button"
          type="button"
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Signing out..." : "Sign out"}
        </button>
      </header>

      <section className="dashboard-card">
        <p>
          Signed in as{" "}
          <strong>
            {user?.user.firstName} {user?.user.lastName}
          </strong>
        </p>
        <p>Email: {user?.user.email}</p>
        <p>Role: {user?.user.role}</p>
      </section>
    </div>
  );
}
