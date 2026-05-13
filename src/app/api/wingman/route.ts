import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      context?: string;
    };

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      system: `You are a witty AI wingman for Vibeely, a modern online chat platform.
Your job is to help users:
- Craft clever, genuine, and engaging opening messages
- Reply better when they're stuck
- Keep conversations flowing naturally
- Be their hype man without being cringe
- Give ideas to unfamiliar topics
- Help them find common ground with their match

${context && context !== 'No messages yet.' ? `Recent conversation:\n${context}` : 'The conversation just started — help them make a great first impression.'}

Keep suggestions short (2-4 sentences max), fun, and authentic. Never be creepy or overly forward. Reply only with the suggestion itself, no meta-commentary like "Here's a suggestion:".`,
      messages,
    });

    return new Response(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isQuota =
      msg.includes('quota') ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('429');
    return new Response(
      JSON.stringify({ error: isQuota ? 'quota' : msg }),
      {
        status: isQuota ? 429 : 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

