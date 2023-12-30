import NewNote, {links as newNoteLinks} from "~/components/NewNote"
import NoteList, {links as noteListLinks} from "~/components/NoteList"
import { json, redirect, type LinksFunction } from "@remix-run/node"
import type { ActionFunctionArgs } from "@remix-run/node"
import { 
  isRouteErrorResponse, useActionData, useLoaderData, useRouteError 
} from "@remix-run/react"
import axios from "axios"

export default function NotesPage() {
    const notes = useLoaderData<typeof loader>()
    const actionData = useActionData()
    const hasSucceeded = !!actionData?.data
    const hasFailed = !!actionData?.error
    console.log(hasSucceeded, hasFailed)
    return (
        <main>
            <NewNote/>
            <NoteList notes={notes}/>
        </main>
    )
}

export async function loader() {
    console.log(axios.defaults.baseURL)
    const notes: Promise<[Note]> = axios.get("/notes/")
      .then((data) => data.data)
      .catch((error) => {
        // This will trigger the catch boundary
        throw json({message: `Loader exception ${error}`}, {status: 404})
      })

    return notes
}

export async function action({request}: ActionFunctionArgs) {
    const formData: FormData = await request.formData()
    const noteData = Object.fromEntries(formData)

    // const title = formData.get("title")
    // const content = formData.get("content")


    // Basic validation
    if (noteData.title.trim().length < 5) {
        return json({ error: "Invalid title" })
    }
    // headers: {'X-Requested-With': 'XMLHttpRequest'}
    await axios.post("/notes", noteData, {
      headers: {'X-Requested-With': 'XMLHttpRequest'}
    })
      .then((data) => {
        return json({ success: true })
      })
      .catch((error) => {
        console.log(error)
        return json({ error: "Something's wrong" }, { status: 500 })
      })


    // await new Promise<void>((resolve, reject) => setTimeout(() => resolve(), 3000))

    return redirect("/notes")
}

export const links: LinksFunction = () =>   [
    ...newNoteLinks(), ...noteListLinks()
]

export function ErrorBoundary() {
    const error = useRouteError()
  
    // isRouteErrorResponse will catch
    if (isRouteErrorResponse(error)) {
      return (
        <div>
          <h1>Oops</h1>
          <p>Status: {error.status}</p>
          <p>{error.data.message}</p>
        </div>
      )
    }
  
    // Other errors go here, last resort for the route
    // Don't forget to typecheck with your own logic.
    // Any value can be thrown, not just errors!
    let errorMessage = "Unknown error"
    // if (isDefinitelyAnError(error)) {
    //   errorMessage = error.message;
    // }
  
    return (
      <div>
        <h1>Uh oh ...</h1>
        <p>Something went wrong - Notes.tsx</p>
        <pre>{errorMessage}</pre>
      </div>
    )
}
