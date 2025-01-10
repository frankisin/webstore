import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { CasinoService } from '../../services/casinoservice.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { concatMap, of } from 'rxjs';

@Component({
  selector: 'app-casino',
  templateUrl: './dice.component.html',
  styleUrls: ['./dice.component.css'],
  imports: [CommonModule, FormsModule, NavbarComponent],
  standalone: true
})
export class DiceComponent implements OnInit {
  @ViewChild('diceCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sliderTrack', { static: false }) sliderTrackRef!: ElementRef<HTMLElement>;
  @ViewChild('sliderThumb', { static: false }) sliderThumbRef!: ElementRef<HTMLElement>;

  private ctx!: CanvasRenderingContext2D;

  // Game settings
  pinRadius = 3.5;
  ballRadius = 8;
  gravity = 0.35;
  bounceFactor = 0.65;
  dampingFactor = 0.97;
  biasStrength = 0.000155; //155 standard
  thresholdY!: number;
  boardHeightOffset: number = 120;
  ballSpawnHeight: number = 40
  scoreCardOffset: number = 80
  userBalance: number = 0;
  walletBalance: number = 0;
  lastMultiplier: number = 0;

  winnings: number = 0.0000;
  rollOver: number = 50.50;
  winChance: number = 49.5000;

  // Define a new property for the die position
  diePosition: number = 50; // Start at the center of the track
  maxMultiplier: number = 4;

  lastFourScores: { score: number; timeoutId: any }[] = []; // Array of objects for scores

  showStatistics = true; // Controls visibility of the statistics section

  rows: number = 8; // Default value for rows

  pins: { x: number; y: number; lastHit: number; cooldown: number }[] = [];
  balls: { x: number; y: number; dx: number; dy: number; lifetime: number }[] = [];
  bins: {
    x: number; // X-coordinate of the bin
    y: number; // Y-coordinate of the bin
    width: number; // Width of the bin
    height: number; // Height of the bin
    multiplier: number; // Multiplier value for the bin
    bounceOffset: number; // Offset for bounce animation
    isBouncing: boolean; // Whether the bin is currently bouncing 
  }[] = [];


  scoreCards: {
    x: number;
    y: number;
    width: number;
    height: number;
    multiplier: number;
    bounceOffset: number;
    bouncing: boolean;
    lastHit: number;
    cooldown: number;
  }[] = [];

  totalBallsSpawned = 0;

  lastTenRolls: { roll: number; isWin: boolean }[] = [];


  ripples: { x: number; y: number; radius: number; opacity: number }[] = [];
  animatedCards: number[] = [];
  multipliers = [1000, 130, 40, 10, 5, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 5, 10, 40, 130, 1000];
  betAmount: number = 0;
  riskLevel: string = 'low';
  multiplierTracker: Record<number, number> = {};

  multiplierStats: { multiplier: number; count: number; percentage: number }[] = [];

  private pinSound: HTMLAudioElement;
  private binSound: HTMLAudioElement;

  displayedMultipliers: { multiplier: number; color: string; timestamp: number }[] = [];
  multiplierDisplayTime = 3000; // Display time for each multiplier (ms)
  scoreDisplayDuration = 2000; // Duration (in ms) each score is displayed (e.g., 5000ms = 5 seconds)
  multiplierColors: { [key: number]: string } = {
    1000: "#FD0241", // Deep red
    130: "#FF5A3C", // Bright orange-red
    40: "#FF8133",  // Vibrant orange
    10: "#FFA41F",  // Bright golden-orange
    5: "#FFA41F",   // Deep yellow
    2: "#FFC300",   // Vivid yellow
    0.2: "#eddd00", // Bright pure yellow
  };

  rollValue: number = 50.00; // Initial roll value
  thumbPosition: number = 50; // Start thumb at the center
  isWin: boolean | null = null; // Track whether it's a win (true), loss (false), or no result (null)


  
  constructor(private casinoService: CasinoService, private router: Router, private snackBar: MatSnackBar) {
    this.multiplierTracker = {};
    this.multiplierStats = [];
    this.totalBallsSpawned = 0;
    // Load the sound
    this.pinSound = new Audio('/assets/casino/plinko/sounds/score.wav'); // Replace with your sound file path
    this.binSound = new Audio('/assets/casino/plinko/sounds/error.wav'); // Replace with your sound file path
  }

