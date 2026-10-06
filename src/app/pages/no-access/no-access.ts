import { Component, inject } from '@angular/core';
import { Auth } from '../../core/auth/auth';

@Component({
  selector: 'app-no-access',
  imports: [],
  templateUrl: './no-access.html',
  styleUrl: './no-access.scss',
})
export class NoAccess {
  protected readonly auth = inject(Auth);
}
