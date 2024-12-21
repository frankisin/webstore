import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons/faStar';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.scss'], // Fixed: `styleUrls` not `styleUrl`
})
export class StarRatingComponent {
  faStar = faStar;

  @Input() rating: number = 0;
  @Input() readonly: boolean = false;

  setRating(value: number): void {
    if (this.readonly) return;
    this.rating = value;
  }
}
