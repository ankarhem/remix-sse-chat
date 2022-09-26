import { createCookieSessionStorage } from '@remix-run/node'; // or cloudflare/deno

export const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: '__session',
      // expires: new Date(Date.now() + 60_000),
      httpOnly: true,
      // maxAge: ,
      path: '/',
      sameSite: 'lax',
      secrets: ['turb0-s3cur3-s3cr3t'],
      secure: true,
    },
  });
