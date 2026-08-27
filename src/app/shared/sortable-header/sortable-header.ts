import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SortDirection } from '../../util/sortable/sortable';

@Component({
  selector: 'app-sortable-header',
  imports: [],
  templateUrl: './sortable-header.html',
  styleUrl: './sortable-header.scss',
})
export class SortableHeader {
  @Input() label = '';
  @Input() direction: SortDirection = null;
  @Output() clicked = new EventEmitter<void>();
}
