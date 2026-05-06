import { useMemo, useState } from "react";
import { loginUser, registerUser } from "../services/authApi";

const leftAuthIllustration =
  "/assets/auth-left-illustration.png";
const rightAuthIllustration =
  "/assets/auth-right-illustration.png";

const SIGNUP_PASSWORD_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";

const getSignupPasswordError = (password) => {
  if (typeof password !== "string" || password.length < 8) {
    return SIGNUP_PASSWORD_MESSAGE;
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return SIGNUP_PASSWORD_MESSAGE;
  }
  return null;
};

function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = useMemo(() => mode === "login", [mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setPasswordError("");
    if (!isLogin) {
      const pwdErr = getSignupPasswordError(password);
      if (pwdErr) {
        setPasswordError(pwdErr);
        return;
      }
    }
    setLoading(true);

    try {
      const payload = isLogin
        ? { username, password }
        : { name, username, email, password };
      const data = isLogin ? await loginUser(payload) : await registerUser(payload);
      onAuthenticated(data);
    } catch (err) {
      const msg = err.response?.data?.message || "Unable to authenticate.";
      if (!isLogin && msg === SIGNUP_PASSWORD_MESSAGE) {
        setPasswordError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-background" aria-hidden="true">
        <img
          className="auth-side-illustration auth-side-illustration-left"
          src={leftAuthIllustration}
          alt=""
        />
        <img
          className="auth-side-illustration auth-side-illustration-right"
          src={rightAuthIllustration}
          alt=""
        />
      </div>
      <section className="auth-card">
        <img className="brand-logo" src="/taskflow-logo.png" alt="TaskFlow logo" />
        <h1>TaskFlow</h1>
        <p>{isLogin ? "Welcome back! Sign in to continue." : "Create an account only"}</p>

        {error ? <p className="error-text">{error}</p> : null}

        <form onSubmit={handleSubmit}>
          {!isLogin ? (
            <>
              <div className="auth-field">
                <label htmlFor="auth-name">Full name</label>
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="auth-username-reg">Username</label>
                <input
                  id="auth-username-reg"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value.toLowerCase())}
                  required
                />
              </div>
            </>
          ) : null}

          {isLogin ? (
            <div className="auth-field">
              <label htmlFor="auth-username">Username</label>
              <input
                id="auth-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value.toLowerCase())}
                required
              />
            </div>
          ) : (
            <div className="auth-field">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <div className="auth-password-wrap">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (!isLogin) {
                    setPasswordError("");
                  }
                }}
                required
                aria-invalid={!isLogin && Boolean(passwordError)}
                aria-describedby={
                  !isLogin
                    ? `auth-password-hint${passwordError ? " auth-password-error" : ""}`
                    : undefined
                }
                className={!isLogin && passwordError ? "auth-input-invalid" : undefined}
                {...(!isLogin ? { minLength: 8 } : {})}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    className="auth-password-toggle-icon"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.7a3 3 0 0 1-4.24-4.24M1 1l22 22"
                    />
                  </svg>
                ) : (
                  <svg
                    className="auth-password-toggle-icon"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                    />
                    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>
            {!isLogin ? (
              <>
                <p id="auth-password-hint" className="auth-password-requirements">
                  At least 8 characters, with uppercase, lowercase, a number, and a symbol.
                </p>
                {passwordError ? (
                  <p id="auth-password-error" className="auth-password-error" role="alert">
                    {passwordError}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
          <button type="submit" className="auth-submit-btn">
            {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <button
          className="secondary-btn"
          type="button"
          onClick={() => {
            setMode(isLogin ? "register" : "login");
            setError("");
            setPasswordError("");
            setShowPassword(false);
          }}
        >
          {isLogin ? "Create an account" : "Already have an account. Login"}
        </button>
      </section>
    </main>
  );
}

export default AuthForm;
