import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/auth/auth';

@Component({
  selector: 'app-welcome',
  imports: [RouterLink],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss',
})
export class Welcome {
  protected readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly features = [
    {
      icon: 'apartment',
      title: 'Mandantenverwaltung',
      description: 'Alle Kundendaten, Ansprechpartner und Kontakte zentral an einem Ort.',
    },
    {
      icon: 'work',
      title: 'Projektsteuerung',
      description: 'Projekte, Status und Meilensteine im Blick – vom Lead bis zum Abschluss.',
    },
    {
      icon: 'receipt_long',
      title: 'Rechnungen & E-Rechnung',
      description: 'Meilensteine abrechnen, Rechnungen erstellen, lückenlos und rechtskonform.',
    },
    {
      icon: 'rate_review',
      title: 'Referenzen',
      description: 'Kundenstimmen einholen, prüfen und direkt auf der Website veröffentlichen.',
    },
  ];

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.router.navigate(['/tenants']);
      }
    });
  }
}
