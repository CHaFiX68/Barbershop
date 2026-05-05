"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type BookingContextValue = {
  isOpen: boolean;
  initialBarberId: string | null;
  open: (barberId?: string) => void;
  close: () => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialBarberId, setInitialBarberId] = useState<string | null>(null);

  const open = useCallback((barberId?: string) => {
    setInitialBarberId(barberId ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setInitialBarberId(null);
  }, []);

  const value = useMemo<BookingContextValue>(
    () => ({ isOpen, initialBarberId, open, close }),
    [isOpen, initialBarberId, open, close]
  );

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error("useBooking must be used within BookingProvider");
  }
  return ctx;
}
