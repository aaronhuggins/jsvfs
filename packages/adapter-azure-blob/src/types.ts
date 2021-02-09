/** Options to connect to an Azure Storage account by connection string. */
export interface AzureBlobConnectionString {
  /** If provided, the connection string is the only piece needed to access a storage account. */
  connectionString: string
}

/** Options to connect to an Azure Storage Account by account name and account key. */
export interface AzureBlobAccountAndKey {
  /** The name of the storage account. */
  storageAccount: string
  /** The key for the storage account. */
  storageKey: string
}

/** Options to construct an adapter instance. */
export interface AzureBlobAdapterOpts {
  /** The options to connect to and access an Azure Storage account. */
  access: AzureBlobAccountAndKey | AzureBlobConnectionString
  /** The file globs to apply to `snapshot` and `flush` operations. */
  include?: string[]
  /**
   * If no container is provided, or container is set to '/', then the storage account is considered root.
   * Providing any other valid string will be considered a container name, making the container the root.
   * See also [Microsoft's documentation](https://docs.microsoft.com/en-us/rest/api/storageservices/naming-and-referencing-containers--blobs--and-metadata#container-names)
   */
  container?: string
  /** Enable flushing the file system before commiting; defaults to false, since flush is a destructive operation. */
  flushEnabled?: boolean
}
