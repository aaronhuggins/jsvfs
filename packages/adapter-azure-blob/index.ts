/**
 * A back-end for `@jsvfs/core` using Microsoft's `@azure/storage-blob` module with block blobs.
 *
 * Allows a developer to set either a storage account or a blob container as the root of the adapter. When the root is a
 * storage account, the first name in a path will be parsed as the container name, with the remaining part of the path
 * considered the blob name. When a container is the root, all file paths are considered a blob name.
 *
 * Additionally, snapshots and flushes can be limited by setting one or more globs in the `include` option. This limits
 * any potentially destructive behavior to just those blob names which match the given patterns. Flushes are disabled by
 * default and must be enabled by intentionally setting `flushEnabled` to true.
 *
 * If you're looking to create new adapters, please use `@jsvfs/types` and look to `@jsvfs/adapter-node-fs` as an example.
 * @packageDocumentation
 * @module @jsvfs/adapter-azure-blob
 */

export * from './src/AzureBlobAdapter'
export * from './src/types'
