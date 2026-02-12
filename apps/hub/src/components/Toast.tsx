/* =========================
   トースト通知（保存成功・エラー等）
   ========================= */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CheckCircle, XCircle } from "lucide-react";
import clsx from "clsx";

type ToastType = "success" | "error";

type ToastState = {
  message: string;
  type: ToastType;
  visible: boolean;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const DURATION_MS = 3000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ToastState>({
    message: "",
    type: "success",
    visible: false,
  });

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setState({ message, type, visible: true });
  }, []);

  useEffect(() => {
    if (!state.visible) return;
    const t = setTimeout(() => {
      setState((s) => ({ ...s, visible: false }));
    }, DURATION_MS);
    return () => clearTimeout(t);
  }, [state.visible]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {state.visible && (
        <div
          className="fixed inset-x-0 z-[100] flex justify-center"
          style={{
            top: "calc(56px + var(--safe-top, 0px) + 16px)",
          }}
        >
          <div
            role="status"
            aria-live="polite"
            className={clsx(
              "flex items-center gap-3 px-5 py-3 rounded-xl",
              "bg-slate-800/95 backdrop-blur-md border shadow-lg",
              "animate-toast-in",
              state.type === "success"
                ? "border-slate-400/50 text-slate-100"
                : "border-red-500/50 text-red-100"
            )}
          >
          {state.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-slate-300 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{state.message}</span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
