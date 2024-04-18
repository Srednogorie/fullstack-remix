import { createCookieSessionStorage, redirect } from '@remix-run/node';

import { setVisitorCookieData } from '../visitors.server';
import axios from 'axios';
import { logger } from '~/logger.server';

// type UserRegistrationData = {
//   name: string;
//   email: string;
//   password: string;
// };

// export async function registerUser({ name, email, password }: UserRegistrationData): Promise<User> {
//   const hashedPassword = await bcrypt.hash(password, 10);
//   const sanitizedEmail = email.trim().toLowerCase();
//   const sanitizedName = name.trim();

//   const existingUser = await db.user.findUnique({
//     where: { email: sanitizedEmail },
//   });

//   if (existingUser) {
//     throw new Error(`A user with the email ${email} already exists.`);
//   }

//   try {
//     return db.user.create({
//       data: { name: sanitizedName, email: sanitizedEmail, password: hashedPassword },
//     });
//   } catch (error) {
//     console.error(error);
//     throw new Error('Unable to create user.');
//   }
// }

// type UserLoginData = {
//   email: string;
//   password: string;
// };

// export async function loginUser({ email, password }: UserLoginData): Promise<User> {
//   const sanitizedEmail = email.trim().toLowerCase();

//   const user = await db.user.findUnique({
//     where: { email: sanitizedEmail },
//   });

//   if (!user) {
//     throw new Error(`No user found for email: ${email}.`);
//   }

//   const passwordValid = await bcrypt.compare(password, user.password);

//   if (!passwordValid) {
//     throw new Error('Invalid password.');
//   }

//   return user;
// }

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set');
}

export const { getSession, commitSession, destroySession } = createCookieSessionStorage({
  cookie: {
    name: '_auth_session',
    // secure: process.env.NODE_ENV === 'production',
    secure: true,
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export async function createUserSession(userId: string, token: string, headers = new Headers()) {
  const session = await getSession();
  session.set('authToken', token);
  session.set('userId', userId);
  headers.set('Set-Cookie', await commitSession(session));
  return headers;
}

function getUserSession(request: Request) {
  return getSession(request.headers.get('Cookie'));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get('userId');
  if (!userId || typeof userId !== 'string') return null;
  return userId;
}

export async function requireUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get('userId');
  const authToken = session.get('authToken');
  if ((!userId || typeof userId !== 'string') || (!authToken || typeof authToken !== 'string')) {
    // Remove token
    axios.defaults.headers.common['Authorization'] = ''
    delete axios.defaults.headers.common['Authorization']
    // At this point the session shouldn't be available anyway!
    // What was the point of deleting the token twice. That was some kind of
    // unbelievable bug if the user decide to delete their token?
    // This needs to be removed.    
    await destroySession(session)
    const headers = await setVisitorCookieData({ redirectUrl: request.url });
    headers.append('Set-Cookie', await destroySession(session));
    throw redirect("/login", {headers})
  } else {
      // Configure axios token
      axios.defaults.headers.common['Authorization'] = `Bearer ${session.get("authToken")}`
      return userId
  }
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (typeof userId !== 'string') {
    return null;
  }

  try {
    const response = await axios.get("/users/me");
    return response.data;
  } catch(error) {
    // Sometimes we expect 401, so we don't want to throw logout
    if (error.response.status === 401) {
      return null
    }
    throw logout(request);
  }
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  try {
    await axios.post("/auth/bearer/logout")
  } catch (error) {
    logger.error("No logged in user to logout")
  }

  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  })
}
