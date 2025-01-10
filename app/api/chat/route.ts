import { ToolInvocation, convertToCoreMessages, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolInvocations?: ToolInvocation[];
}

export async function POST(request: Request) {
  try {
    const { messages }: { messages: Message[] } = await request.json();

    const result = streamText({
      model: openai("gpt-4o"),
      system: "You are a helpful assistant that can get the current time based on the user's IP address",
      messages: convertToCoreMessages(messages),
      tools: {
        checktime: {
          description: "Get the current time based on the user's IP address",
          parameters: z.object({}),
          execute: async () => {
            const time = new Date();
            console.log("checktime", time.toLocaleTimeString());
            return `The current time is ${time.toLocaleTimeString()}`;
          },
        },
      },
    });

    return result.toDataStreamResponse();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
