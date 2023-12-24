import { Link } from '@remix-run/react';
import styles from './NoteList.css';

const NoteList = ({notes}: {notes: [Note]}) =>{
  return (
    <ul id="note-list">
      {notes.map((note, index) => (
        <li key={note.id} className="note">
          <Link to={note.id.toString()}>
            <article>
              <header>
                <ul className="note-meta">
                  <li>#{note.id + 1}</li>
                </ul>
                <h2>{note.title}</h2>
              </header>
              <p>{note.content}</p>
            </article>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default NoteList

export function links() {
  return [{ rel: 'stylesheet', href: styles }];
}