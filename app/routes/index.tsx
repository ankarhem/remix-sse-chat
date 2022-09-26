import { faker } from '@faker-js/faker';
import {
  json,
  type DataFunctionArgs,
  type TypedResponse,
} from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
  useTransition,
} from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { dispatchMessage, type MessageData } from '~/events.server';
import { commitSession, getSession } from '~/session';

export const action = async ({ request }: DataFunctionArgs) => {
  const cookieHeaders = request.headers.get('Cookie');
  const session = await getSession(cookieHeaders);
  if (!session.has('username')) {
    return new Response(null, { status: 401 });
  }

  const formData = await request.formData();
  const message = formData.get('message');

  if (typeof message !== 'string') {
    return new Response('Invalid message', { status: 400 });
  }

  if (message.length < 1 || message.length > 280) {
    const errors = {
      message: 'Message must be between 1 and 280 characters',
    };
    return json({ errors });
  }

  dispatchMessage({
    username: session.get('username'),
    message,
    timestamp: new Date().getTime(),
  });
  return null;
};

export const loader = async ({
  request,
}: DataFunctionArgs): Promise<TypedResponse<{ username: string }>> => {
  const cookieHeader = request.headers.get('Cookie');
  const session = await getSession(cookieHeader);

  if (!session.has('username')) {
    const username = faker.internet.userName();
    session.set('username', username);

    return json(
      { username },
      {
        headers: {
          'Set-Cookie': await commitSession(session),
        },
      }
    );
  }

  return json({ username: session.get('username') });
};

const MessageForm = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const transition = useTransition();
  const data = useActionData();

  useEffect(() => {
    if (transition.state === 'submitting') {
      formRef.current?.reset();
    }
  }, [transition.state]);

  return (
    <Form method='post' ref={formRef}>
      <label style={{ display: 'block' }} htmlFor='message'>
        Message
      </label>
      <input
        type='text'
        name='message'
        minLength={1}
        maxLength={280}
        aria-describedby={data?.errors?.message ? 'message-error' : undefined}
      />
      <button type='submit'>Send</button>
      {data?.errors?.message ? (
        <span id='message-error' style={{ display: 'block', color: 'red' }}>
          {data.errors.message}
        </span>
      ) : null}
    </Form>
  );
};

export default function Index() {
  const [messages, setMessages] = useState<MessageData[]>([]);

  useEffect(() => {
    const eventSource = new EventSource('/sse/chat');

    const addMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data) as MessageData;
      console.log(messages);
      setMessages([data, ...messages]);
    };

    eventSource.addEventListener('message', addMessage);

    return () => {
      eventSource.removeEventListener('message', addMessage);
    };
  }, [messages]);

  const { username } = useLoaderData<typeof loader>();

  return (
    <>
      <h1>Remix SSE chat</h1>
      <h3>{username}</h3>
      <div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '600px 240px',
          }}
        >
          <div
            style={{
              height: '400px',
              overflow: 'auto',
              border: '1px solid gray',
              display: 'flex',
              flexDirection: 'column-reverse',
            }}
          >
            {messages.map((message, i) => {
              const date = new Date(message.timestamp);
              return (
                <p key={i} style={{ padding: '0', margin: '0.2rem' }}>
                  [{date.getHours()}:{date.getMinutes()}:{date.getSeconds()}]{' '}
                  {message.username}: {message.message}
                </p>
              );
            })}
          </div>
          {/* <div
            style={{
              height: '400px',
              overflow: 'auto',
              border: '1px solid gray',
            }}
          >
            list
          </div> */}
        </div>
        <MessageForm />
      </div>
    </>
  );
}
