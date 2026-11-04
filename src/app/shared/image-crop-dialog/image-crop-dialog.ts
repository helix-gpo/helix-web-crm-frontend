import {
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ImageCropDialogData {
  file: File;
}

const VIEWPORT = 280; // size of the crop square on screen in px
const OUTPUT = 512; // size of the uploaded image in px

@Component({
  selector: 'app-image-crop-dialog',
  templateUrl: './image-crop-dialog.html',
  styleUrl: './image-crop-dialog.scss',
})
export class ImageCropDialog implements OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<ImageCropDialog, File | undefined>);
  private readonly data = inject<ImageCropDialogData>(MAT_DIALOG_DATA);
  private readonly image = viewChild.required<ElementRef<HTMLImageElement>>('image');

  readonly viewport = VIEWPORT;
  readonly sourceUrl = URL.createObjectURL(this.data.file);

  private readonly naturalWidth = signal(0);
  private readonly naturalHeight = signal(0);
  readonly loaded = computed(() => this.naturalWidth() > 0);

  // scale = displayed px per source px. min shows the whole image, max allows a close crop
  readonly minScale = computed(() =>
    this.loaded() ? VIEWPORT / Math.max(this.naturalWidth(), this.naturalHeight()) : 1,
  );
  readonly maxScale = computed(() =>
    this.loaded() ? (VIEWPORT / Math.min(this.naturalWidth(), this.naturalHeight())) * 3 : 1,
  );

  readonly scale = signal(1);
  readonly offsetX = signal(0);
  readonly offsetY = signal(0);

  readonly displayWidth = computed(() => this.naturalWidth() * this.scale());
  readonly displayHeight = computed(() => this.naturalHeight() * this.scale());
  readonly transform = computed(
    () => `translate(calc(-50% + ${this.offsetX()}px), calc(-50% + ${this.offsetY()}px))`,
  );

  readonly saving = signal(false);
  private dragStart: { x: number; y: number; offsetX: number; offsetY: number } | null = null;

  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    this.naturalWidth.set(img.naturalWidth);
    this.naturalHeight.set(img.naturalHeight);
    this.fitWhole();
  }

  // logos are often wide - start with the whole logo visible instead of cutting it
  fitWhole(): void {
    this.scale.set(this.minScale());
    this.offsetX.set(0);
    this.offsetY.set(0);
  }

  setScale(value: number): void {
    this.scale.set(Math.min(this.maxScale(), Math.max(this.minScale(), value)));
    this.clampOffset();
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.setScale(this.scale() * (event.deltaY < 0 ? 1.05 : 0.95));
  }

  onPointerDown(event: PointerEvent): void {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.dragStart = {
      x: event.clientX,
      y: event.clientY,
      offsetX: this.offsetX(),
      offsetY: this.offsetY(),
    };
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragStart) return;
    this.offsetX.set(this.dragStart.offsetX + event.clientX - this.dragStart.x);
    this.offsetY.set(this.dragStart.offsetY + event.clientY - this.dragStart.y);
    this.clampOffset();
  }

  onPointerUp(): void {
    this.dragStart = null;
  }

  // the image moves freely inside the square, but never leaves a gap when it is larger
  private clampOffset(): void {
    const maxX = Math.abs(this.displayWidth() - VIEWPORT) / 2;
    const maxY = Math.abs(this.displayHeight() - VIEWPORT) / 2;
    this.offsetX.set(Math.max(-maxX, Math.min(maxX, this.offsetX())));
    this.offsetY.set(Math.max(-maxY, Math.min(maxY, this.offsetY())));
  }

  cancel(): void {
    this.dialogRef.close();
  }

  async confirm(): Promise<void> {
    this.saving.set(true);

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d')!;
    const ratio = OUTPUT / VIEWPORT;

    // white fill, so wide logos get a clean background instead of transparency
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    ctx.imageSmoothingQuality = 'high';

    const width = this.displayWidth() * ratio;
    const height = this.displayHeight() * ratio;
    const x = (VIEWPORT / 2 + this.offsetX()) * ratio - width / 2;
    const y = (VIEWPORT / 2 + this.offsetY()) * ratio - height / 2;
    ctx.drawImage(this.image().nativeElement, x, y, width, height);

    // browsers without webp encoding fall back to png - both are accepted by the backend
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.9),
    );
    this.saving.set(false);

    if (!blob) {
      this.dialogRef.close();
      return;
    }
    const extension = blob.type === 'image/webp' ? 'webp' : 'png';
    this.dialogRef.close(new File([blob], `logo.${extension}`, { type: blob.type }));
  }

  ngOnDestroy(): void {
    URL.revokeObjectURL(this.sourceUrl);
  }
}
