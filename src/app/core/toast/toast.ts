import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastMessage } from './toast-message';

@Injectable({ providedIn: 'root' })
export class Toast {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.openFromComponent(ToastMessage, {
      data: { message, type: 'success' },
      duration: 3000,
      panelClass: ['app-toast', 'app-toast--success'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }

  error(message: string): void {
    this.snackBar.openFromComponent(ToastMessage, {
      data: { message, type: 'error' },
      duration: 4000,
      panelClass: ['app-toast', 'app-toast--error'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }
}
