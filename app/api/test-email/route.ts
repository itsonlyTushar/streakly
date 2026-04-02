import { NextResponse } from "next/server";
import { sendTestEmail } from "@/lib/email/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("to");

  if (!email) {
    return NextResponse.json(
      { error: "Missing 'to' query parameter (e.g. /api/test-email?to=your@email.com)" },
      { status: 400 }
    );
  }

  try {
    const result = await sendTestEmail(email);
    if (result.success) {
      return NextResponse.json({ message: `Test email sent to ${email}`, data: result.data });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
