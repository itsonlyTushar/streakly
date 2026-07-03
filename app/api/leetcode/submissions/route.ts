import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();

  if (!username) {
    return NextResponse.json(
      { error:   "Username query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://leetcode.com",
      },
      body: JSON.stringify({
        query: `
          query recentSubmissions($username: String!, $limit: Int) {
            recentSubmissionList(username: $username, limit: $limit) {
              title
              titleSlug
              timestamp
              statusDisplay
              lang
            }
          }
        `,
        variables: {
          username,
          limit: 1,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LeetCode GraphQL error response:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch from LeetCode API" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.errors) {
      console.error("LeetCode GraphQL returned errors:", data.errors);
      return NextResponse.json(
        { error: data.errors[0]?.message || "LeetCode API error" },
        { status: 400 }
      );
    }

    const submissions = data.data?.recentSubmissionList || [];
    return NextResponse.json({ submissions });
  } catch (error: any) {
    console.error("LeetCode Sync Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
