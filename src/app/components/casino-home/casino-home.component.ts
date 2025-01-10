import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { CasinoService } from '../../services/casinoservice.service';
@Component({
  selector: 'app-casino-home',
  standalone: true,
  imports: [NavbarComponent,FormsModule,CommonModule],
  templateUrl: './casino-home.component.html',
  styleUrl: './casino-home.component.css'
})
export class CasinoHomeComponent {

  author : String = 'Frank Velazquez'

  gameCategories = [
    {
      name: 'House Originals',
      games: [
        { dest: 'dice', name: 'Dice', imageUrl: 'https://mediumrare.imgix.net/30688668d7d2d48d472edd0f1e2bca0758e7ec51cbab8c04d8b7f157848640e0?&dpr=2&format=auto&auto=format&q=50&w=167' },
        { dest: '', name: 'Crash', imageUrl: 'https://mediumrare.imgix.net/c830595cbd07b2561ac76a365c2f01869dec9a8fe5e7be30634d78c51b2cc91e?&dpr=2&format=auto&auto=format&q=50&w=167' },
        { dest: 'plinko', name: 'Plinko', imageUrl: 'https://mediumrare.imgix.net/5cbb2498c956527e6584c6af216489b85bbb7a909c7d3c4e131a3be9bd1cc6bf?&dpr=2&format=auto&auto=format&q=50&w=167' },
        { dest: '', name: 'Mines', imageUrl: 'https://mediumrare.imgix.net/15a51a2ae2895872ae2b600fa6fe8d7f8d32c9814766b66ddea2b288d04ba89c?&dpr=2&format=auto&auto=format&q=50' },
        { dest: '', name: 'Blackjack', imageUrl: 'https://mediumrare.imgix.net/5fcbd552a53b9be85428ecd7fa0ef663f9d763bd8a504dd0de222bc873b79887?&dpr=2&format=auto&auto=format&q=50' },
        // Add more games as needed
      ]
    }
    // Add more categories as needed
  ];
  constructor(private router: Router) {}

  navigateToGame(gameName: string): void {
    const route = gameName.toLowerCase(); // Convert game name to lowercase for route matching
    this.router.navigate([route]);
  }


}
