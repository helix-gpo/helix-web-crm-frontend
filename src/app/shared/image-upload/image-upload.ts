import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Toast } from '../../core/toast/toast';

@Component({
  selector: 'app-image-upload',
  imports: [],
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.scss',
})
export class ImageUpload {
  private readonly toast = inject(Toast);

  @Input() imageUrl: string | null | undefined = null;
  @Input() placeholderIcon = 'image';
  @Input() shape: 'circle' | 'square' = 'square';
  @Input() uploading = false;

  @Output() fileSelected = new EventEmitter<File>();
  @Output() removed = new EventEmitter<void>();

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('Die Datei ist zu groß - maximal 5 MB erlaubt.');
      input.value = '';
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.toast.error('Nur JPEG-, PNG- oder WebP-Bilder sind erlaubt.');
      input.value = '';
      return;
    }

    this.fileSelected.emit(file);
    input.value = ''; // gleiche Datei erneut wählbar machen
  }

  remove(event: Event): void {
    event.stopPropagation();
    this.removed.emit();
  }
}
