import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Toast } from '../../core/toast/toast';
import { validateImageFile } from '../../util/validation/image-file';

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
    input.value = ''; // gleiche Datei erneut wählbar machen
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      this.toast.error(error);
      return;
    }
    this.fileSelected.emit(file);
  }

  remove(event: Event): void {
    event.stopPropagation();
    this.removed.emit();
  }
}
