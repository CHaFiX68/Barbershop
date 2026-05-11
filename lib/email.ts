import { Resend } from "resend";
import enMessages from "@/messages/en.json";
import svMessages from "@/messages/sv.json";

const FROM_VERIFY = "TWOBarbers Verification <onboarding@resend.dev>";
const FROM_BOOKING = "TWOBarbers <onboarding@resend.dev>";

let resendClient: Resend | null = null;
function getResend() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set in environment");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendVerificationEmail(email: string, code: string) {
  const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; padding: 32px; background: #EDEAE5;"><div style="max-width: 480px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 16px;"><h1 style="font-family: Georgia, serif; color: #1C1B19; margin: 0 0 16px;">Код підтвердження</h1><p style="color: #5A554E; font-size: 14px; line-height: 1.6;">Дякуємо за реєстрацію в TWOBarbers. Введи цей код щоб завершити реєстрацію:</p><div style="font-size: 36px; font-weight: 600; letter-spacing: 0.4em; color: #1C1B19; text-align: center; padding: 24px; background: #F5F0E6; border-radius: 12px; margin: 24px 0;">${code}</div><p style="color: #7A736A; font-size: 12px;">Код дійсний 10 хвилин. Якщо ти не реєструвався — просто проігноруй цей лист.</p></div></body></html>`;

  const { data, error } = await getResend().emails.send({
    from: FROM_VERIFY,
    to: email,
    subject: "Код підтвердження TWOBarbers",
    html,
  });
  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
  return data;
}

type Locale = "en" | "sv";
type EmailTemplate =
  | "bookingConfirmation"
  | "bookingNotificationBarber"
  | "bookingReminder24h"
  | "bookingReminder1h";

function emailT(
  locale: Locale,
  template: EmailTemplate,
  key: string,
  params?: Record<string, string | number>
): string {
  const messages = locale === "sv" ? svMessages : enMessages;
  const node = (messages.emails as Record<string, Record<string, string>>)[
    template
  ];
  let raw = node?.[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      raw = raw.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return raw;
}

function bookingHtml(
  locale: Locale,
  template: EmailTemplate,
  data: {
    recipientName: string;
    partnerName: string;
    partnerLabel: string;
    serviceName: string;
    dateTimeFormatted: string;
  }
): string {
  const t = (k: string, p?: Record<string, string | number>) =>
    emailT(locale, template, k, p);
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1c1b19;">
      <h2 style="font-weight: 600;">${t("greeting", { name: data.recipientName })}</h2>
      <p>${t("intro")}</p>
      <div style="background: #faf7f1; border: 1px solid #d5d0c8; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <div style="margin-bottom: 12px;">
          <div style="font-size: 11px; color: #7a736a; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 4px;">${data.partnerLabel}</div>
          <div style="font-size: 16px;">${data.partnerName}</div>
        </div>
        <div style="margin-bottom: 12px;">
          <div style="font-size: 11px; color: #7a736a; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 4px;">${t("serviceLabel")}</div>
          <div style="font-size: 16px;">${data.serviceName}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #7a736a; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 4px;">${t("dateLabel")}</div>
          <div style="font-size: 16px;">${data.dateTimeFormatted}</div>
        </div>
      </div>
      <p style="color: #7a736a; font-size: 14px;">${template === "bookingNotificationBarber" ? t("openChatNote") : t("modifyNote")}</p>
      <hr style="border: none; border-top: 1px solid #d5d0c8; margin: 24px 0;" />
      <p style="color: #7a736a; font-size: 12px; text-align: center;">${t("footer")}</p>
    </div>
  `;
}

export async function sendBookingConfirmation(
  to: string,
  recipientName: string,
  barberName: string,
  serviceName: string,
  dateTimeFormatted: string,
  locale: Locale = "en"
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping booking confirmation");
    return;
  }
  await getResend().emails.send({
    from: FROM_BOOKING,
    to,
    subject: emailT(locale, "bookingConfirmation", "subject"),
    html: bookingHtml(locale, "bookingConfirmation", {
      recipientName: recipientName || to.split("@")[0],
      partnerName: barberName,
      partnerLabel: emailT(locale, "bookingConfirmation", "barberLabel"),
      serviceName,
      dateTimeFormatted,
    }),
  });
}

export async function sendBookingNotificationToBarber(
  to: string,
  barberName: string,
  customerName: string,
  serviceName: string,
  dateTimeFormatted: string,
  locale: Locale = "en"
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping barber notification");
    return;
  }
  await getResend().emails.send({
    from: FROM_BOOKING,
    to,
    subject: emailT(locale, "bookingNotificationBarber", "subject"),
    html: bookingHtml(locale, "bookingNotificationBarber", {
      recipientName: barberName || to.split("@")[0],
      partnerName: customerName,
      partnerLabel: emailT(locale, "bookingNotificationBarber", "customerLabel"),
      serviceName,
      dateTimeFormatted,
    }),
  });
}

export async function sendBookingReminder24h(
  to: string,
  recipientName: string,
  barberName: string,
  serviceName: string,
  dateTimeFormatted: string,
  locale: Locale = "en"
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping reminder 24h");
    return;
  }
  await getResend().emails.send({
    from: FROM_BOOKING,
    to,
    subject: emailT(locale, "bookingReminder24h", "subject"),
    html: bookingHtml(locale, "bookingReminder24h", {
      recipientName: recipientName || to.split("@")[0],
      partnerName: barberName,
      partnerLabel: emailT(locale, "bookingReminder24h", "barberLabel"),
      serviceName,
      dateTimeFormatted,
    }),
  });
}

export async function sendBookingReminder1h(
  to: string,
  recipientName: string,
  barberName: string,
  serviceName: string,
  dateTimeFormatted: string,
  locale: Locale = "en"
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping reminder 1h");
    return;
  }
  await getResend().emails.send({
    from: FROM_BOOKING,
    to,
    subject: emailT(locale, "bookingReminder1h", "subject"),
    html: bookingHtml(locale, "bookingReminder1h", {
      recipientName: recipientName || to.split("@")[0],
      partnerName: barberName,
      partnerLabel: emailT(locale, "bookingReminder1h", "barberLabel"),
      serviceName,
      dateTimeFormatted,
    }),
  });
}
