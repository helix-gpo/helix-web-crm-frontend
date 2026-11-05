import { MAX_IMAGE_SIZE_BYTES, validateImageFile } from './image-file';

function fileOf(sizeBytes: number, type: string): File {
  return new File([new Uint8Array(sizeBytes)], 'test', { type });
}

describe('validateImageFile', () => {
  it('accepts jpeg, png and webp up to the limit', () => {
    expect(validateImageFile(fileOf(1024, 'image/jpeg'))).toBeNull();
    expect(validateImageFile(fileOf(1024, 'image/png'))).toBeNull();
    expect(validateImageFile(fileOf(MAX_IMAGE_SIZE_BYTES, 'image/webp'))).toBeNull();
  });

  it('rejects files above 5 MB', () => {
    expect(validateImageFile(fileOf(MAX_IMAGE_SIZE_BYTES + 1, 'image/jpeg'))).toContain('5 MB');
  });

  it('rejects other file types', () => {
    expect(validateImageFile(fileOf(1024, 'image/gif'))).toContain('JPEG');
    expect(validateImageFile(fileOf(1024, 'application/pdf'))).toContain('JPEG');
  });
});
