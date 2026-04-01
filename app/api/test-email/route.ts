import { NextResponse } from "next/server";
import { sendTestEmail } from "@/lib/email/service";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const result = await sendTestEmail(email);

    if (result.success) {
      return NextResponse.json({ message: "Test email sent successfully", data: result.data });
    } else {
      return NextResponse.json({ error: "Failed to send email", details: result.error }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
