// Remix upload handler for file uploads, uses local file system
// Not used in the current setup

import {
  unstable_composeUploadHandlers,
  unstable_createFileUploadHandler,
  unstable_createMemoryUploadHandler,
} from '@remix-run/node';

import type { UploadHandler } from '@remix-run/node';
import fs from 'fs';
import path from 'path';

const standardFileUploadHandler = unstable_createFileUploadHandler({
  directory: './attachments',
  avoidFileConflicts: true,
});

const attachmentsUploadHandler: UploadHandler = async (args) => {
  if (args.name !== 'attachment' || !args.filename) return null;
  const file = await standardFileUploadHandler(args);
  if (!file) return null;
  if (typeof file === 'string') return file;
  return file.name;
};

export const uploadHandler = unstable_composeUploadHandlers(
  attachmentsUploadHandler,
  unstable_createMemoryUploadHandler(),
);

// export function deleteAttachment(fileName: string) {
//   const localPath = path.join(process.cwd(), 'attachments', fileName);
//   try {
//     fs.unlinkSync(localPath);
//   } catch (error) {
//     console.error(error);
//   }
// }


// This is interesting because we can fetch the file from private s3 bucket
// and serve it to the client. In the meantime we can check if the user own the file.
// However, it will not work for private images where the url needs to be provided.
export function buildFileResponse(fileName: string, headers = new Headers()): Response {
  const localPath = path.join(process.cwd(), 'attachments', fileName);
  try {
    const file = fs.readFileSync(localPath);
    headers.append('Content-Type', 'application/octet-stream');
    headers.append('Content-Disposition', `attachment; filename="${fileName}"`);
    return new Response(file, { headers });
  } catch (error) {
    console.error(error);
    return new Response('Not Found', { status: 404 });
  }
}
