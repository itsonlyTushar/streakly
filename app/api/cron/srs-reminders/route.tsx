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
      console.error("Firebase Admin DB not initialized. Check FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY environment variables.");
      return NextResponse.json({ error: "Internal Server Error - DB missing" }, { status: 500 });
    }

    const now = new Date();
    // Broaden query to end of the current day to capture all "today's" reminders in one go
    const endOfToday = new Date(now);
    endOfToday.setUTCHours(23, 59, 59, 999);
    
    const snapshot = await db
      .collection("srs")
      .where(admin.firestore.Filter.or(
        admin.firestore.Filter.where("nextReviewDate", "<=", admin.firestore.Timestamp.fromDate(endOfToday)),
        admin.firestore.Filter.where("reminderDate", "<=", admin.firestore.Timestamp.fromDate(endOfToday))
      ))
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ message: "No items due for review today." });
    }

    // 2. Group by userId for architectural robustness
    // Maps userId -> { email: string, items: any[] }
    const userGroups: Record<string, { email: string; items: any[] }> = {};
    const todayStr = now.toISOString().split("T")[0];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const userId = data.userId;
      const email = data.userEmail?.toLowerCase()?.trim();
      
      if (!userId) return; // Skip if no user ID associated

      if (!userGroups[userId]) {
        userGroups[userId] = { 
          email: email || "", // We'll try to find an email if missing
          items: [] 
        };
      }
      
      // Use the email from the item if we don't have one yet for this user
      if (!userGroups[userId].email && email) {
        userGroups[userId].email = email;
      }
      
      // Determine if this is a one-off reminder (reminderDate is matched)
      // or a normal SRS reminder (nextReviewDate is matched)
      const isOneOff = data.reminderDate && data.reminderDate.toDate() <= endOfToday;
      
      userGroups[userId].items.push({
        id: doc.id,
        isOneOff,
        ...data,
      });
    });

    // 3. Process each user group
    const results = [];

    for (const [userId, group] of Object.entries(userGroups)) {
      try {
        // Fetch profile to check preferences and last reminder date
        const profileSnap = await db.collection("profiles").doc(userId).get();
        const profile = profileSnap.data();
        
        // Skip if notifications are disabled (defaults to true)
        const notificationsEnabled = profile?.emailNotifications ?? true;
        if (!notificationsEnabled) {
          results.push({ userId, status: "skipped", reason: "opted-out" });
          continue;
        }

        // Check if user has already received a reminder today
        if (profile?.lastReminderDate === todayStr) {
          results.push({ userId, status: "skipped", reason: "already-reminded-today" });
          continue;
        }

        // Finalize email address
        const email = group.email || profile?.email || "";
        if (!email) {
          console.warn(`No email found for user ${userId}, skipping.`);
          results.push({ userId, status: "skipped", reason: "no-email-address" });
          continue;
        }

        // Send Email
        const emailResult = await sendSRSReminder({
          email,
          topics: group.items.map(item => ({
            topic: item.topic,
            details: item.details,
            reviewCount: item.reviewCount,
            isOneOff: item.isOneOff,
          })),
        });

        if (emailResult.success) {
          // Update profile to mark today's reminder as sent
          await db.collection("profiles").doc(userId).set({
            lastReminderDate: todayStr,
            lastRemindedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
          
          // Clear reminderDate for processed one-off reminders
          const itemsToClear = group.items.filter(item => item.isOneOff);
          if (itemsToClear.length > 0) {
            const batch = db.batch();
            itemsToClear.forEach(item => {
              batch.update(db.collection("srs").doc(item.id), { reminderDate: null });
            });
            await batch.commit();
          }

          results.push({ userId, email, status: "sent" });
        } else {
          results.push({ userId, email, status: "error", error: emailResult.error });
        }
      } catch (e: any) {
        console.error(`Error processing userId ${userId}:`, e);
        results.push({ userId, status: "error", error: e.message || String(e) });
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

