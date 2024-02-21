import { type ActionFunction, type LinksFunction, type MetaFunction, redirect } from "@remix-run/node"
import authStyles from "../styles/auth.css"
import LoginForm, {schema} from "../components/auth/LoginForm"
import { makeDomainFunction } from 'domain-functions'
import axios, { isAxiosError } from "axios"
import { performMutation } from "remix-forms"
import { authSessionStorage } from "../cookies.server"

export default function PricingPage() {
  return (
    <LoginForm/>
  )
}

type mutationProps = {
  username: string,
  password: string,
}

const mutation = makeDomainFunction(schema)(async (values: mutationProps) => {
  try {
    const response = await axios.post("/auth/bearer/login", values, {
      headers: {"Content-Type": "application/x-www-form-urlencoded"}
    })
    return response.data
  } catch(error) {
    if (isAxiosError(error)) {
      if (error.response != undefined) {  
        if (error.response.data.detail === 'LOGIN_BAD_CREDENTIALS') {
          // throw new InputError('Email already taken', 'username')
          throw 'Wrong email or password'
          // throw new Error('Wrong credentials')
        }
      }
    }
  }
})

export const action: ActionFunction = async ({ request }) => {
  const result = await performMutation({ request, schema, mutation })

  // if (!result.success) {
  //   return json(result, 400);
  // }
  const session = await authSessionStorage.getSession(request.headers.get("Cookie"))
  if (result.success) {
    session.set("authToken", result.data.access_token)
  } else {
    return result
  }
  
  return redirect("/expenses", {
    headers: {
      "Set-Cookie": await authSessionStorage.commitSession(
        session
      )
    },
  })
}


export const links: LinksFunction = () => [
  {rel: 'stylesheet', href: authStyles}
]

export const meta: MetaFunction = () => {
  return [
    { title: "Login Page" },
    { name: "description", content: "Login page" },
  ]
}
