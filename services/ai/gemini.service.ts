export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

const MODELS_TO_TRY = [
  { model: "gemini-2.5-flash", apiVersion: "v1beta" },
  { model: "gemini-2.0-flash", apiVersion: "v1" },
  { model: "gemini-2.0-flash", apiVersion: "v1beta" },
  { model: "gemini-1.5-flash", apiVersion: "v1" },
  { model: "gemini-1.5-flash", apiVersion: "v1beta" },
  { model: "gemini-1.5-flash-latest", apiVersion: "v1beta" },
  { model: "gemini-1.5-flash-8b", apiVersion: "v1beta" },
  { model: "gemini-1.5-pro", apiVersion: "v1" },
  { model: "gemini-1.5-pro", apiVersion: "v1beta" },
  { model: "gemini-1.5-pro-latest", apiVersion: "v1beta" },
];

export const geminiService = {
  chatCompletion: async (
    apiKey: string,
    messages: ChatMessage[],
    systemInstruction: string
  ): Promise<string> => {
    const errorsList: string[] = [];

    for (const attempt of MODELS_TO_TRY) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/${attempt.apiVersion}/models/${attempt.model}:generateContent?key=${apiKey.trim()}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: messages,
              systemInstruction: {
                parts: [
                  {
                    text: systemInstruction,
                  },
                ],
              },
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048,
              },
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          let parsedMsg = errText;
          try {
            const parsedErr = JSON.parse(errText);
            if (parsedErr?.error?.message) {
              parsedMsg = parsedErr.error.message;
            }
          } catch (_) {}
          throw new Error(`Status ${response.status}: ${parsedMsg}`);
        }

        const resData = await response.json();
        const contentText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!contentText) {
          throw new Error("Empty response from model");
        }

        return contentText;
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        console.warn(`Model ${attempt.model} on ${attempt.apiVersion} failed for chat:`, errMsg);
        errorsList.push(`${attempt.model} (${attempt.apiVersion}): ${errMsg}`);
      }
    }

    throw new Error(
      `All Gemini API models failed. Errors:\n${errorsList.join("\n")}`
    );
  },

  explainerCompletion: async (
    apiKey: string,
    messages: ChatMessage[],
    systemInstruction: string
  ): Promise<string> => {
    const errorsList: string[] = [];

    for (const attempt of MODELS_TO_TRY) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/${attempt.apiVersion}/models/${attempt.model}:generateContent?key=${apiKey.trim()}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: messages,
              systemInstruction: {
                parts: [
                  {
                    text: systemInstruction,
                  },
                ],
              },
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 8192,
              },
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          let parsedMsg = errText;
          try {
            const parsedErr = JSON.parse(errText);
            if (parsedErr?.error?.message) {
              parsedMsg = parsedErr.error.message;
            }
          } catch (_) {}
          throw new Error(`Status ${response.status}: ${parsedMsg}`);
        }

        const resData = await response.json();
        const contentText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!contentText) {
          throw new Error("Empty response from model");
        }

        return contentText;
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        console.warn(`Model ${attempt.model} on ${attempt.apiVersion} failed for explainer:`, errMsg);
        errorsList.push(`${attempt.model} (${attempt.apiVersion}): ${errMsg}`);
      }
    }

    throw new Error(
      `All Gemini API models failed. Errors:\n${errorsList.join("\n")}`
    );
  },
};
