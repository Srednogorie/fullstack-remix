import type { LoaderFunctionArgs } from '@remix-run/node';
import { requireUserId } from '~/modules/session/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
    // This doesn't work because isAuthenticated will redirect to /login
    // and we only need to make sure the user is authenticated.
    if (await requireUserId(request)) {
        return {"authenticated": true};
    }
    return {"authenticated": false};
}