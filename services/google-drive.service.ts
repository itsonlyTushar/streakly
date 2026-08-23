"use client";

/**
 * Google Drive upload service.
 *
 * Uses Google Identity Services (GIS) token client to obtain an OAuth access
 * token scoped to `drive.file` — meaning the app can ONLY see/modify files it
 * created itself. Then uploads files via the Drive v3 multipart endpoint.
 *
 * Requires NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID in .env.local
 * (OAuth 2.0 Client ID of type "Web application", with your app origin added
 * under "Authorized JavaScript origins").
 */

const DRIVE_UPLOAD_ENDPOINT =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink";
const SCOPE = "https://www.googleapis.com/auth/drive.file";

const GIS_SRC = "https://accounts.google.com/gsi/client";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }): { requestAccessToken(overrides?: { prompt?: string }): void };
        };
      };
    };
  }
}

let gisLoaded: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Drive upload requires a browser"));
  }
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoaded) return gisLoaded;

  gisLoaded = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
  return gisLoaded;
}

/** Obtains an OAuth access token with drive.file scope (prompts consent once). */
export async function getDriveAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "Google Drive upload is not configured. Add NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID to your environment."
    );
  }

  await loadGis();

  return new Promise<string>((resolve, reject) => {
    const tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (response) => {
        if (response.access_token) {
          resolve(response.access_token);
        } else {
          reject(
            new Error(response.error || "Google authorization was cancelled")
          );
        }
      },
    });
    // 'consent' ensures we always get a fresh usable token; GIS caches so
    // subsequent calls usually skip the popup.
    tokenClient.requestAccessToken({ prompt: "" });
  });
}

export interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink: string;
}

/** Uploads a Blob to the user's Google Drive root folder. */
export async function uploadToDrive(
  blob: Blob,
  fileName: string,
  accessToken: string,
  onProgress?: (percent: number) => void
): Promise<DriveUploadResult> {
  const metadata = {
    name: fileName,
    mimeType: blob.type || "video/webm",
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", blob);

  // XHR (not fetch) so we can report upload progress.
  return new Promise<DriveUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", DRIVE_UPLOAD_ENDPOINT);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error("Unexpected response from Google Drive"));
        }
      } else if (xhr.status === 401) {
        reject(new Error("Google authorization expired. Please try again."));
      } else {
        // Try to extract Google's human-readable error reason
        let detail = "";
        try {
          const body = JSON.parse(xhr.responseText);
          detail = body?.error?.message || "";
        } catch {
          /* ignore parse failures */
        }
        const hints: Record<number, string> = {
          403:
            "Check that: (1) the Google Drive API is ENABLED in your Google Cloud project, and (2) if your OAuth consent screen is in 'Testing' mode, your Google account is added as a Test user.",
        };
        reject(
          new Error(
            `Drive upload failed (${xhr.status}). ${detail} ${hints[xhr.status] ?? ""}`.trim()
          )
        );
      }
    };

    xhr.onerror = () => reject(new Error("Network error during Drive upload"));
    xhr.send(form);
  });
}
