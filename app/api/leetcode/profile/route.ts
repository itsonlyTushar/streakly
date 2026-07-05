import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();

  if (!username) {
    return NextResponse.json(
      { error: "Username query parameter is required" },
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
          query userProfileAndStats($username: String!) {
            matchedUser(username: $username) {
              username
              profile {
                ranking
                userAvatar
                realName
              }
              submitStatsGlobal {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
            }
          }
        `,
        variables: {
          username,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LeetCode Profile GraphQL error response:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch LeetCode profile info" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.errors) {
      console.error("LeetCode Profile GraphQL returned errors:", data.errors);
      return NextResponse.json(
        { error: data.errors[0]?.message || "LeetCode profile API error" },
        { status: 400 }
      );
    }

    const profileInfo = data.data?.matchedUser;
    if (!profileInfo) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ranking: profileInfo.profile?.ranking,
      userAvatar: profileInfo.profile?.userAvatar,
      realName: profileInfo.profile?.realName,
      username: profileInfo.username,
      submitStats: profileInfo.submitStatsGlobal?.acSubmissionNum || [],
    });
  } catch (error: any) {
    console.error("LeetCode Profile Fetch Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
