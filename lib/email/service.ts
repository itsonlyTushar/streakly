import { Resend } from "resend";
import { SRSReminderEmail } from "@/emails/srs-reminder";
import React from "react";

const resend = process.env.RESEND_KEY ? new Resend(process.env.RESEND_KEY) : null;

export const FROM_EMAIL = "Streakly <onboarding@resend.dev>";
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://streakly-tau.vercel.app";

interface SendReminderParams {
  email: string;
  topics: Array<{
    topic: string;
    details?: string;
    reviewCount: number;
  }>;
}

export async function sendSRSReminder({ email, topics }: SendReminderParams) {
  if (!resend) {
    console.warn("Skipping email send because RESEND_KEY is missing");
    return { success: false, error: "RESEND_KEY missing" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${topics.length} revision${topics.length > 1 ? "s" : ""} for today!`,
      react: React.createElement(SRSReminderEmail, {
        topics,
        baseUrl: BASE_URL,
      }),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

export async function sendTestEmail(email: string) {
  return sendSRSReminder({
    email,
    topics: [
      {
        topic: "Test Topic",
        details: "This is a test reminder to verify your email setup.",
        reviewCount: 0,
      },
    ],
  });
}
