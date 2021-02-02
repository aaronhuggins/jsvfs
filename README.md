# JavaScript Virtual File System

A library `jsvfs` and a set of modules for creating an in-memory (hence "virtual") representation of a file system and adapting that system to different back-end persistent stores.

## Why

For a lot of different reasons there was a need to have an in-memory representation of files, folders, and links, not the least of which was the ability to easily mockup different files. The main driver was the need to quickly switch the persistent storage of a particular application, wether it be a local file system, a cloud provider such as S3, or anything else.

Evaluating other solutions similar to this one, it was clear that there was no consistent API or modular approach. That's why `jsvfs` exists.

## How does it work

The main module `@jsvfs/jsvfs` provides a class `VirtualFileSystem` that uses a noop back-end `@jsvfs/adapter-noop` by default. Other back-ends can be passed when constructing this class, such as `@jsvfs/adapter-node-fs` to allow backing the virtual fs with real storage.

- Before using the virtual file system, the class method `snapshot` can be used to pre-fill the vfs with data for an adapter which supports snapshotting.
- During the lifecycle of the application, synchronous methods can be called to manage the files, folders, and links of the vfs.
- When it makes sense, the class method `commit` can be called to persist any uncommitted changes in the vfs to persistent storage.
  > NOTE: If the adapter supports flushing the persistent storage, the back-end will be flushed (whatever that means for the particular adapter) before persisting the vfs.

## A word about engines

Node 12.10.0 or higher is required to run the tests in this repository. Only certain modules in this monorepo depend on more recent features of Node, so it's not an overall requirement for using `jsvfs`.

## Documentation

Complete documentation of `jsvfs` can be found at the [jsvfs site](https://ahuggins-nhs.github.io/jsvfs/).
