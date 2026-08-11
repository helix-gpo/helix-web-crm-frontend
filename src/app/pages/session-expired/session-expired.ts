import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-session-expired',
  imports: [],
  templateUrl: './session-expired.html',
  styleUrl: './session-expired.scss',
})
export class SessionExpired {
  private readonly router = inject(Router);

  backToStart(): void {
    this.router.navigate(['/']);
  }
}
