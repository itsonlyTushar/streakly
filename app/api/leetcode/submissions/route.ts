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

  const leetcodeSession = request.headers.get("x-leetcode-session")?.trim();
  const leetcodeCsrf = request.headers.get("x-leetcode-csrf")?.trim();

  try {
    const leetcodeHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://leetcode.com",
    };

    if (leetcodeSession && leetcodeCsrf) {
      leetcodeHeaders["Cookie"] = `LEETCODE_SESSION=${leetcodeSession}; csrftoken=${leetcodeCsrf}`;
      leetcodeHeaders["x-csrftoken"] = leetcodeCsrf;
    }

    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: leetcodeHeaders,
      body: JSON.stringify({
        query: `
          query recentSubmissions($username: String!, $limit: Int) {
            recentSubmissionList(username: $username, limit: $limit) {
              id
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
          limit: 10,
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

    // If authenticated, fetch submission details (code) for accepted submissions
    if (leetcodeSession && leetcodeCsrf && submissions.length > 0) {
      const acceptedSubmissions = submissions.filter(
        (sub: any) => sub.statusDisplay === "Accepted"
      );

      // Fetch code for up to 5 accepted submissions in parallel
      const detailPromises = acceptedSubmissions.slice(0, 5).map(async (sub: any) => {
        try {
          const detailRes = await fetch("https://leetcode.com/graphql", {
            method: "POST",
            headers: leetcodeHeaders,
            body: JSON.stringify({
              query: `
                query submissionDetails($submissionId: Int!) {
                  submissionDetails(submissionId: $submissionId) {
                    code
                  }
                }
              `,
              variables: {
                submissionId: parseInt(sub.id, 10),
              },
            }),
          });
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            if (detailData.data?.submissionDetails?.code) {
              sub.code = detailData.data.submissionDetails.code;
            }
          }
        } catch (detailErr) {
          console.error(`Failed to fetch detail for submission ${sub.id}:`, detailErr);
        }
      });

      await Promise.all(detailPromises);
    }

    return NextResponse.json({ submissions });
  } catch (error: any) {
    console.error("LeetCode Sync Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
