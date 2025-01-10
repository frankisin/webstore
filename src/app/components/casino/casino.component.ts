import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { CasinoService } from '../../services/casinoservice.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-casino',
  templateUrl: './casino.component.html',
  styleUrls: ['./casino.component.css'],
  imports: [CommonModule, FormsModule, NavbarComponent],
  standalone: true
})
export class CasinoComponent implements OnInit {
  @ViewChild('plinkoCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  // Game settings
  pinRadius = 3.5;
  ballRadius = 10;
  gravity = 0.35;
  bounceFactor = 0.65;
  dampingFactor = 0.97;
  biasStrength = 0.000175; //155 for fun
  thresholdY!: number;
  boardHeightOffset: number = 120;
  ballSpawnHeight: number = 40
  scoreCardOffset: number = 80
  userBalance: number = 0;
  walletBalance: number = 0;
  lastMultiplier: number = 0;

  lastFourScores: { score: number; timeoutId: any }[] = []; // Array of objects for scores

  showStatistics = true; // Controls visibility of the statistics section



  rows: number = 16; // Default value for rows

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

  constructor(private casinoService: CasinoService,private router:Router) {
    this.multiplierTracker = {};
    this.multiplierStats = [];
    this.totalBallsSpawned = 0;
    // Load the sound
    this.pinSound = new Audio('/assets/casino/plinko/sounds/score.wav'); // Replace with your sound file path
    this.binSound = new Audio('/assets/casino/plinko/sounds/error.wav'); // Replace with your sound file path


  }

  ngOnInit(): void {
    this.casinoService.userBalance$.subscribe({
      next: (balance) => {
        this.userBalance = balance;
        //console.log('Updated User Balance:', this.userBalance);
      },
      error: (err) => console.error('Failed to update balance:', err),
    });
  
    // Fetch the initial balance
    this.casinoService.getUserBalance(this.casinoService.userId).subscribe({
      next: (response) => console.log('Fetched Initial Balance:', response.userBalance),
      error: (err) => console.error('Failed to fetch initial balance:', err),
    });
  }
  openSettings(): void{
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
  playGame(): void {
    const betAmount = this.betAmount;
  
    if (betAmount < 0 || betAmount > this.userBalance) {
      alert('Invalid bet amount or insufficient balance.');
      return;
    }
  
    this.casinoService.batchBalanceUpdate(-betAmount); // Deduct bet
  
    this.spawnBalls(1);
  
    const interval = setInterval(() => {
      if (this.balls.length === 0) {
        clearInterval(interval);
        console.log('All balls processed.');
      }
    }, 100);
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

  // Draw displayed multipliers
  drawDisplayedMultipliers(): void {
    const now = Date.now();
    const canvasWidth = this.canvasRef.nativeElement.width;
    const startX = canvasWidth - 150; // Position near the right edge
    let startY = this.scoreCardOffset; // Starting Y position

    this.ctx.font = "bold 16px sans-serif";
    this.ctx.textAlign = "center";

    for (let i = this.displayedMultipliers.length - 1; i >= 0; i--) {
      const { multiplier, color, timestamp } = this.displayedMultipliers[i];

      // Remove expired multipliers
      if (now - timestamp > this.multiplierDisplayTime) {
        this.displayedMultipliers.splice(i, 1);
        continue;
      }

      const rectWidth = 100;
      const rectHeight = 50;
      const radius = 10;
      const rectX = startX;
      const rectY = startY;

      // Darker back layer
      const backOffset = 5;
      const darkerColor = this.darkenColor(color, 0.6);
      this.ctx.fillStyle = darkerColor;
      this.drawRoundedRect(rectX, rectY + backOffset, rectWidth, rectHeight, radius);

      // Lighter front layer
      this.ctx.fillStyle = color;
      this.drawRoundedRect(rectX, rectY, rectWidth, rectHeight, radius);

      // Multiplier text
      this.ctx.fillStyle = "#000000";
      this.ctx.fillText(`${multiplier}x`, rectX + rectWidth / 2, rectY + rectHeight / 2 + 6);

      // Update vertical offset
      startY += rectHeight + 10;
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

  spawnBalls(count: number): void {
    const canvas = this.canvasRef.nativeElement;
    const minX = canvas.width * 0.453;
    const maxX = canvas.width * 0.515;
    const spawnYOffset = this.boardHeightOffset - this.ballSpawnHeight; // Set this to the desired offset in pixels

    for (let i = 0; i < count; i++) {
      const randomX = Math.random() * (maxX - minX) + minX;
      this.balls.push({
        x: randomX, y: spawnYOffset, dx: 0, dy: 0,
        lifetime: 10
      });
      this.totalBallsSpawned++;
    }
  }
  updateBalls(): void {
    const canvasWidth = this.canvasRef.nativeElement.width;
  
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
  
      // Apply gravity and damping
      ball.dy += this.gravity * 0.5; // Stronger gravity
      ball.dx *= this.dampingFactor;
      ball.dy *= this.dampingFactor;
  
      // Bias force toward the center of the canvas
      const biasForce = (canvasWidth / 2 - ball.x) * this.biasStrength;
      ball.dx += biasForce;
  
      for (const pin of this.pins) {
        const dx = ball.x - pin.x;
        const dy = ball.y - pin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
  
        if (distance < this.ballRadius + this.pinRadius) {
          const overlap = this.ballRadius + this.pinRadius - distance;
          const angle = Math.atan2(dy, dx);
  
          // Resolve overlap
          ball.x += Math.cos(angle) * overlap * 1.3;
          ball.y += Math.sin(angle) * overlap * 1.3;
  
          // Reflect velocity
          const normalX = Math.cos(angle);
          const normalY = Math.sin(angle);
          const dotProduct = ball.dx * normalX + ball.dy * normalY;
  
          ball.dx -= 2 * dotProduct * normalX;
          ball.dy -= 2 * dotProduct * normalY;
  
          // Ensure minimum velocity to prevent sticking
          if (Math.abs(ball.dx) < 0.05) ball.dx = 0.05 * Math.sign(ball.dx || 1);
          if (Math.abs(ball.dy) < 0.05) ball.dy = 0.05;
  
          ball.dx *= this.bounceFactor;
          ball.dy *= this.bounceFactor;
  
          // Play the pin sound
          this.pinSound.currentTime = 0; // Reset sound to start
          this.pinSound.play().catch(err => console.error('Error playing pin sound:', err));
  
          // Add ripple effect at the pin's position
          this.ripples.push({
            x: pin.x,      // Pin's x-coordinate
            y: pin.y - 1,  // Pin's y-coordinate
            radius: 0,     // Initial radius
            opacity: 1,    // Initial opacity
          });
        }
      }
  
      // Update position
      ball.x += ball.dx;
      ball.y += ball.dy;
  
      // Check if the ball lands in a bin
      for (const bin of this.bins) {
        if (
          ball.x > bin.x &&
          ball.x < bin.x + bin.width &&
          ball.y + this.ballRadius >= bin.y
        ) {
          // Record the multiplier for this ball
          const binMultiplier = bin.multiplier;
  
          console.log(`Ball landed in bin with multiplier: ${binMultiplier}`);
          console.log(`Updating lastMultiplier to: ${binMultiplier}`);
  
          // Update the multiplier tracker and stats
          if (!this.multiplierTracker[binMultiplier]) {
            this.multiplierTracker[binMultiplier] = 0;
          }
          this.multiplierTracker[binMultiplier]++;
          this.updateMultiplierStats();
  
          // Trigger bin animation
          bin.isBouncing = true;
          bin.bounceOffset = -5; // Start with upward offset
  
          // Remove the ball
          this.balls.splice(i, 1);
  
          // Add multiplier display
          this.addMultiplier(binMultiplier);
  
          // Calculate winnings for this ball
          const winnings = parseFloat((this.betAmount * binMultiplier).toFixed(2));
  
          // Update HUD immediately
          if (binMultiplier > 0) {
            this.casinoService.batchBalanceUpdate(winnings);
          }
  
          // Store last multiplier
          this.lastMultiplier = binMultiplier;
  
          // Play the bin sound
          this.binSound.currentTime = 0; // Reset sound to start
          this.binSound.play().catch(err => console.error('Error playing bin sound:', err));
  
          console.log(`Bet Amount: $${this.betAmount}, Last Multiplier: ${binMultiplier}`);
          console.log(`Winnings for this ball: $${winnings}`);
          console.log(`Balance Before Winnings: $${this.userBalance}`);
  
          break;
        }
      }
    }
  }
  
  getLastMultiplier(): number | null {
    return this.lastMultiplier || null;
  }
  updateMultiplierStats(): void {
    this.multiplierStats = Object.keys(this.multiplierTracker).map((multiplierKey) => {
      const multiplier = parseFloat(multiplierKey); // Convert key to number
      const count = this.multiplierTracker[multiplier];
      const percentage = ((count / this.totalBallsSpawned) * 100).toFixed(3); // Format to 3 decimal places
      return { multiplier, count, percentage: parseFloat(percentage) }; // Ensure percentage is returned as a number
    });

    // Optionally sort the stats by multiplier
    this.multiplierStats.sort((a, b) => a.multiplier - b.multiplier);
  }
  drawBalls(): void {
    this.ctx.fillStyle = 'red';
    for (const ball of this.balls) {
      this.ctx.beginPath();
      this.ctx.arc(ball.x, ball.y, this.ballRadius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.closePath();
    }
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
  }

  initializeGame(): void {
    this.createPins();
    this.createBins();
  }
  startGameLoop(): void {
    const loop = () => {
      this.clearCanvas();
      this.drawGame();
      this.updateBalls();
      this.updateAndDrawRipples();
      this.drawDisplayedMultipliers();
      requestAnimationFrame(loop);
    };
    loop();
  }
  updateAndDrawRipples(): void {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const ripple = this.ripples[i];

      // Increase the radius and reduce the opacity
      ripple.radius += 0.7; // Expand the ripple
      ripple.opacity -= 0.05; // Fade out

      // Remove the ripple if it is fully faded
      if (ripple.opacity <= 0) {
        this.ripples.splice(i, 1);
        continue;
      }

      // Draw the ripple
      this.ctx.beginPath();
      this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.opacity})`; // Fading white
      this.ctx.lineWidth = 2; // Thickness of the ripple
      this.ctx.stroke();
      this.ctx.closePath();
    }
  }
  clearCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.fillStyle = '#0F212D'; // Background color
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  drawGame(): void {
    this.drawPins();
    this.drawBalls();
    this.drawBins(); // Add this
  }
  drawPins(): void {
    this.ctx.fillStyle = 'white';
    for (const pin of this.pins) {
      this.ctx.beginPath();
      this.ctx.arc(pin.x, pin.y, this.pinRadius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.closePath();
    }
  }
  createBall(x: number, y: number): { x: number; y: number; dx: number; dy: number; lifetime: number } {
    return { x, y, dx: 0, dy: 0, lifetime: 0 };
  }
  createPins(): void {
    this.pins.length = 0;
    const maxPins = 18; // Maximum number of pins in a row
    const baseSpacing = 50; // Horizontal space between pins
    const rowSpacing = 50; // Vertical space between rows (adjust this value)
    const offsetY = this.boardHeightOffset; // Starting Y position for the first row

    let pinsInRow = 3; // Initial number of pins in the first row
    const canvasWidth = this.canvasRef.nativeElement.width;

    for (let row = 0; pinsInRow <= maxPins; row++) {
      const rowOffsetX = (canvasWidth - pinsInRow * baseSpacing) / 2; // Center align pins in the row
      for (let col = 0; col < pinsInRow; col++) {
        const x = rowOffsetX + col * baseSpacing; // Calculate X position
        const y = offsetY + row * rowSpacing; // Calculate Y position based on rowSpacing
        this.pins.push({ x, y, lastHit: 0, cooldown: 300 });
      }
      pinsInRow++; // Increase the number of pins in the next row
    }
  }
  createBins(): void {
    const canvas = this.canvasRef.nativeElement;
    const bottomRow = this.pins.filter(
      (pin) => pin.y === Math.max(...this.pins.map((p) => p.y))
    );

    const numBins = Math.min(bottomRow.length - 1, this.multipliers.length);
    const binHeight = 36;
    const binY = Math.max(...this.pins.map((pin) => pin.y)) + 20; // Position below pins
    const gap = 6;

    this.bins = [];
    for (let i = 0; i < numBins; i++) {
      const x = bottomRow[i].x + (bottomRow[i + 1].x - bottomRow[i].x) / 2;
      const width = bottomRow[i + 1].x - bottomRow[i].x - gap;

      this.bins.push({
        x: x - width / 2,
        width,
        multiplier: parseFloat(this.multipliers[i % this.multipliers.length].toString()),
        y: binY,
        height: binHeight,
        bounceOffset: 0,
        isBouncing: false,
      });

      // Add this log
      console.log(`Bin created:`, this.bins[i]);
    }
  }
  drawBins(): void {
    const shadowOffset = 5; // Offset for the back (shadow) part
    const cornerRadius = 7; // Radius for rounded corners

    // Define gradients for bins
    const frontGradient = this.ctx.createLinearGradient(
      this.bins[0].x,
      0,
      this.bins[this.bins.length - 1].x + this.bins[this.bins.length - 1].width,
      0
    );
    frontGradient.addColorStop(0, '#FD0241');
    frontGradient.addColorStop(0.15, '#FB4627');
    frontGradient.addColorStop(0.5, '#fee505');
    frontGradient.addColorStop(0.85, '#FB4627');
    frontGradient.addColorStop(1, '#FD0241');

    const backGradient = this.ctx.createLinearGradient(
      this.bins[0].x,
      0,
      this.bins[this.bins.length - 1].x + this.bins[this.bins.length - 1].width,
      0
    );
    backGradient.addColorStop(0, '#A5002F');
    backGradient.addColorStop(0.15, '#A63620');
    backGradient.addColorStop(0.5, '#B88902');
    backGradient.addColorStop(0.85, '#A63620');
    backGradient.addColorStop(1, '#A5002F');

    this.bins.forEach((bin, i) => {
      // Handle bounce animation
      if (bin.isBouncing) {
        bin.bounceOffset += 1; // Move back down
        if (bin.bounceOffset >= 0) {
          bin.isBouncing = false; // Stop bouncing
          bin.bounceOffset = 0; // Reset offset
        }
      }

      // Draw the darker "back" part of the bin
      this.ctx.fillStyle = backGradient;
      this.drawRoundedRect(
        bin.x,
        bin.y + shadowOffset + bin.bounceOffset,
        bin.width,
        bin.height,
        cornerRadius
      );

      // Draw the lighter "front" part of the bin
      this.ctx.fillStyle = frontGradient;
      this.drawRoundedRect(
        bin.x,
        bin.y + bin.bounceOffset,
        bin.width,
        bin.height,
        cornerRadius
      );

      // Draw the multiplier text
      const displayText =
        i >= 2 && i < this.bins.length - 2
          ? `${bin.multiplier}x`
          : `${bin.multiplier}`;
      this.ctx.font = displayText.includes('x') ? 'bold 14px sans-serif' : 'bold 14px sans-serif';
      this.ctx.fillStyle = '#000';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        displayText,
        bin.x + bin.width / 2,
        bin.y + bin.height / 2 + 5 + bin.bounceOffset
      );
    });

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
