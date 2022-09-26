import type { LoaderFunction } from '@remix-run/node';
import { events, type MessageData } from '~/events.server';

export let loader: LoaderFunction = async ({ request }) => {
  if (!request.signal) return new Response(null, { status: 500 });

  return new Response(
    new ReadableStream({
      start(controller) {
        let encoder = new TextEncoder();
        let handleNewMessage = (data: MessageData) => {
          controller.enqueue(encoder.encode('event: message\n'));
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                ...data,
                timestamp: new Date().getTime(),
              })}\n\n`
            )
          );
        };

        let closed = false;
        let close = () => {
          if (closed) return;
          closed = true;

          events.removeListener('newMessage', handleNewMessage);
          request.signal.removeEventListener('abort', close);
          controller.close();
        };

        events.addListener('newMessage', handleNewMessage);
        request.signal.addEventListener('abort', close);
        if (request.signal.aborted) {
          close();
          return;
        }
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
      },
    }
  );
};
