import nodemailer from "nodemailer";
import { generateInviteUrl } from "./utils";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendInvitationEmail({
  to,
  inviterName,
  tripTitle,
  token,
}: {
  to: string;
  inviterName: string;
  tripTitle: string;
  token: string;
}) {
  const inviteUrl = generateInviteUrl(token);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "Wevi <noreply@wevi.app>",
    to,
    subject: `${inviterName} invited you to plan a trip on Wevi 🌍`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#0284c7">You're invited! 🎉</h2>
        <p>Hi there,</p>
        <p><strong>${inviterName}</strong> invited you to join the trip planning group for <strong>${tripTitle}</strong> on Wevi.</p>
        <p>Wevi helps groups of friends coordinate travel — find a common time, vote on destinations, and build a shared itinerary together.</p>
        <a href="${inviteUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#0284c7;color:white;border-radius:8px;text-decoration:none;font-weight:bold">
          Accept Invitation
        </a>
        <p style="color:#6b7280;font-size:13px">This link expires in 7 days. If you didn't expect this email, you can safely ignore it.</p>
      </div>
    `,
  });
}

export async function sendAvailabilityReminderEmail({
  to,
  userName,
  tripTitle,
  tripId,
}: {
  to: string;
  userName: string;
  tripTitle: string;
  tripId: string;
}) {
  const tripUrl = `${process.env.NEXT_PUBLIC_APP_URL}/trips/${tripId}/availability`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "Wevi <noreply@wevi.app>",
    to,
    subject: `Reminder: Please fill in your availability for ${tripTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#0284c7">Availability reminder ⏰</h2>
        <p>Hi ${userName},</p>
        <p>The group is waiting for your availability for <strong>${tripTitle}</strong>. Once everyone fills in their times, Wevi will calculate the best common window for the trip.</p>
        <a href="${tripUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#0284c7;color:white;border-radius:8px;text-decoration:none;font-weight:bold">
          Fill in My Availability
        </a>
      </div>
    `,
  });
}
