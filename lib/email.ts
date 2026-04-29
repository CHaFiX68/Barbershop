import { Resend } from "resend";

const FROM = "BARBER&CO Verification <onboarding@resend.dev>";

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
  const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; padding: 32px; background: #EDEAE5;"><div style="max-width: 480px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 16px;"><h1 style="font-family: Georgia, serif; color: #1C1B19; margin: 0 0 16px;">Код підтвердження</h1><p style="color: #5A554E; font-size: 14px; line-height: 1.6;">Дякуємо за реєстрацію в BARBER&amp;CO. Введи цей код щоб завершити реєстрацію:</p><div style="font-size: 36px; font-weight: 600; letter-spacing: 0.4em; color: #1C1B19; text-align: center; padding: 24px; background: #F5F0E6; border-radius: 12px; margin: 24px 0;">${code}</div><p style="color: #7A736A; font-size: 12px;">Код дійсний 10 хвилин. Якщо ти не реєструвався — просто проігноруй цей лист.</p></div></body></html>`;

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Код підтвердження BARBER&CO",
    html,
  });
  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
  return data;
}
