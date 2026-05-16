"use client";

import { memo } from "react";

type Props = {
  body: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
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

function ChatMessageBubble({
  body,
  attachmentUrl,
  attachmentType,
  createdAt,
  isOwn,
  pending,
}: Props) {
  const isImage =
    !!attachmentUrl && (attachmentType?.startsWith("image/") ?? false);
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
            ? {
                borderWidth: "0.5px",
                borderStyle: "solid",
                borderColor: "var(--color-line)",
              }
            : undefined
        }
      >
        {isImage && (
          <button
            type="button"
            onClick={() =>
              window.open(attachmentUrl!, "_blank", "noopener,noreferrer")
            }
            className="block max-w-full mb-1 rounded-[8px] overflow-hidden cursor-zoom-in"
            aria-label="Open image"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachmentUrl!}
              alt=""
              className="block max-w-[240px] max-h-[240px] w-auto h-auto object-cover"
              loading="lazy"
            />
          </button>
        )}
        {body.length > 0 && (
          <p
            className="whitespace-pre-wrap"
            style={{ fontSize: "13px", lineHeight: 1.4 }}
          >
            {body}
          </p>
        )}
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

export default memo(ChatMessageBubble);
