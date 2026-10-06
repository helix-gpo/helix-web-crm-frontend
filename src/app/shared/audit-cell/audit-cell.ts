import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { auditUserLabel } from '../audit-user';

@Component({
  selector: 'app-audit-cell',
  imports: [DatePipe],
  templateUrl: './audit-cell.html',
  styleUrl: './audit-cell.scss',
  host: { '[title]': 'user() ?? ""' },
})
export class AuditCell {
  readonly user = input<string | null>();
  readonly date = input<string | null>();

  protected readonly label = computed(() => auditUserLabel(this.user()));
}
