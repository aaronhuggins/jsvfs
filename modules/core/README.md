# JSVFS Core: JavaScript Virtual File System

The core module for JS Virtual File System. Provides the main `VirtualFileSystem` class with just enough back-end to get started with in-memory file hierarchy.

## Installation

Get it from [npm](https://www.npmjs.com/package/@jsvfs/core):
```shell
npm install --save @jsvfs/core
```

## Supported adapters

Without an adapter which implements a persistent storage, the JS Virtual File System will simply be a non-persistent store. These are the officially supported adapters.

- Amazon S3-compatible [`@jsvfs/adapter-minio-s3`](https://ahuggins-nhs.github.io/jsvfs/modules/_jsvfs_adapter_minio_s3.html)
- Microsoft Azure Storage [`@jsvfs/adapter-azure-blob`](https://ahuggins-nhs.github.io/jsvfs/modules/_jsvfs_adapter_azure_blob.html)
- Multi-adapter [`@jsvfs/adapter-multi`](https://ahuggins-nhs.github.io/jsvfs/modules/_jsvfs_adapter_multi.html)
- Node's `fs` module [`@jsvfs/adapter-node-fs`](https://ahuggins-nhs.github.io/jsvfs/modules/_jsvfs_adapter_node_fs.html)
- Non-persistent noop [`@jsvfs/adapter-noop`](https://ahuggins-nhs.github.io/jsvfs/modules/_jsvfs_adapter_noop.html); this is included as the default adapter.

### Other adapters

Other adapters can be found using the keyword ["jsvfs adapter"](https://www.npmjs.com/search?q=keywords:jsvfs%20adapter).

### Using adapters

Adapters should be constructed first and passed to the `VirtualFileSystem` class when constructing it. Make sure to read the documentation closely for a given adapter so that it has the appropriate options for accessing and manipulating the persistent storage it implements.

```TypeScript
import { NodeFSAdapter } from '@jsvfs/adapter-node-fs'
import { VirtualFileSystem } from '@jsvfs/core'

const adapter = new NodeFSAdapter({ cwd: '/my/path/' })
const vfs = new VirtualFileSystem(adapter)
```

### Developing adapters

Work on complete documentation for writing adapters is coming. For now, start with the code for `@jsvfs/types` and read through the interface provided for adapters. Consider the Node `fs` adapter to be the reference implementation and take a look at how it implements the interface.

If the adapter implements a storage which is widely used, consider forking the jsvfs repository and contributing the adapter as a module. Assuming that this is the route you take, familiarity with TypeScript and Lerna are a must.

Otherwise, you can simply release your module on NPM or another package repository. If you'd like it to be discoverable relative to jsvfs, please use the keyword "jsvfs adapter" in your package.json.

## Documentation

Complete documentation of `jsvfs` can be found at the [jsvfs site](https://ahuggins-nhs.github.io/jsvfs/).
