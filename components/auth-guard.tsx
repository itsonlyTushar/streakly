"use client";

import { useAuth } from "@/components/auth-provider";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useState, createContext, useContext, useCallback } from "react";

interface AuthGuardContextType {
  requireAuth: (action: () => void) => void;
}

const AuthGuardContext = createContext<AuthGuardContextType | undefined>(undefined);

export function AuthGuardProvider({ children }: { children: React.ReactNode }) {
  const { user, loginWithGoogle } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireAuth = useCallback((action: () => void) => {
    if (!user) {
      setPendingAction(() => action);
      setIsOpen(true);
    } else {
      action();
    }
  }, [user]);

  const handleConfirm = async () => {
    setIsOpen(false);
    await loginWithGoogle();
    // Note: After login, the page will reload/redirect, so the pending action 
    // won't automatically execute. This is fine as the user will be logged in now.
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
