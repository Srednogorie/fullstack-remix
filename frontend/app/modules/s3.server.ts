import { unstable_composeUploadHandlers, unstable_createMemoryUploadHandler } from "@remix-run/node";

import AWS from "aws-sdk";
// import { PassThrough } from "stream";
import type { UploadHandler } from "@remix-run/node";

const { STORAGE_ACCESS_KEY, STORAGE_SECRET, STORAGE_REGION, STORAGE_BUCKET } = process.env;

if (!(STORAGE_ACCESS_KEY && STORAGE_SECRET && STORAGE_REGION && STORAGE_BUCKET)) {
  throw new Error(`Storage is missing required configuration.`);
}

// Set of functions to interact with AWS S3
// Not used in the current setup

export const deleteFile = ({ Key }: Pick<AWS.S3.Types.PutObjectRequest, "Key">) => {
    try {
        const s3 = new AWS.S3({
            credentials: {accessKeyId: STORAGE_ACCESS_KEY, secretAccessKey: STORAGE_SECRET},
            region: STORAGE_REGION,
        });
        s3.deleteObject({ Bucket: STORAGE_BUCKET, Key }, (err, data) => {
            if (err) {
                console.error(err);
            }
            console.log(data);
        });
    } catch (error) {
      console.error(error);
    }
  }

// const uploadStream = ({ Key }: Pick<AWS.S3.Types.PutObjectRequest, "Key">) => {
//   const s3 = new AWS.S3({
//     credentials: {accessKeyId: STORAGE_ACCESS_KEY, secretAccessKey: STORAGE_SECRET},
//     region: STORAGE_REGION,
//   });
//   const pass = new PassThrough();
//   return {
//     writeStream: pass,
//     promise: s3.upload(
//         { Bucket: STORAGE_BUCKET, Key, Body: pass, ACL: 'public-read', }
//     ).promise(),
//   };
// };

// export async function uploadStreamToS3(data: any, filename: string) {
//   const stream = uploadStream({Key: filename});
//   await writeAsyncIterableToWritable(data, stream.writeStream);
//   const file = await stream.promise;
//   return file.Location;
// }

export const s3UploadHandler: UploadHandler = async ({name, filename, data}) => {
    if (name !== "attachment") {
      if (filename) {
        const uploadedFileLocation = await uploadStreamToS3(data, filename!);
        return uploadedFileLocation;
    }
  }
  return undefined;
};

export const uploadHandler = unstable_composeUploadHandlers(
  s3UploadHandler,
  unstable_createMemoryUploadHandler(),
);