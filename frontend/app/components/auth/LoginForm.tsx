import { FaLock } from 'react-icons/fa'

import { createForm } from 'remix-forms'
import { 
  Form as FrameworkForm, useActionData, useSubmit, useNavigation, Link 
} from '@remix-run/react'
import { z } from 'zod'

const Form = createForm({ component: FrameworkForm, useNavigation, useSubmit, useActionData })

export const schema = z.object({
  username: z.string().min(5).email(),
  password: z.string().min(3),
})

const LoginForm = () => {
  const navigation = useNavigation()

  const isSubmitting = navigation.state !== "idle"

  return (
    <Form
      schema={schema}
      method="post"
      className="form"
      id="auth-form"
      onTransition={
        ({reset, formState}) => {
            if ("_global" in formState.errors) {
            reset()
          }
        }
      }
    >
      {({ Field, Errors, Button, register }) => {
        return (
          <>
            <div className="icon-img">
              <FaLock />
            </div>
            <Errors />
            <Field name="username" label="E-mail">
              {({ Label, Errors, errors }) => (
                <>
                  <Label />
                  <input {...register('username')} type="email" id="email" required className={errors ? "input-error" : undefined}/> 
                  <Errors />
                </>
              )}
            </Field>
            <Field name="password" label="Password">
              {({ Label, Errors, errors }) => (
                <>
                  <Label />
                  <input {...register('password')} id="password" type="password" className={errors ? "input-error" : undefined}/>
                  <Errors />
                </>
              )}
            </Field>
            <div className="form-actions">
              <Button disabled={isSubmitting}>{isSubmitting ? "Authenticating ..." : "Login"}</Button>
              <Link to="/signin">Register</Link>
            </div>
          </>
        )
      }}
    </Form>
  )
}

export default LoginForm
