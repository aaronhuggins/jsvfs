# JSVFS Adapter: Node fs

The official adapter for [`@jsvfs/core`](https://ahuggins-nhs.github.io/jsvfs/modules/_jsvfs_core.html) supporting Node's [`fs`](https://nodejs.org/api/fs.html) module as a back-end for `jsvfs`.

Allows a developer to define the current working directory that acts as the root of the adapter, and to enable the
`flush` functionality of the adapter. This second option is important, as flush in this adapter attempts to completely
remove all files and folders from the root of the adapter. To protect developers against accidentally destroying files,
this option defaults to `false` and must be intentionally enabled.

If you're looking to create new adapters, please use [`@jsvfs/types`](https://ahuggins-nhs.github.io/jsvfs/modules/_jsvfs_types.html) and look to this module as an example.

## Supported Features

- Async commits
- Pass-through reads
- Snapshots
- Flush
- Journaling

## Installation

Get it from [npm](https://www.npmjs.com/package/@jsvfs/adapter-node-fs):
```shell
npm install --save @jsvfs/adapter-node-fs
```

### Usage

This adapter requires no options, but it will bind by default to the current working directory of the process. Pass a directory in the `cwd` property to bind to that instead.

```TypeScript
import { NodeFSAdapter } from '@jsvfs/adapter-node-fs'

const adapter = new NodeFSAdapter({ cwd: '/tmp' })
```

## Documentation

Complete documentation of `jsvfs` can be found at the [jsvfs site](https://ahuggins-nhs.github.io/jsvfs/).
