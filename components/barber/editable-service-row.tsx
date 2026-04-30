"use client";

import { useEffect, useRef } from "react";

export type EditableService = {
  id: string;
  name: string;
  price: string;
};

type Props = {
  service: EditableService;
  onUpdate: (field: "name" | "price", value: string) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
};

export default function EditableServiceRow({
  service,
  onUpdate,
  onDelete,
}: Props) {
  const nameRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (nameRef.current && document.activeElement !== nameRef.current) {
      nameRef.current.value = service.name;
    }
    if (priceRef.current && document.activeElement !== priceRef.current) {
      priceRef.current.value = service.price;
    }
  }, [service.name, service.price]);

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (!value) {
      e.target.value = service.name;
      return;
    }
    if (value !== service.name) {
      void onUpdate("name", value);
    }
  };

  const handlePriceBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (!value) {
      e.target.value = service.price;
      return;
    }
    if (value !== service.price) {
      void onUpdate("price", value);
    }
  };

  return (
    <div className="grid grid-cols-12 items-center border-b border-[var(--color-line)] py-2.5 group">
      <div className="col-span-7">
        <input
          ref={nameRef}
          type="text"
          defaultValue={service.name}
          onBlur={handleNameBlur}
          placeholder="Назва послуги"
          className="w-full bg-transparent outline-none focus:bg-[#F5F0E6] rounded px-1 text-[13px]"
        />
      </div>
      <div className="col-span-1 text-center text-[var(--color-text-muted)]">
        |
      </div>
      <div className="col-span-3">
        <input
          ref={priceRef}
          type="text"
          defaultValue={service.price}
          onBlur={handlePriceBlur}
          placeholder="350 SEK"
          className="w-full bg-transparent outline-none focus:bg-[#F5F0E6] rounded px-1 text-[13px] font-medium"
        />
      </div>
      <div className="col-span-1 text-right">
        <button
          type="button"
          onClick={() => void onDelete()}
          className="opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-[#A03030] transition-all"
          title="Видалити"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
