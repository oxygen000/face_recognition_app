import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiUser, FiLock, FiLogIn } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/common";
import toast from "react-hot-toast";

const Login: React.FC = () => {
  const { t } = useTranslation("login");
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [rememberMe, setRememberMe] = useState(false);

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error(t("error.allFields", "Please fill in all fields"));
      return;
    }
    await login(username, password);

    if (rememberMe) {
      localStorage.setItem("rememberedUsername", username);
    } else {
      localStorage.removeItem("rememberedUsername");
    }
  };

  useEffect(() => {
    const rememberedUsername = localStorage.getItem("rememberedUsername");
    if (rememberedUsername) {
      setUsername(rememberedUsername);
      setRememberMe(true);
    }
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br px-4 bg-cover bg-no-repeat"
      style={{ backgroundImage: "url('/back1.gif')" }}
    >
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl p-10 rounded-2xl shadow-2xl border border-white/20">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white drop-shadow-sm">
            {t("title", "Sign in")}
          </h1>
          <p className="text-sm text-gray-300 mt-1">
            {t("description", "Access the AI recognition system")}
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-300"
            >
              {t("form.email", "Email")}
            </label>
            <div className="relative mt-1">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 w-full border border-white/30 rounded-lg py-2 px-3 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  t("form.emailPlaceholder", "Enter your email") as string
                }
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              {t("form.password", "Password")}
            </label>
            <div className="relative mt-1">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full border border-white/30 rounded-lg py-2 px-3 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  t("form.passwordPlaceholder", "Enter your password") as string
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-300">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300 rounded"
              />
              <span className="ml-2">{t("form.remember", "Remember me")}</span>
            </label>
            <a
              href="#"
              className="text-blue-400 hover:text-blue-300 transition"
            >
              {t("form.forgot", "Forgot password?")}
            </a>
          </div>

          <Button
            type="submit"
            className="w-full flex justify-center items-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-lg"
            disabled={isLoading}
          >
            <FiLogIn />
            {isLoading
              ? t("processing", "Signing in...")
              : t("form.submit", "Sign in")}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-300 bg-white/10 p-3 rounded-lg border border-white/20">
          <p>
            {t("demo.title", "Demo credentials:")}
            <span className="font-semibold text-white"> admin / admin123 </span>
            {t("or", "or")}
            <span className="font-semibold text-white"> user / password</span>
          </p>
          <p className="mt-2">
            {t("redirectInfo", "You will be redirected to")}:
            <span className="ml-1 font-semibold text-blue-300">{from}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
