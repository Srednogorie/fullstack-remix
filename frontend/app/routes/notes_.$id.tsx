import { LinksFunction, LoaderFunctionArgs, MetaFunction, json } from "@remix-run/node"
import { Link, useLoaderData } from "@remix-run/react"
import styles from "app/styles/note-details.css"

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
    const note: Note = await fetch(`https://0.0.0.0:8000/notes/${params.id}`)

    if (!note) {
        throw json({message: 'Not such ID - ' + params.id}, {status: 404})
    }

    return note
}

export const links: LinksFunction = () => [
    { rel: "stylesheet", href: styles },
  ];

// Data will be what the loader returns
export const meta: MetaFunction<typeof loader> = ({data}) => {
    return [{ title: data?.title }]
};