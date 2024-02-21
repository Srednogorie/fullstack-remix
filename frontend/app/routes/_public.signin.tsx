import { type ActionFunction, type LinksFunction, type MetaFunction, redirect } from "@remix-run/node"
import authStyles from "../styles/auth.css"
import SigninForm, {schema} from "../components/auth/SigninForm"
import { makeDomainFunction } from 'domain-functions'
import axios from "axios"
import { performMutation } from "remix-forms"
import { z } from "zod"

export default function PricingPage() {
  return (
    <SigninForm/>
  )
}

type mutationProps = {
  username: string,
  password: string,
  repeatPassword: string,
}

const mutation = makeDomainFunction(
  schema.superRefine((data, ctx) => {
    if (data.password !== data.repeatPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        fatal: true,
        message: "What are you doing",
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["repeatPassword"],
        fatal: true,
        message: "What the hell is going on!",
      });
    }
  })
)(async (values: mutationProps) => {
  const submitValues = {
    "email": values.username, "password": values.password, "confirm_password": values.repeatPassword
  }
  try {
    const response = await axios.post("/auth/register", submitValues, {
      headers: {"Content-Type": "application/json"}
    })
    return response.data
  } catch(error) {
    throw "Something with the registration isn't right"
    // Handle backend errors
    // if (isAxiosError(error)) {
    //   if (error.response != undefined) {  
    //     if (error.response.data.detail === 'LOGIN_BAD_CREDENTIALS') {
    //       // throw new InputError('Email already taken', 'username')
    //       throw 'Wrong email or password'
    //       // throw new Error('Wrong credentials')
    //     }
    //   }
    // }
  }
})

export const action: ActionFunction = async ({ request }) => {
  const result = await performMutation({ request, schema, mutation })
  if (result.success) {
    return redirect("/login")
  } else {
    return result
  }
}

export const links: LinksFunction = () => [
  {rel: 'stylesheet', href: authStyles}
]

export const meta: MetaFunction = () => {
  return [
    { title: "Register Page" },
    { name: "description", content: "Register page" },
  ]
}
