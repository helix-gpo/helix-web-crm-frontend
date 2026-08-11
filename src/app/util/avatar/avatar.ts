import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
})
export class Avatar {
  name = input.required<string>();
  size = input<string>('4.4rem');

  readonly initials = computed(() => {
    const value = this.name().trim();
    if (!value) return '?';
    return value
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });
}
