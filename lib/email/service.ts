import { render } from "@react-email/render";
import { SRSReminderEmail } from "@/emails/srs-reminder";
import React from "react";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const FROM_NAME = "Streakly";
const FROM_ADDRESS = "reminder@streakly.online";

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://streakly.online";

interface SendReminderParams {
  email: string;
  topics: Array<{
    topic: string;
    details?: string;
    reviewCount: number;
    isOneOff?: boolean;
  }>;
}

export async function sendSRSReminder({ email, topics }: SendReminderParams) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("Cannot send email because BREVO_API_KEY is missing");
    return { success: false, error: "BREVO_API_KEY missing" };
  }

  try {
    const htmlContent = await render(
      React.createElement(SRSReminderEmail, {
        topics,
        baseUrl: BASE_URL,
      })
    );
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: FROM_NAME,
          email: FROM_ADDRESS,
        },
        to: [{ email }],
        subject: `${topics.length} revision${topics.length > 1 ? "s" : ""} for today!`,
        htmlContent,
      }),
    });

    const responseBody = await response.text();
    if (!response.ok) {
      const error = `Brevo API returned ${response.status}: ${responseBody}`;
      console.error(error);
      return { success: false, error };
    }

    return {
      success: true,
      data: responseBody,
    };
  } catch (error) {
    console.error("Failed to send email through Brevo:", error);
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
