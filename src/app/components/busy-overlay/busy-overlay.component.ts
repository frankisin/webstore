import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';  // Import CommonModule for the async pipe
import { LoadingService } from '../../services/loadingService';

@Component({
  selector: 'app-busy-overlay',
  templateUrl: './busy-overlay.component.html',
  styleUrls: ['./busy-overlay.component.css'],
  standalone: true,
  imports: [CommonModule]  // Import CommonModule here
})
export class BusyOverlayComponent {
  isLoading$ = this.loadingService.isLoading$;

  constructor(private loadingService: LoadingService) {}
}
