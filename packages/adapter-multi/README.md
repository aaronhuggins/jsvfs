# JSVFS Adapter: Multi Adapter

The official adapter for [`@jsvfs/core`](https://ahuggins-nhs.github.io/jsvfs/modules/_jsvfs_core.html) using multiple other adapters.

If you're looking to create new adapters, please use [`@jsvfs/types`](https://ahuggins-nhs.github.io/jsvfs/modules/_jsvfs_types.html) and look to [`@jsvfs/adapter-node-fs`](https://ahuggins-nhs.github.io/jsvfs/modules/_jsvfs_adapter_node_fs.html) as an example.

## Supported Features

So long as other adapters support these features, this adapter supports:

- Async commits
- Pass-through reads
- Journaling

This adapter does not support:

- Snapshots
- Flush

## Installation

Get it from [npm](https://www.npmjs.com/package/@jsvfs/adapter-multi):
```shell
npm install --save @jsvfs/adapter-multi
```

### Usage

This adapter requires other adapters. After creating an instance, register other adapters to use them together.

```TypeScript
import { MultiAdapter } from '@jsvfs/adapter-multi'
import { MinioS3Adapter } from '@jsvfs/adapter-minio-s3'
import { NodeFSAdapter } from '@jsvfs/adapter-node-fs'

const adapter = new MultiAdapter()

adapter.register(new NodeFSAdapter({ cwd: '/tmp' }))
adapter.register(new MinioS3Adapter({
  access: {
    endPoint: 'localhost',
    port: 4568,
    useSSL: false,
    accessKey: 'S3RVER',
    secretKey: 'S3RVER'
  }
}))
```

## Documentation

Complete documentation of `jsvfs` can be found at the [jsvfs site](https://ahuggins-nhs.github.io/jsvfs/).