  ngOnInit(): void {
    this.lastTenRolls = [
      { roll: 75.32, isWin: true },
      { roll: 42.67, isWin: false },
      { roll: 88.14, isWin: true },
      { roll: 12.45, isWin: false },
    ];
    this.casinoService.userBalance$.subscribe({
      next: (balance) => {
        this.userBalance = balance;
        console.log('Updated User Balance:', this.userBalance);
      },
      error: (err) => console.error('Failed to update balance:', err),
    });

    // Fetch the initial balance
    this.casinoService.getUserBalance(this.casinoService.userId).subscribe({
      next: (response) => console.log('Fetched Initial Balance:', response.userBalance),
      error: (err) => console.error('Failed to fetch initial balance:', err),
    });
  }
  evaluateOutcome(roll: number): void {
    const rollOver = this.rollOver; // User-defined roll-over value
    const multiplier = this.getMultiplier(); // Get the multiplier based on thumb position
    this.isWin = roll > rollOver; // Determine win/loss

    if (this.isWin) {
      console.log('You win!');
      this.winnings = this.betAmount * multiplier; // Calculate winnings
    } else {
      console.log('You lose!');
      this.winnings = 0; // Reset winnings if the player loses
    }

    console.log(`Roll: ${roll}, Multiplier: ${multiplier.toFixed(2)}, Winnings: ${this.winnings}`);
  }
  openSettings(): void {
    this.showStatistics = !this.showStatistics;
  }

  goBack(): void {

    this.router.navigate(['casino-home']);
  }
  halveBet(): void {
    this.betAmount = Math.max(this.betAmount / 2, 0.01); // Ensure it doesn't go below 0.01
  }

  doubleBet(): void {
    this.betAmount = Math.min(this.betAmount * 2, 10000); // Add a max limit, if needed
  }
  rollDice(): number {
    return Math.random() * 100; // Generates a number between 0 and 100
  }


  playGame(): void {
    const diceRoll = this.rollDice(); // Get random dice roll (0–100)
    this.rollValue = diceRoll; // Update the roll value for display
    this.moveDie(diceRoll); // Move the die based on the roll

    const win = diceRoll > this.rollOver; // Determine if the player wins
    const winnings = win ? this.calculateWinnings() : 0; // Calculate winnings if they win

    // Store the roll in the lastTenRolls array
  this.lastTenRolls.unshift({ roll: diceRoll, isWin: win });
  if (this.lastTenRolls.length > 10) {
    this.lastTenRolls.pop(); // Remove the oldest roll if more than 10
  }

    // Handle bet and potential winnings
    this.placeBetAndHandleWinnings(this.betAmount, winnings, win);
  }
  calculateWinnings(): number {
    const multiplier = this.calculateMultiplier(); // Get the current multiplier
    return this.betAmount * multiplier; // Multiply bet by multiplier
  }

  calculateMultiplier(): number {
    // Example: Scale multiplier based on thumb position (50% = 2x, 100% = 10x)
    return 2 + ((this.thumbPosition - 50) / 50) * 8;
  }
  moveDie(roll: number): void {
    const track = this.sliderTrackRef.nativeElement as HTMLElement;
    if (!track) {
      console.error('Slider track not found!');
      return;
    }

    // Calculate the new position based on the roll
    const trackWidth = track.clientWidth;
    const newPosition = (roll / 100) * 100; // Convert roll to percentage

    // Update the die's position
    this.diePosition = newPosition;

    console.log(`Die rolled: ${roll}, New die position: ${this.diePosition}%`);
  }
  isDragging: boolean = false;

