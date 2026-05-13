import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const BLOCKED_REQUEST_PATTERNS = [
  /\bsex(?:y|ual)?\b/i,
  /\bnude|nudes|naked\b/i,
  /\bdirty talk\b/i,
  /\bpervert(?:ed)?\b/i,
  /\bfetish\b/i,
  /\bhorny\b/i,
  /\bturn(?:ing)? (?:me|them) on\b/i,
  /\bmake (?:it|this) (?:hot|sexual|dirty)\b/i,
  /\bseduce|seduction\b/i,
  /\bnsfw\b/i,
  /\bflirt sexually\b/i,
  /\bexplicit\b/i,
];

const FILTER_RESPONSE =
  "I can't help with sexual or explicit messages. I can help you write something playful, respectful, and genuine instead.";

function containsBlockedContent(input: string) {
  return BLOCKED_REQUEST_PATTERNS.some((pattern) => pattern.test(input));
}

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      context?: string;
    };

    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === 'user')
      ?.content;

    const contentToScreen = [latestUserMessage, context]
      .filter(Boolean)
      .join('\n');

    if (contentToScreen && containsBlockedContent(contentToScreen)) {
      return new Response(FILTER_RESPONSE, {
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

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

Safety rules:
- Do not help with sexual, explicit, pornographic, fetish, or creepy messages.
- If a user asks for that kind of help, refuse briefly and redirect to playful, respectful, non-explicit conversation.
- Keep the tone safe for a mainstream dating or social app.

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

