import type { ActionFunctionArgs, LinksFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Form, Input } from '~/components/forms';
import axios, { isAxiosError } from 'axios';
import { createUserSession, getUserId } from '~/modules/session/session.server';
import { getValidatedFormData, useRemixForm } from 'remix-hook-form';
import { json, redirect } from '@remix-run/node';

import { Button } from '~/components/buttons';
import { Card } from '~/components/containers';
import { H1 } from '~/components/headings';
import { InlineError } from '~/components/texts';
import { getVisitorCookieData } from '~/modules/visitors.server';
import loginCSS from '~/styles/login.css';
import { useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

export const meta: MetaFunction = () => {
  return [
    { title: 'Log In | BeeRich' },
    { name: 'description', content: 'Log into your BeeRich account to track your expenses and income.' },
  ];
};

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: loginCSS }
];

export const action = async ({ request }: ActionFunctionArgs) => {
  const { errors, data, receivedValues: defaultValues } = await getValidatedFormData<FormData>(request, resolver); 
  if (errors) {
    // The keys "errors" and "defaultValue" are picked up automatically by useRemixForm
    return json({ errors, defaultValues });
  }

  const formData = new URLSearchParams({
    'username': data.email,
    'password': data.password,
  })


  try {
    const response = await axios.post("/auth/bearer/login", formData, {
      headers: {"Content-Type": "application/x-www-form-urlencoded"}
    })
    const { redirectUrl } = await getVisitorCookieData(request);
    return redirect(redirectUrl || '/dashboard', {
      headers: await createUserSession(
        response.data.user_id,
        response.data.access_token
      ),
    });
  } catch(error) {
    // TODO: Handle backend errors and set default as toast possibly
    // or global form error ....
    if (isAxiosError(error)) {
      if (error.response != undefined) {  
        if (error.response.data.detail === 'LOGIN_BAD_CREDENTIALS') {
          return json({ 
            errors: {
              email: {
                  message: 'Wrong email or password'
              },
              password: {
                message: 'Wrong email or password'
              }
            }
          })
        }
      }
    }
  }
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) {
    return redirect('/dashboard');
  }
  
  try {
    const response = await axios.get("/auth/bearer/google/authorize")
    const authorizationUrl = response.data.authorization_url;

    return { authorizationUrl };
  } catch(error) {
    // Most probably something went wrong message
  }
  return {};
}


export const schema = z.object({
  email: z.string().min(5).email(),
  password: z.string().min(3),
})
type FormData = z.infer<typeof schema>;

const resolver = zodResolver(schema);

export default function Component() {
  const isPrimary = true;

  const { authorizationUrl } = useLoaderData();

  const methods = useRemixForm<FormData>({ mode: "onTouched", resolver });
  const { errors } = methods.formState;

  const googleAuth = async () => {
    // Calculate the position of the center of the viewport
    const width = 400;
    const height = 500;
    const left = window.innerWidth / 2 - width / 2; // Adjust 175 based on the width of your popup
    const top = window.innerHeight / 2 - height / 2; // Adjust 125 based on the height of your popup

    window.open(
      `${authorizationUrl}`,
      'Authenticate with Google',
      `menubar=1,resizable=1,width=${width},height=${height},top=${top},left=${left}`
    );
  };
  return (
    <Card>
      <Form onSubmit={methods.handleSubmit}>
        <H1>Log In</H1>
        <Input label="Email:" className={errors.email ? ' input-error' : undefined} type="email" {...methods.register("email")} />
        {errors.email && (<p>{errors.email.message}</p>)}
        <Input label="Password:" className={errors.password ? ' input-error' : undefined} type="password" {...methods.register("password")} />
        {errors.password && (<p>{errors.password.message}</p>)}

        <Button disabled={methods.formState.isSubmitting} type="submit" isPrimary={isPrimary}>
          {methods.formState.isSubmitting ? 'Logging...' : 'Log In!'}
        </Button>
        <InlineError aria-live="assertive">{errors.root && errors.root.message}</InlineError>
      </Form>
        <div className="px-6 sm:px-0 max-w-sm">
          <button
            onClick={googleAuth}
            type="button"
            className="text-white w-full  bg-[#4285F4] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center justify-between dark:focus:ring-[#4285F4]/55 mr-2 mb-2"
          >
            <svg className="mr-2 -ml-1 w-4 h-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
            </svg>
            Continue with Google
            <div></div>
          </button>
        </div>
    </Card>
  );
}
