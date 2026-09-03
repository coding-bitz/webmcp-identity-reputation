import { Resend } from 'resend';

export async function sendOtpEmail(otp: string, agentId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured on server.');
  }

  const recipients = (process.env.OTP_RECIPIENT_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error('OTP_RECIPIENT_EMAILS is not set — cannot send OTP.');
  }

  const resend = new Resend(apiKey);

  const fromAddress = process.env.RESEND_FROM_EMAIL || 'WebMCP Identity Passport <onboarding@resend.dev>';

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: recipients,
    subject: `Your WebMCP authentication code: ${otp}`,
    text: `Agent "${agentId}" is requesting authentication.\n\nOne-time code: ${otp}\n\nThis code expires in 5 minutes and can only be used once.`,
  });

  if (error) {
    throw new Error(`Resend rejected the email: ${error.message}`);
  }
}
