import { Directive, ElementRef, computed, effect, inject, input } from '@angular/core';
import { EntityType, PermissionAction, PermissionKey } from '../../model/access';
import { Permissions } from './permissions';

const ENTITY_LABELS: Record<EntityType, string> = {
  TENANT: 'Mandanten',
  PROJECT: 'Projekte',
  MILESTONE: 'Meilensteine',
  INVOICE: 'Rechnungen',
  PARTNER: 'Ansprechpartner',
  TESTIMONIAL: 'Referenzen',
};

const ACTION_LABELS: Record<PermissionAction, string> = {
  READ: 'lesen',
  WRITE: 'bearbeiten',
  DELETE: 'löschen',
};

const BLOCKED_KEYS = ['Enter', ' ', 'ArrowUp', 'ArrowDown'];

@Directive({
  selector: '[appRequires]',
  host: { '[class.is-locked]': 'locked()', '[attr.aria-disabled]': 'locked()' },
})
export class RequiresPermission {
  private readonly permissions = inject(Permissions);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  // title set in the template as a plain attribute (title="Bearbeiten")
  private readonly staticTitle = this.element.getAttribute('title');

  readonly appRequires = input.required<PermissionKey>();

  // use instead of [title] when the normal tooltip is dynamic, otherwise both fight over the attribute
  readonly requiresTitle = input<string | null>(null);

  protected readonly locked = computed(() => !this.permissions.can(this.appRequires()));

  private readonly hint = computed(() => {
    const [entity, action] = this.appRequires().split(':') as [EntityType, PermissionAction];
    return `Keine Berechtigung: ${ENTITY_LABELS[entity]} ${ACTION_LABELS[action]}`;
  });

  constructor() {
    // capture phase: runs before the element's own handlers, routerLink and inner buttons
    this.element.addEventListener('click', (event) => this.block(event), true);
    this.element.addEventListener(
      'keydown',
      (event) => {
        if (BLOCKED_KEYS.includes(event.key)) {
          this.block(event);
        }
      },
      true,
    );

    effect(() => {
      const title = this.locked() ? this.hint() : (this.requiresTitle() ?? this.staticTitle);
      if (title) {
        this.element.setAttribute('title', title);
      } else {
        this.element.removeAttribute('title');
      }
    });
  }

  private block(event: Event): void {
    if (this.locked()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}
