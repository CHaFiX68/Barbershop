"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth-client";

type Props = {
  contentKey: string;
  initialValue: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  multiline?: boolean;
  className?: string;
  maxLength?: number;
};

export default function EditableText({
  contentKey,
  initialValue,
  as,
  multiline,
  className,
  maxLength,
}: Props) {
  const { data: session } = useSession();
  const [value, setValue] = useState(initialValue);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [draft, setDraft] = useState(initialValue);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (!editing) return;
    if (multiline) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
      autoResizeTextarea();
    } else {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, multiline]);

  const isAdmin = session?.user?.role === "admin";

  if (!isAdmin) {
    const Tag = as ?? "span";
    return <Tag className={className}>{value}</Tag>;
  }

  const handleSave = async () => {
    if (saving) return;
    const trimmed = draft.trim();
    if (trimmed === "" || trimmed === value) {
      setEditing(false);
      setDraft(value);
      return;
    }
    setSaving(true);
    setSaveError(false);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: contentKey, value: draft }),
      });
      if (!res.ok) throw new Error("Save failed");
      setValue(draft);
      setEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 800);
    } catch {
      setSaveError(true);
      setTimeout(() => setSaveError(false), 1000);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setDraft(value);
      setEditing(false);
      return;
    }
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }
  };

  if (editing) {
    const sharedStyle: React.CSSProperties = {
      background: "transparent",
      border: 0,
      padding: 0,
      margin: 0,
      outline: "none",
      font: "inherit",
      color: "inherit",
      letterSpacing: "inherit",
      lineHeight: "inherit",
      borderBottom: `1px dashed ${saveError ? "#A03030" : "#C9B89A"}`,
    };
    if (multiline) {
      return (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            autoResizeTextarea();
          }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          className={className ?? ""}
          rows={1}
          style={{
            ...sharedStyle,
            display: "block",
            width: "100%",
            resize: "none",
            overflow: "hidden",
          }}
        />
      );
    }
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        maxLength={maxLength}
        size={Math.max(draft.length, 4)}
        className={className ?? ""}
        style={sharedStyle}
      />
    );
  }

  const Tag = as ?? "span";
  return (
    <Tag
      className={`${className ?? ""} cursor-pointer transition-colors`}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDraft(value);
        setEditing(true);
      }}
      style={{
        outlineOffset: "4px",
        outline: "1px dashed transparent",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.outline = "1px dashed #C9B89A";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.outline =
          "1px dashed transparent";
      }}
      title="Клікни щоб редагувати"
    >
      {value}
      {saving && <span className="ml-1 text-[10px] opacity-50">⟳</span>}
      {showSuccess && (
        <span className="ml-1 text-[10px] text-green-700">✓</span>
      )}
    </Tag>
  );
}