  updateSlider(event: MouseEvent): void {
    const track = this.sliderTrackRef.nativeElement as HTMLElement;
    const progressBar = track.querySelector('.slider-progress') as HTMLElement;
    const greenBar = track.querySelector('.slider-green') as HTMLElement;

    if (!track || !progressBar || !greenBar) {
      console.error('Track, progress, or green bar missing');
      return;
    }

    const trackRect = track.getBoundingClientRect();
    const offsetX = event.clientX - trackRect.left;

    // Clamp offset to a range based on the rollOver value
    const percentage = Math.min(Math.max((offsetX / trackRect.width) * 100, this.rollOver), 100);

    // Update thumb position
    this.thumbPosition = percentage;

    this.rollOver = this.thumbPosition; // Sync rollOver value

    this.updateWinChance();

    // Update the red progress bar
    progressBar.style.width = `${this.thumbPosition}%`;

    // Update the green progress bar
    greenBar.style.left = `${this.thumbPosition}%`;
    greenBar.style.width = `${100 - this.thumbPosition}%`;
  }
  drawLastRolls(): void {
    const canvasWidth = this.canvasRef.nativeElement.width;
    const baseX = canvasWidth - 150; // Start drawing on the right
    const baseY = 200; // Start drawing from the top
    const rectHeight = 40;
    const rectWidth = 120;
    const gap = 10; // Gap between rectangles
    const radius = 10;

    console.log("Drawing last rolls...");
  
    this.ctx.font = "bold 16px sans-serif";
    this.ctx.textAlign = "center";
  
    this.lastTenRolls.forEach((roll, index) => {
      const rectY = baseY + index * (rectHeight + gap);
  
      // Set color based on win/loss
      this.ctx.fillStyle = roll.isWin ? "#4CAF50" : "#F44336"; // Green for win, red for loss
  
      // Draw rounded rectangle
      this.drawRoundedRect(baseX, rectY, rectWidth, rectHeight, radius);
  
      // Draw roll value
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.fillText(
        `${roll.roll.toFixed(2)}`, // Roll value
        baseX + rectWidth / 2,
        rectY + rectHeight / 2 + 6
      );
    });
  }
  
  placeBetAndHandleWinnings(betAmount: number, winnings: number, win: boolean): void {
    this.casinoService.placeBet(betAmount).pipe(
        concatMap(() => {
            // If the player wins, add winnings; otherwise, return an observable of the updated balance
            return win ? this.casinoService.addWinnings(winnings) : of(this.casinoService.getUserBalance(this.casinoService.userId));
        })
    ).subscribe({
        next: (updatedBalance) => {
            console.log(`Bet placed. Updated balance: ${updatedBalance}`);
            if (win) {
                console.log(`Player won! Winnings of ${winnings} added successfully.`);
            } else {
                console.log('Player lost the bet.');
            }
        },
        error: (err) => {
            console.error('Error handling bet and winnings:', err);
            this.snackBar.open('An error occurred while processing your bet.', 'Close', { duration: 3000 });
        }
    });
  }
  startDragging(event: MouseEvent): void {
    this.isDragging = true;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (this.isDragging) {
        this.updateSlider(moveEvent);
      }
    };

