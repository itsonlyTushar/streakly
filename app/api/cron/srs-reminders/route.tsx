import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { Resend } from "resend";
import { addDays } from "date-fns";
import { SRSReminderEmail } from "@/emails/srs-reminder";
import React from "react";

// Using server-side only key for security
const INTERVALS = [1, 3, 7, 30]; // Days for each subsequent review

export async function GET(request: Request) {
  const resend = process.env.RESEND_KEY ? new Resend(process.env.RESEND_KEY) : null;
  try {
    // 1. Authorization check
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error("Unauthorized cron attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = adminDb;
    if (!db) {
      console.error("Firebase Admin DB not initialized.");
      return NextResponse.json({ error: "Internal Server Error - DB missing" }, { status: 500 });
    }

    // 2. Find due items
    const now = new Date();
    // Use adminDb (now db) to bypass row-level security and read all items
    const snapshot = await db
      .collection("srs")
      .where("status", "==", "learning")
      .where("nextReviewDate", "<=", admin.firestore.Timestamp.fromDate(now))
      .get();

    const items = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));

    if (items.length === 0) {
      return NextResponse.json({ message: "No items due for review." });
    }

    // 3. Group by userEmail
    const userGroups: Record<string, any[]> = {};
    items.forEach((item) => {
      const email = item.userEmail;
      if (!email) return;
      if (!userGroups[email]) userGroups[email] = [];
      userGroups[email].push(item);
    });

    // 4. Send emails and update firestore
    const results = [];
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://streakly-tau.vercel.app";

    for (const [email, userItems] of Object.entries(userGroups)) {
      try {
        // Check user profile for notification preference
        const userId = userItems[0].userId;
        const profileSnap = await db.collection("profiles").doc(userId).get();
        const profile = profileSnap.data();
        const notificationsEnabled = profile?.emailNotifications ?? true;

        if (!notificationsEnabled) {
          results.push({ email, status: "skipped", reason: "opted-out" });
          continue;
        }

        // Send Email using React-Email
        if (resend) {
          await resend.emails.send({
            from: "Streakly <onboarding@resend.dev>",
            to: email,
            subject: `${userItems.length} revision${userItems.length > 1 ? "s" : ""} for today!`,
            react: React.createElement(SRSReminderEmail, {
              topics: userItems,
              baseUrl: baseUrl,
            }),
          });
        } else {
          console.warn("Skipping email send because RESEND_KEY is missing");
        }

        // Update Firebase items
        const updatePromises = userItems.map(async (item) => {
          const nextReviewCount = item.reviewCount + 1;
          const srsRef = db.collection("srs").doc(item.id);

          if (nextReviewCount >= 4) {
            // Marking as memorized
            await srsRef.update({
              status: "memorized",
              reviewCount: nextReviewCount,
              nextReviewDate: null,
            });
          } else {
            // Set next interval
            const nextInterval = INTERVALS[nextReviewCount];
            const nextDate = addDays(new Date(), nextInterval);
            await srsRef.update({
              reviewCount: nextReviewCount,
              nextReviewDate: admin.firestore.Timestamp.fromDate(nextDate),
            });
          }
        });

        await Promise.all(updatePromises);
        results.push({ email, status: "sent" });
      } catch (e) {
        console.error(`Error sending to ${email}:`, e);
        results.push({ email, status: "error", error: e });
      }
    }

    return NextResponse.json({
      message: "SRS Reminders Processed.",
      results,
    });
  } catch (error: any) {
    console.error("Cron Job Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
