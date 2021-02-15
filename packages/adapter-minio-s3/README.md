# @jsvfs/adapter-minio-s3

An adapter for `@jsvfs/core` using MinIO's Amazon S3 compatible `minio` module.

Snapshots and flushes can be limited by setting one or more globs in the `include` option. This limits
any potentially destructive behavior to just those blob names which match the given patterns. Flushes are disabled by
default and must be enabled by intentionally setting `flushEnabled` to true.

If you're looking to create new adapters, please use `@jsvfs/types` and look to `@jsvfs/adapter-node-fs` as an example.

## Supported Features

- Async commits
- Pass-through reads
- Snapshots
- Flush
- Journaling

## Installation

Get it from npm:
```shell
npm install --save @jsvfs/adapter-minio-s3
```

### Usage

This adapter requires client options to be passed per [MinIO's documentation](https://docs.min.io/docs/javascript-client-api-reference.html#MinioClient_endpoint).

```TypeScript
import { MinioS3Adapter } from '@jsvfs/adapter-minio-s3'

const adapter = new MinioS3Adapter({
  access: {
    endPoint: 'localhost',
    port: 4568,
    useSSL: false,
    accessKey: 'S3RVER',
    secretKey: 'S3RVER'
  }
})
```

## Documentation

Complete documentation of `jsvfs` can be found at the [jsvfs site](https://ahuggins-nhs.github.io/jsvfs/).
