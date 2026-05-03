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
      className={`flex ${isOwn ? "justify-end" : "justify-start"} ${pending ? "opacity-50" : ""}`}
    >
      <div
        className={`max-w-[70%] py-2 px-3 ${
          isOwn
            ? "bg-[#1C1B19] text-white rounded-[12px] rounded-br-sm"
            : "bg-white text-[var(--color-text)] rounded-[12px] rounded-bl-sm"
        }`}
        style={
          !isOwn
            ? { borderWidth: "0.5px", borderStyle: "solid", borderColor: "#D5D0C8" }
            : undefined
        }
      >
        <p
          className="whitespace-pre-wrap break-words"
          style={{ fontSize: "13px", lineHeight: 1.4 }}
        >
          {body}
        </p>
        <span
          className={`block text-right ${isOwn ? "text-white/60" : "text-[var(--color-text-muted)]"}`}
          style={{ fontSize: "10px", marginTop: "2px" }}
        >
          {formatTime(createdAt)}
        </span>
      </div>
    </div>
  );
}
