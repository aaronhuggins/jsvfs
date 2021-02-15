# JavaScript Virtual File System

A library `@jsvfs/core` and a set of modules for creating an in-memory (hence "virtual") representation of a file system and adapting that system to different back-end persistent stores.

## How does it work

The advantage is in consistent APIs for dealing with storage. Adapters provide a common set of APIs around their storage for the virtual file system to use. The virtual file system provides an efficient API on top of these adapters for ease of use.

The main module `@jsvfs/core` provides a class `VirtualFileSystem` that uses a noop back-end `@jsvfs/adapter-noop` by default. Other adapters can be passed when constructing this class, such as `@jsvfs/adapter-node-fs` to allow backing the virtual file system with local disk storage.

## Features

- Asynchronous Commit
  > Work with your files entirely in-memory; commit the file system when finished or as needed.
- Adapter Journal
  > Adapters must implement an array property `journal` containing any errors encountered. The journal can be accessed before finishing for recovery or other means.
- Pass-through Read
  > Read a file from persistent storage if it is not already in-memory. Supported by some adapters.
- Storage Snaphot
  > Snapshot the persistent storage into memory ahead of working with the files. Not available for all adapters.
- Storage Flush
  > Flushes the persistent storage on commit automatically, allowing for a clean write. Not available for all adapters.

## Why

For a lot of different reasons there was a need to have an in-memory representation of files, folders, and links, not the least of which was the ability to easily mockup different files. The main driver was the need to quickly switch the persistent storage of a particular application, wether it be a local file system, a cloud provider such as S3, or anything else.

Evaluating other solutions similar to this one, it was clear that there was no consistent API or modular approach. That's why `jsvfs` exists.

## A word about Node engines

Node 12.10.0 or higher is required to run the tests in this repository. Only certain modules in this monorepo depend on more recent features of Node, so it's not an overall requirement for using `jsvfs`.

## Documentation

Complete documentation of `jsvfs` can be found at the [jsvfs site](https://ahuggins-nhs.github.io/jsvfs/).
