# JSVFS Adapter: Azure Blob

The official adapter for [`@jsvfs/core`](https://ahuggins-nhs.github.io/jsvfs/modules/_jsvfs_core.html) using Microsoft's [`@azure/storage-blob`](https://github.com/Azure/azure-sdk-for-js/tree/master/sdk/storage/storage-blob) module with block blobs as the back-end.

Allows a developer to set either a storage account or a blob container as the root of the adapter. When the root is a
storage account, the first name in a path will be parsed as the container name, with the remaining part of the path
considered the blob name. When a container is the root, all file paths are considered a blob name.

Additionally, snapshots and flushes can be limited by setting one or more globs in the `include` option. This limits
any potentially destructive behavior to just those blob names which match the given patterns. Flushes are disabled by
default and must be enabled by intentionally setting `flushEnabled` to true.

If you're looking to create new adapters, please use [`@jsvfs/types`](https://ahuggins-nhs.github.io/jsvfs/modules/_jsvfs_types.html) and look to [`@jsvfs/adapter-node-fs`](https://ahuggins-nhs.github.io/jsvfs/modules/_jsvfs_adapter_node_fs.html) as an example.

## Supported Features

- Async commits
- Pass-through reads
- Snapshots
- Flush
- Journaling

## Installation

Get it from [npm](https://www.npmjs.com/package/@jsvfs/adapter-azure-blob):
```shell
npm install --save @jsvfs/adapter-azure-blob
```

### Usage

This adapter requires either an account connection string or the storage account and storage key in order to work.

```TypeScript
import { AzureBlobAdapter } from '@jsvfs/adapter-azure-blob'

const adapter = new AzureBlobAdapter({ access: { connectionString: process.env.MY_CONNECTION_STRING } })
```

## Documentation

Complete documentation of `jsvfs` can be found at the [jsvfs site](https://ahuggins-nhs.github.io/jsvfs/).
