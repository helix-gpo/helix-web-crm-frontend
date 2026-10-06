import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { auditUserLabel } from '../audit-user';

@Component({
  selector: 'app-audit-info',
  imports: [DatePipe],
  templateUrl: './audit-info.html',
  styleUrl: './audit-info.scss',
})
export class AuditInfo {
  readonly createdBy = input<string | null>();
  readonly createdAt = input<string | null>();
  readonly updatedBy = input<string | null>();
  readonly updatedAt = input<string | null>();
  readonly issuedBy = input<string | null>();
  readonly issuedAt = input<string | null>();

  // on creation updatedAt == createdAt, showing it twice would just be noise
  protected readonly showUpdated = computed(() => {
    const updated = this.updatedAt();
    const created = this.createdAt();
    if (!updated) {
      return false;
    }
    if (!created) {
      return true;
    }
    return Math.abs(new Date(updated).getTime() - new Date(created).getTime()) > 2000;
  });

  protected userLabel(user: string | null | undefined): string {
    if (!user) {
      return 'Unbekannt';
    }
    if (user === 'system') {
      return 'System (automatisch)';
    }
    return auditUserLabel(user);
  }
}
