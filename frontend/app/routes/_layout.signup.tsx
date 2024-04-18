import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';

import { Button } from '~/components/buttons';
import { Card } from '~/components/containers';
import { Form, Input } from '~/components/forms';
import { H1 } from '~/components/headings';
import { InlineError } from '~/components/texts';
import { getUserId } from '~/modules/session/session.server';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRemixForm, getValidatedFormData } from "remix-hook-form";
import { z } from 'zod';
import axios, { isAxiosError } from 'axios';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useEffect, useState } from 'react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Sign Up | BeeRich' },
    { name: 'description', content: 'Sign up for a BeeRich account to track your expenses and income.' },
  ];
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // const formData = await request.formData();
  const { errors, data, receivedValues: defaultValues } = await getValidatedFormData<FormData>(request, resolver);
  // const { errors, data } = await validateFormData<FormData>(formData, resolver);
  if (errors) {
    // const defaultValues = await parseFormData(formData);
    return json({ errors, defaultValues });
  }

  const submitValues = {
    "email": data.email,
    "username": data.username,
    "password": data.password,
    "confirm_password": data.confirmPassword
  }

  try {
    // The register endpoint accepts only JSON
    const response = await axios.post("/auth/register", submitValues, {
      headers: {"Content-Type": "application/json"}
    })
    try {
      await axios.post("/auth/request-verify-token", {"email": response.data.email}, {
        headers: {"Content-Type": "application/json"}
      })
      return redirect('/confirm-email');
    } catch(error) {
      // Most probably something went wrong message
    }
  } catch(error) {
    // TODO: Handle backend errors and set default as toast possibly
    // or global form error ....
    if (isAxiosError(error)) {
      if (error.response != undefined) {  
        if (error.response.data.detail === 'LOGIN_BAD_CREDENTIALS') {
          return json({ 
            errors: {
                email: {
                    message: 'Email is already taken.'
                }
            }
          })
        } else if (error.response.data.detail === 'REGISTER_USER_ALREADY_EXISTS') {
          return json({ 
            errors: {
                email: {
                    message: 'Email is already taken.'
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
  username: z.string().min(5),
  email: z.string().min(5).email(),
  password: z.string().min(3),
  confirmPassword: z.string().min(3),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      fatal: true,
      message: "Passwords should match!",
    });
  }
})
type FormData = z.infer<typeof schema>;

const resolver = zodResolver(schema);


export default function Component() {
  const isPrimary = true;
  // const actionData = useActionData();
  const { authorizationUrl } = useLoaderData();
  const navigate = useNavigate();

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

  const [intervalId, setIntervalId] = useState(null);

  // TODO: Add a check for user authentication
  useEffect(() => {
      let res;
      const id = setInterval(async () => {
        res = await axios.get("/auth")
        if (res.data.authenticated === true) {
            clearInterval(id);
            navigate('/dashboard')
        }
      }, 5000)

      setIntervalId(id as unknown as null);

      return () => {
          if (intervalId) {
              clearInterval(intervalId);
          }
      };
  }, []);
  

  return (
    <Card>
      <Form onSubmit={methods.handleSubmit} method='POST'>
        <H1>Sign Up</H1>
        <Input label="Name:" className={errors.username ? ' input-error' : undefined} type="text" {...methods.register("username")}/>
        {errors.username && (<p>{errors.username.message}</p>)}
        <Input label="Email:" className={errors.email ? ' input-error' : undefined} type="email" {...methods.register("email")} />
        {errors.email && (<p>{errors.email.message}</p>)}
        <Input label="Password:" className={errors.password ? ' input-error' : undefined} type="password" {...methods.register("password")} />
        {errors.password && (<p>{errors.password.message}</p>)}
        <Input label="Confirm Password:" className={errors.confirmPassword ? ' input-error' : undefined} type="password" {...methods.register("confirmPassword")} />
        {errors.confirmPassword && (<p>{errors.confirmPassword.message}</p>)}

        <Button disabled={methods.formState.isSubmitting} type="submit" isPrimary={isPrimary}>
          {methods.formState.isSubmitting ? 'Signing you up...' : 'Sign up!'}
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
