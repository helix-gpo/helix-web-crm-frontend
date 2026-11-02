import { Component, computed, input } from '@angular/core';

// shows "123 / 500" under long text fields, turns orange near and red at the limit
@Component({
  selector: 'app-char-counter',
  template: `<span
    class="char-counter"
    [class.char-counter--warn]="ratio() >= 0.9"
    [class.char-counter--full]="ratio() >= 1"
    >{{ length() }} / {{ max() }}</span
  >`,
  styles: `
    :host {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.4rem;
    }
    .char-counter {
      font-size: 1.1rem;
      color: var(--text-grey);
      font-variant-numeric: tabular-nums;
    }
    .char-counter--warn {
      color: #f5a623;
    }
    .char-counter--full {
      color: var(--toastr-error);
    }
  `,
})
export class CharCounter {
  readonly value = input<string | null | undefined>('');
  readonly max = input.required<number>();

  readonly length = computed(() => this.value()?.length ?? 0);
  readonly ratio = computed(() => this.length() / this.max());
}
