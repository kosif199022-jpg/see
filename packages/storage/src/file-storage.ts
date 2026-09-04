export type StoredFile = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  checksum: string;
};

export interface FileStorage {
  put(file: StoredFile): Promise<string>;
  get(id: string): Promise<StoredFile | null>;
}