    const onMouseUp = () => {
      this.isDragging = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
  updateThumbPosition(event: MouseEvent): void {
    const track = this.sliderTrackRef.nativeElement as HTMLElement;
    const progressBar = track.querySelector('.slider-progress') as HTMLElement;
    const greenBar = track.querySelector('.slider-green') as HTMLElement;

    if (!track || !progressBar || !greenBar) {
      console.error('Track, progress, or green bar missing');
      return;
    }

    const trackRect = track.getBoundingClientRect();
    const offsetX = event.clientX - trackRect.left;

    // Clamp offsetX to the track width
    const percentage = Math.min(Math.max((offsetX / trackRect.width) * 100, 0), 100);

    // Update thumb position and roll value
    this.thumbPosition = percentage;
    this.rollValue = this.thumbPosition;

    // Dynamically update the red progress bar's width
    progressBar.style.width = `${this.thumbPosition}%`;

    // Dynamically update the green progress bar's position and width
    greenBar.style.left = `${this.thumbPosition}%`;
    greenBar.style.width = `${100 - this.thumbPosition}%`;

    console.log('Thumb position:', this.thumbPosition); // Debugging log
    console.log('Red width:', progressBar.style.width); // Debugging log
    console.log('Green left:', greenBar.style.left, 'Green width:', greenBar.style.width); // Debugging log
  }
  updateRollValue(): void {
    this.rollValue = this.thumbPosition;
  }

  updateDiePosition(): void {
    const dieElement = this.sliderThumbRef.nativeElement as HTMLElement;
    const trackWidth = this.sliderTrackRef.nativeElement.offsetWidth;
    const newPosition = (this.rollValue / 100) * trackWidth;

    dieElement.style.left = `${newPosition}px`;
  }
  // Add a new multiplier score
  addMultiplier(multiplier: number): void {
    // Add the new score with a timeout ID
    const timeoutId = setTimeout(() => this.removeMultiplier(multiplier), this.scoreDisplayDuration);
    this.lastFourScores.push({ score: multiplier, timeoutId });

    // Keep only the last 4 scores
    if (this.lastFourScores.length > 4) {
      const removedScore = this.lastFourScores.shift();
      if (removedScore) clearTimeout(removedScore.timeoutId); // Clear timeout for removed score
    }

    // Trigger animation
    this.animateScores();
  }

  // Remove a multiplier after its timeout
  removeMultiplier(multiplier: number): void {
    const index = this.lastFourScores.findIndex(item => item.score === multiplier);
    if (index !== -1) {
      this.lastFourScores.splice(index, 1);
    }
  }

  // Animate the scores
  animateScores(): void {
    const slotInner = document.querySelector('.slot-inner') as HTMLElement;

    if (slotInner) {
      // Temporarily remove transition for smooth reset
      slotInner.style.transition = 'none';
      slotInner.style.transform = 'translateY(50px)';

      // Reapply transition after a small delay
      setTimeout(() => {
        slotInner.style.transition = 'transform 0.3s ease-in-out';
        slotInner.style.transform = 'translateY(0)';
      }, 50);
    }
  }
  // Utility to darken a color
  darkenColor(color: string, factor: number): string {
    const hex = parseInt(color.slice(1), 16);
    const r = Math.floor(((hex >> 16) & 255) * factor);
    const g = Math.floor(((hex >> 8) & 255) * factor);
    const b = Math.floor((hex & 255) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  }
  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement;

    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    this.ctx = canvas.getContext('2d')!;
    console.log('Canvas initialized with dynamic size:', canvas.width, canvas.height);

    const userId = 1;

    // Subscribe to userBalance updates
    this.casinoService.userBalance$.subscribe({
      next: (balance) => {
        this.userBalance = balance;
        console.log('User Balance updated:', this.userBalance); // React to updates
      },
    });

    // Fetch the initial user balance
    this.casinoService.getUserBalance(userId).subscribe({
      error: (err) => console.error('Failed to fetch user balance', err),
    });

    this.initializeGame();
    this.startGameLoop();

    const sliderTrackElement = this.sliderTrackRef?.nativeElement;
    const sliderThumbElement = this.sliderThumbRef?.nativeElement;

    if (!sliderTrackElement || !sliderThumbElement) {
      console.error('Slider track or thumb elements are missing from the DOM.');
      return; // Safely exit if the elements are not found
    }

    console.log('Slider track and thumb elements initialized.');
    // Perform initialization logic, if necessary
  }

  initializeGame(): void {

  }
  startGameLoop(): void {
    const loop = () => {
      this.clearCanvas();
      this.drawLastRolls(); // Add this line
      requestAnimationFrame(loop);
    };
    loop();
  }
  getMultiplier(): number {
    const minMultiplier = 2; // Minimum multiplier (at 50%)
    const maxMultiplier = this.maxMultiplier; // Maximum multiplier (at 100%)

    // Scale multiplier linearly between 50% and 100%
    const scaledPosition = (this.thumbPosition - 50) / 50; // Normalize to range [0, 1]
    return minMultiplier + scaledPosition * (maxMultiplier - minMultiplier);
  }


  clearCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.fillStyle = '#0F212D'; // Background color
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  drawGame(): void {

  }
  updateWinChance(): void {
    this.winChance = 100 - this.rollOver; // Adjust logic as needed
  }
  drawRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y); // Top-left corner
    this.ctx.lineTo(x + width - radius, y); // Top side
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius); // Top-right corner
    this.ctx.lineTo(x + width, y + height - radius); // Right side
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); // Bottom-right corner
    this.ctx.lineTo(x + radius, y + height); // Bottom side
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius); // Bottom-left corner
    this.ctx.lineTo(x, y + radius); // Left side
    this.ctx.quadraticCurveTo(x, y, x + radius, y); // Top-left corner
    this.ctx.closePath();
    this.ctx.fill();
  }
}
