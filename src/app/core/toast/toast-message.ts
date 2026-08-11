import { Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

export interface ToastData {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-toast-message',
  imports: [],
  template: `
    <div class="toast-row">
      <span class="material-symbols-rounded toast-icon">
        {{ data.type === 'error' ? 'error' : 'check_circle' }}
      </span>
      <span class="toast-text">{{ data.message }}</span>
    </div>
  `,
  styles: [
    `
      .toast-row {
        display: flex;
        align-items: center;
        gap: 1.2rem;
      }
      .toast-icon {
        font-size: 2.2rem;
        flex-shrink: 0;
      }
      .toast-text {
        font-size: 1.4rem;
        font-weight: 500;
      }
    `,
  ],
})
export class ToastMessage {
  protected readonly data = inject<ToastData>(MAT_SNACK_BAR_DATA);
}
