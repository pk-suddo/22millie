import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages, systemContext, apiKey, provider } = await req.json();

  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemContext }, ...messages],
        stream: true,
        max_tokens: 400,
        temperature: 0.7,
      }),
    });
    return new Response(res.body, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'messages-2023-12-15',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        system: systemContext,
        messages,
        stream: true,
        max_tokens: 400,
      }),
    });

    // Transform Anthropic SSE to OpenAI-compatible format
    const reader = res.body?.getReader();
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = decoder.decode(value).split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'content_block_delta' && data.delta?.text) {
                  const openAIFormat = JSON.stringify({
                    choices: [{ delta: { content: data.delta.text } }],
                  });
                  controller.enqueue(encoder.encode(`data: ${openAIFormat}\n\n`));
                }
                if (data.type === 'message_stop') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                }
              } catch {}
            }
          }
        }
        controller.close();
      },
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
  }

  return new Response('Provider not configured', { status: 400 });
}
