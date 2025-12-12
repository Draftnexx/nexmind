import { useState } from "react";
import { signInWithMagicLink, signOut } from "../services/authService";
import { User } from "@supabase/supabase-js";

interface AuthGateProps {
  user: User | null;
}

export default function AuthGate({ user }: AuthGateProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setMessage("Bitte E-Mail eingeben");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await signInWithMagicLink(email);

    if (error) {
      setMessage(`Fehler: ${error.message}`);
    } else {
      setMessage("Magic Link wurde gesendet! Bitte prüfe deine E-Mails.");
      setEmail("");
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    setLoading(false);
  };

  // If user is logged in, show logged-in state
  if (user) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-dark-surface rounded-2xl border border-border-dark p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-text-primary mb-2">
              Eingeloggt
            </h2>
            <p className="text-text-secondary">
              {user.email}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full px-6 py-3 bg-dark-elevated border border-border-dark rounded-xl text-text-primary hover:bg-dark-bg transition-colors disabled:opacity-50"
          >
            {loading ? "Wird ausgeloggt..." : "Logout"}
          </button>
        </div>
      </div>
    );
  }

  // If user is not logged in, show login form
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-dark-surface rounded-2xl border border-border-dark p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <img src="/logo.svg" alt="NexMind" className="w-12 h-12" />
            <h1 className="text-3xl font-display font-bold text-text-primary">
              NexMind
            </h1>
          </div>
          <p className="text-text-secondary">
            Melde dich mit deiner E-Mail an
          </p>
        </div>

        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
              E-Mail Adresse
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              className="w-full px-4 py-3 rounded-xl bg-dark-elevated border border-border-dark text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Wird gesendet..." : "Magic Link senden"}
          </button>

          {message && (
            <div className={`p-4 rounded-xl text-sm ${
              message.includes("Fehler")
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-accent/10 text-accent border border-accent/20"
            }`}>
              {message}
            </div>
          )}
        </form>

        <div className="mt-6 text-center text-xs text-text-muted">
          Du erhältst einen Login-Link per E-Mail
        </div>
      </div>
    </div>
  );
}
