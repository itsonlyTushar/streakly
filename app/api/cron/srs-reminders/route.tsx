import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { sendSRSReminder } from "@/lib/email/service";

export async function GET(request: Request) {
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
    // Use adminDb to bypass row-level security and read all items
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

    // 3. Group by userEmail and filter items already reminded today
    const userGroups: Record<string, any[]> = {};
    const todayStr = now.toISOString().split("T")[0]; // Use current date for tracking

    items.forEach((item) => {
      const email = item.userEmail;
      if (!email) return;

      // Skip if we already sent a reminder to this user TODAY for THIS specific item
      // Or we can just group all due items for this user and send one mail.
      // If we send one mail for ALL due items, we need to track if we've sent
      // a "daily summary" reminder for this user today.
      
      if (!userGroups[email]) userGroups[email] = [];
      userGroups[email].push(item);
    });

    // 4. Send emails and update tracking in firestore
    const results = [];

    for (const [email, userItems] of Object.entries(userGroups)) {
      try {
        // Check if user has already received a reminder today
        // We look at the latest 'lastRemindedAt' among the user's due items
        // or check at the profile level. Profile level is better for "one mail per day".
        
        const userId = userItems[0].userId;
        const profileSnap = await db.collection("profiles").doc(userId).get();
        const profile = profileSnap.data();
        
        // Skip if notifications are disabled
        const notificationsEnabled = profile?.emailNotifications ?? true;
        if (!notificationsEnabled) {
          results.push({ email, status: "skipped", reason: "opted-out" });
          continue;
        }

        // Check last reminder date
        if (profile?.lastReminderDate === todayStr) {
          results.push({ email, status: "skipped", reason: "already-reminded-today" });
          continue;
        }

        // Send Email
        const emailResult = await sendSRSReminder({
          email,
          topics: userItems.map(item => ({
            topic: item.topic,
            details: item.details,
            reviewCount: item.reviewCount,
          })),
        });

        if (emailResult.success) {
          // Update profile to mark that we've sent the daily reminder
          await db.collection("profiles").doc(userId).set({
            lastReminderDate: todayStr,
            lastRemindedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
          
          results.push({ email, status: "sent" });
        } else {
          results.push({ email, status: "error", error: emailResult.error });
        }
      } catch (e) {
        console.error(`Error processing email for ${email}:`, e);
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

