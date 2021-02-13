/**
 * A back-end for `@jsvfs/core` using MinIO's Amazon S3 compatible `minio` module.
 *
 * Snapshots and flushes can be limited by setting one or more globs in the `include` option. This limits
 * any potentially destructive behavior to just those blob names which match the given patterns. Flushes are disabled by
 * default and must be enabled by intentionally setting `flushEnabled` to true.
 *
 * If you're looking to create new adapters, please use `@jsvfs/types` and look to `@jsvfs/adapter-node-fs` as an example.
 * @packageDocumentation
 * @module @jsvfs/adapter-minio-s3
 */

export * from './src/MinioS3Adapter'
export * from './src/types'
