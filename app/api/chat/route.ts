import { openai } from "@ai-sdk/openai";
import { vertex } from "@ai-sdk/google-vertex";
import { convertToCoreMessages, streamText } from "ai";
import { z } from "zod";

const TIME_API_URL = "https://worldtimeapi.org/api/ip";

export const POST = async (request: Request) => {
  const model = openai("gpt-4o");
  //  vertex("gemini-1.5-pro-002");
  try {
    const { messages } = await request.json();

    const result = streamText({
      model,
      messages: convertToCoreMessages(messages),
      tools: {
        checktime: {
          description: "Get the current time based on the user's IP address",
          parameters: z.object({}),
          execute: async ({ abortSignal }) => {
            const response = await fetch(TIME_API_URL, { signal: abortSignal });

            if (!response.ok) {
              throw new Error('Failed to fetch time data');
            }
            const data = await response.json();
            const time = new Date(data.datetime);
            console.log("checktime", time.toLocaleTimeString());
            return {
              content: `The current time is ${time.toLocaleTimeString()}`
            }
          },
        },
      },
    });

    return result.toDataStreamResponse();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
