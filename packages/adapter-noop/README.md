# JSVFS Adapter: No-op

The default adapter for `jsvfs`. Useful for testing or for using `jsvfs` purely in-memory with no access to persistent storage.

If you're looking to use `jsvfs`, it's probably best to start with `@jsvfs/core`.

This module is the default noop backend for `jsvfs` and already imported if you have installed `@jsvfs/core`.

If you're looking to create new adapters, please use `@jsvfs/types` and look to [`@jsvfs/adapter-node-fs`](https://ahuggins-nhs.github.io/jsvfs/modules/_jsvfs_adapter_node_fs.html) as an example.

## Supported Features

- Async commits: nope.
- Pass-through reads: nada.
- Snapshots: nay.
- Flush: nein.
- Journaling: 番号

😀 Because everything is a no-op!

## Installation

Get it from [npm](https://www.npmjs.com/package/@jsvfs/adapter-noop):
```shell
npm install --save @jsvfs/adapter-noop
```

## Documentation

Complete documentation of `jsvfs` can be found at the [jsvfs site](https://ahuggins-nhs.github.io/jsvfs/).
