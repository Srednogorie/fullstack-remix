import { LoaderFunctionArgs, redirect } from "@remix-run/node";

import axios from "axios";
import { createUserSession } from "~/modules/session/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const response = await axios.get('https://localhost:8000/auth/bearer/google/callback', {
        params: {
            state: searchParams.get('state'),
            code: searchParams.get('code'),
            scope: searchParams.get('scope'),
            authuser: searchParams.get('authuser'),
            prompt: searchParams.get('prompt')
        },
    });

    // Return the response data to the client
    return redirect('/complete', {
        headers: await createUserSession(
            response.data.user_id,
            response.data.access_token
        ),
    });
}

export default loader;