// ============================================================================
// SAVIA-OS FILE SYSTEM ABSTRACTION & CONTRACTS
// ============================================================================

export type FileType = 'folder' | 'file' | 'executable' | 'symlink';

export interface FileMetadata {
  id: string;
  name: string;
  type: FileType;
  iconType: string;
  sizeBytes?: number;
  sizeFormatted?: string;
  dateModified?: string;
  permissions?: string;
  owner?: string;
  group?: string;
  readonly?: boolean;
}

export interface IFileSystem {
  readFile(path: string): Promise<string | null>;
  writeFile(path: string, content: string, options?: { overwrite?: boolean }): Promise<boolean>;
  deleteFile(path: string): Promise<boolean>;
  createDirectory(path: string): Promise<boolean>;
  listDirectory(path: string): Promise<FileMetadata[]>;
  exists(path: string): Promise<boolean>;
  getChecksum(path: string): Promise<{ sha256: string; crc32: number } | null>;
}
