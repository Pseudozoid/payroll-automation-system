"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Banknote, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import type { Metadata } from "next";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        window.location.href = "/";
        return;
      }

      const json = await res.json().catch(() => ({}));
      setServerError(json.error ?? "Login failed. Please try again.");
    } catch {
      setServerError("Network error. Please check your connection.");
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-700/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-2xl shadow-indigo-500/40"
          >
            <Banknote className="w-8 h-8 text-white" />
          </motion.div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-0">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Sign in to your Payroll Automation System admin account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-8 pt-6 pb-8 space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="admin@company.com"
                {...register("email")}
                className={`w-full px-3.5 py-2.5 text-sm border rounded-lg outline-none transition-all
                  placeholder:text-slate-400 text-slate-900
                  focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                  ${errors.email ? "border-red-400 bg-red-50" : "border-slate-300 bg-white hover:border-slate-400"}`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={`w-full px-3.5 py-2.5 pr-10 text-sm border rounded-lg outline-none transition-all
                    placeholder:text-slate-400 text-slate-900
                    focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                    ${errors.password ? "border-red-400 bg-red-50" : "border-slate-300 bg-white hover:border-slate-400"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{serverError}</p>
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700
                disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold
                rounded-lg transition-colors shadow-sm shadow-indigo-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-slate-500">
          Single-admin system. Contact your IT team if you&apos;re locked out.
        </p>
      </motion.div>
    </div>
  );
}
