"use client";

type Props = {
  body: string;
  createdAt: string;
  isOwn: boolean;
  pending?: boolean;
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function ChatMessageBubble({
  body,
  createdAt,
  isOwn,
  pending,
}: Props) {
  return (
    <div
      className={`flex w-full ${isOwn ? "justify-end" : "justify-start"} ${pending ? "opacity-50" : ""}`}
    >
      <div
        className={`max-w-[75%] min-w-0 py-2 px-3 wrap-anywhere ${
          isOwn
            ? "bg-[var(--color-action-bg)] text-[var(--color-action-text)] rounded-[12px] rounded-br-sm"
            : "bg-[var(--color-surface-2)] text-[var(--color-text)] rounded-[12px] rounded-bl-sm"
        }`}
        style={
          !isOwn
            ? { borderWidth: "0.5px", borderStyle: "solid", borderColor: "var(--color-line)" }
            : undefined
        }
      >
        <p
          className="whitespace-pre-wrap"
          style={{ fontSize: "13px", lineHeight: 1.4 }}
        >
          {body}
        </p>
        <span
          className={`block text-right ${isOwn ? "opacity-60" : "text-[var(--color-text-muted)]"}`}
          style={{ fontSize: "10px", marginTop: "2px" }}
        >
          {formatTime(createdAt)}
        </span>
      </div>
    </div>
  );
}
