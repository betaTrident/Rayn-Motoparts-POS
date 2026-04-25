import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { loginSchema, type LoginFormValues } from "@/schema/loginSchema";
import { cn } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import RaynLogo from "@/assets/RAYN-LOGO.svg";

// ═══════════════════════════════════════════════════════
//  INDUSTRIAL ATELIER — Login Page
//  Left: signature gradient + blueprint grid + logo
//  Right: crisp white form card on #f9f9f9 canvas
// ═══════════════════════════════════════════════════════

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setServerError(null);
      await login(data);
      navigate("/", { replace: true });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response
      ) {
        const responseData = error.response.data as Record<string, unknown>;
        const message =
          typeof responseData.detail === "string"
            ? responseData.detail
            : "Invalid email or password.";
        setServerError(message);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <main
      className="flex min-h-screen bg-[#f9f9f9]"
      aria-labelledby="login-page-heading"
    >
      {/* ─────────────────────────────────────────
          LEFT PANEL — Industrial branding canvas
      ───────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
        style={{ background: "linear-gradient(135deg, #b02f00 0%, #ff5722 100%)" }}
      >
        {/* Blueprint grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Decorative corner accent dots */}
        <div className="absolute top-8 left-8 w-16 h-16 opacity-20">
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white" />
        </div>
        <div className="absolute bottom-8 right-8 w-16 h-16 opacity-20">
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center px-12 text-center text-white max-w-md">
          {/* Logo frame with technical bracket corners */}
          <div className="relative mb-8">
            <div className="w-36 h-36 bg-white/15 border border-white/20 flex items-center justify-center p-5">
              <img
                src={RaynLogo}
                alt="Rayn Motorparts and Accessories"
                className="w-full h-full object-contain"
              />
            </div>
            {/* Corner brackets */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white/60" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white/60" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white/60" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white/60" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight leading-tight mb-2">
            Rayn Motorparts
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mb-6">
            Precision Point of Sale System
          </p>

          <div className="w-12 h-px bg-white/30 mb-6" />

          <p className="text-sm text-white/65 leading-relaxed">
            Manage inventory, process sales, and track your motorparts business
            with precision — all from one workstation.
          </p>

          {/* System status pill */}
          <div className="mt-8 flex items-center gap-2 bg-white/10 border border-white/15 px-4 py-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
              System Online
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────
          RIGHT PANEL — Operator sign-in form
      ───────────────────────────────────────── */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 bg-[#f9f9f9]">
        {/* Mobile logo */}
        <div className="flex flex-col items-center mb-8 lg:hidden">
          <div className="mb-4 w-20 h-20 bg-[#ff5722] flex items-center justify-center p-3">
            <img
              src={RaynLogo}
              alt="Rayn Motorparts"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl font-extrabold text-[#1a1c1c] tracking-tight text-center">
            Rayn Motorparts
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#546067] mt-1">
            Precision POS
          </p>
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm bg-white border border-[rgba(84,96,103,0.22)] shadow-[0_2px_12px_rgba(84,96,103,0.08)]">
          {/* Card header well */}
          <div className="bg-[#e8e8e8] border-b border-[rgba(84,96,103,0.2)] px-6 py-4">
            <h2
              id="login-page-heading"
              className="text-xs font-bold uppercase tracking-widest text-[#1a1c1c]"
            >
              Operator Sign-In
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#546067] mt-0.5">
              Authentication Required
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Server error */}
            {serverError && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-3 border-l-4 border-[#ba1a1a] bg-[#ffdad6]/30 px-4 py-3 text-sm text-[#ba1a1a]"
              >
                <span
                  className="material-symbols-outlined shrink-0 mt-0.5"
                  style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
                >
                  warning
                </span>
                {serverError}
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
                aria-describedby="login-page-heading"
              >
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-[#546067]">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <input
                          type="email"
                          placeholder="operator@raynmotorparts.com"
                          autoComplete="email"
                          disabled={isSubmitting}
                          className={cn(
                            "w-full px-3 py-2.5 text-sm text-[#1a1c1c] bg-[#f9f9f9]",
                            "border border-[rgba(84,96,103,0.35)]",
                            "focus:outline-none focus:border-[#ff5722] focus:border-2 focus:bg-white",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "transition-all duration-150 placeholder:text-[#546067]/60"
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-[#ba1a1a]" />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-[#546067]">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={isSubmitting}
                            className={cn(
                              "w-full px-3 py-2.5 pr-10 text-sm text-[#1a1c1c] bg-[#f9f9f9]",
                              "border border-[rgba(84,96,103,0.35)]",
                              "focus:outline-none focus:border-[#ff5722] focus:border-2 focus:bg-white",
                              "disabled:opacity-50 disabled:cursor-not-allowed",
                              "transition-all duration-150 placeholder:text-[#546067]/60"
                            )}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            aria-pressed={showPassword}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#546067] hover:text-[#1a1c1c] transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-[#ba1a1a]" />
                    </FormItem>
                  )}
                />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "w-full bg-[#ff5722] text-white py-3 px-4",
                    "text-[10px] font-bold uppercase tracking-widest",
                    "hover:bg-[#e04a1e] active:scale-[0.98]",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    "transition-all duration-150 flex items-center justify-center gap-2"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 20" }}
                      >
                        login
                      </span>
                      Sign In
                    </>
                  )}
                </button>
              </form>
            </Form>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[10px] text-[#546067]/60 uppercase tracking-widest">
          © {new Date().getFullYear()} Rayn Motorparts &amp; Accessories
        </p>
      </div>
    </main>
  );
}
