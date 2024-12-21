import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import Phaser from 'phaser';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent {
  private game!: Phaser.Game;

  ngAfterViewInit(): void {
    
  }
}
