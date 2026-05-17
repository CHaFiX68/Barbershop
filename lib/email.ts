import { Resend } from "resend";
import enMessages from "@/messages/en.json";
import svMessages from "@/messages/sv.json";

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

/**
 * Central email sender. Routes through Resend.
 *
 * When EMAIL_FROM is set → production mode: real `from` and real `to`.
 * When EMAIL_FROM is missing → test mode: falls back to onboarding@resend.dev
 * sender; redirects `to` to RESEND_TEST_EMAIL / ADMIN_EMAIL / hardcoded
 * fallback; prefixes subject with `[TEST -> original-to]`.
 *
 * Moving to a verified domain = just set EMAIL_FROM in env.
 */
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[EMAIL] RESEND_API_KEY missing, skipping:", subject);
    return;
  }
  const envFrom = process.env.EMAIL_FROM;
  const from = envFrom ?? "TWOBarbers <onboarding@resend.dev>";
  let effectiveTo = to;
  let effectiveSubject = subject;
  if (!envFrom) {
    const testTo =
      process.env.RESEND_TEST_EMAIL ??
      process.env.ADMIN_EMAIL ??
      "akktop26@gmail.com";
    effectiveTo = testTo;
    effectiveSubject = `[TEST -> ${to}] ${subject}`;
  }
  await getResend().emails.send({
    from,
    to: effectiveTo,
    subject: effectiveSubject,
    html,
  });
}

export async function sendVerificationEmail(email: string, code: string) {
  const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; padding: 32px; background: #EDEAE5;"><div style="max-width: 480px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 16px;"><h1 style="font-family: Georgia, serif; color: #1C1B19; margin: 0 0 16px;">Код підтвердження</h1><p style="color: #5A554E; font-size: 14px; line-height: 1.6;">Дякуємо за реєстрацію в TWOBarbers. Введи цей код щоб завершити реєстрацію:</p><div style="font-size: 36px; font-weight: 600; letter-spacing: 0.4em; color: #1C1B19; text-align: center; padding: 24px; background: #F5F0E6; border-radius: 12px; margin: 24px 0;">${code}</div><p style="color: #7A736A; font-size: 12px;">Код дійсний 10 хвилин. Якщо ти не реєструвався — просто проігноруй цей лист.</p></div></body></html>`;
  await sendEmail({
    to: email,
    subject: "Код підтвердження TWOBarbers",
    html,
  });
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
  await sendEmail({
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

export async function sendAnketaPendingNotificationToAdmin(
  barberName: string,
  barberEmail: string
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? "akktop26@gmail.com";
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://barbershop-mocha.vercel.app";
  try {
    await sendEmail({
      to: adminEmail,
      subject: `New anketa for review: ${barberName}`,
      html: `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; padding: 32px; background: #EDEAE5;"><div style="max-width: 480px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 16px;"><h1 style="font-family: Georgia, serif; color: #1C1B19; margin: 0 0 16px;">New barber anketa submitted</h1><p style="color: #5A554E; font-size: 14px; line-height: 1.6;">Barber <strong>${barberName}</strong> (${barberEmail}) submitted profile changes for review.</p><p style="margin-top: 24px;"><a href="${baseUrl}/admin/support" style="display: inline-block; background: #1C1B19; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">Open admin panel</a></p></div></body></html>`,
    });
  } catch (err) {
    console.error("[EMAIL] sendAnketaPendingNotificationToAdmin error:", err);
  }
}

export async function sendBookingNotificationToBarber(
  to: string,
  barberName: string,
  customerName: string,
  serviceName: string,
  dateTimeFormatted: string,
  locale: Locale = "en"
): Promise<void> {
  await sendEmail({
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
  await sendEmail({
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
  await sendEmail({
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

export async function sendUnreadChatNotification({
  to,
  recipientName,
}: {
  to: string;
  recipientName: string;
}): Promise<void> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://barbershop-mocha.vercel.app";
  const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; padding: 32px; background: #EDEAE5;"><div style="max-width: 480px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 16px;"><h1 style="font-family: Georgia, serif; color: #1C1B19; margin: 0 0 16px;">У вас є непрочитане повідомлення</h1><p style="color: #5A554E; font-size: 14px; line-height: 1.6;">${recipientName ? `Привіт, ${recipientName}.` : "Привіт."} У вашому чаті TWOBarbers є нові повідомлення, які ви ще не прочитали.</p><p style="margin-top: 24px;"><a href="${baseUrl}" style="display: inline-block; background: #1C1B19; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">Відкрити чат</a></p><hr style="border: none; border-top: 1px solid #d5d0c8; margin: 24px 0;" /><p style="color: #7A736A; font-size: 12px; text-align: center;">TWOBarbers — Sundbyberg, Sweden</p></div></body></html>`;
  try {
    await sendEmail({
      to,
      subject: "TWOBarbers — нове повідомлення у чаті",
      html,
    });
  } catch (err) {
    console.error("[EMAIL] sendUnreadChatNotification error:", err);
  }
}
