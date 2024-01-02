import { LinksFunction, LoaderFunctionArgs, MetaFunction, json } from "@remix-run/node"
import { Link, useLoaderData } from "@remix-run/react"
import styles from "app/styles/note-details.css"
import axios from "axios"

export default function NoteDetailPage() {
    const note: Note = useLoaderData()
    return (
        <main id="note-details">
            <header>
                <nav>
                    <Link to={"/notes"}>Back to all notes</Link>
                </nav>
                <h1>{note.title}</h1>
            </header>
            <p id="note-details-content">{note.content}</p>
        </main>
    )
}

export async function loader({params}: LoaderFunctionArgs) {
    const note: Promise<Note> = axios.get(`/notes/${params.id}`)
        .then((data) => data.data)
        .catch((error) => {
            // This will trigger the catch boundary
            throw json({message: `Loader exception ${error}`}, {status: 404})
        })

    return note
}

export const links: LinksFunction = () => [
    { rel: "stylesheet", href: styles },
  ];

// Data will be what the loader returns
export const meta: MetaFunction<typeof loader> = ({data}) => {
    return [{ title: data?.title }]
};