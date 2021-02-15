declare module 'minio/dist/main/helpers' {
  /** Check a bucket name to ensure it is a valid one. */
  export function isValidBucketName (bucketName: string): boolean
}
