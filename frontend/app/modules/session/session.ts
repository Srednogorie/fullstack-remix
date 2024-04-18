import { useRouteLoaderData } from '@remix-run/react';

import type { loader } from '~/root';

export function useUser() {
  const data = useRouteLoaderData<typeof loader>('root');
  if (!data || !data.user) return null;
  const deserializedUser = {
    ...data.user,
    createdAt: new Date(data.user.createdAt),
    updatedAt: new Date(data.user.updatedAt),
  };
  return deserializedUser;
}
