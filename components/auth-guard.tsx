"use client";

import { useAuth } from "@/components/auth-provider";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useState, createContext, useContext, useCallback } from "react";

interface AuthGuardContextType {
  requireAuth: (action: () => void | Promise<void>) => void;
}

const AuthGuardContext = createContext<AuthGuardContextType | undefined>(undefined);

export function AuthGuardProvider({ children }: { children: React.ReactNode }) {
  const { user, loginWithGoogle } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireAuth = useCallback((action: () => void | Promise<void>) => {
    if (!user) {
      setPendingAction(() => action);
      setIsOpen(true);
    } else {
      void Promise.resolve(action());
    }
  }, [user]);

  const handleConfirm = async () => {
    setIsOpen(false);
    await loginWithGoogle();

    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      await Promise.resolve(action());
    }
  };

  return (
    <AuthGuardContext.Provider value={{ requireAuth }}>
      {children}
      <ConfirmationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        title="Join Streakly"
        description="You need an account to save your progress and access all features. Sign in now to get started!"
        confirmText="Sign in with Google"
        variant="primary"
        icon="question"
      />
    </AuthGuardContext.Provider>
  );
}

export function useAuthGuard() {
  const context = useContext(AuthGuardContext);
  if (context === undefined) {
    throw new Error("useAuthGuard must be used within an AuthGuardProvider");
  }
  return context;
}
