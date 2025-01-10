// Select the canvas
const canvas = document.getElementById("plinkoCanvas");
const ctx = canvas.getContext("2d");

// Canvas dimensions
const width = canvas.width;
const height = canvas.height;

const leftPanelWidth = 300; // Width of the left panel (in pixels)


// Game settings
const pinRadius = 3.5;
const ballRadius = 7;
const gravity = 0.15;
const bounceFactor = 0.8;
const dampingFactor = 0.98; // Slow down balls over time
const biasStrength = 0.000305; // Bias force toward center
const thresholdY = height + 40; // Threshold for ball removal

// Assets (sounds)
const scoreSound = new Audio("sounds/score.wav");
const clickSound = new Audio("sounds/click.wav");
const errorSound = new Audio("sounds/error.wav");

// Pins and balls
const pins = [];
const balls = [];

// Score cards
const scoreCards = [];
const cardHeight = 35; // Fixed height for the cards
const scores = []; // Array to track scores for each card

// Multiplier values for score cards (symmetrical)
const multipliers = [1000, 130, 40, 10, 5, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 5, 10, 40, 130, 1000];

const multiplierColors = {
    1000: "#FD0241", // Deep red
    130: "#FF5A3C", // Bright orange-red, closer to red
    40: "#FF8133",  // Vibrant orange
    10: "#FFA41F",  // Bright golden-orange
    5: "#FFC300",   // Deep yellow, less orange
    2: "#FFEB00",   // Vivid yellow
    0.2: "#FFF700", // Bright pure yellow
};

const displayedMultipliers = []; // Array to hold multipliers for display
const multiplierDisplayTime = 3000; // Time in milliseconds to display each multiplier

const multiplierTracker = {
    1000: 0,
    130: 0,
    40: 0,
    10: 0,
    5: 0,
    2: 0,
    0.2: 0
};

let totalBallsSpawned = 0; // Total number of balls spawned


const ripples = []; // List of active ripples
const animatedCards = []; // Array to track which cards are animating

const bounceHeights = Array(scoreCards.length).fill(0); // Tracks bounce offset for each card

function updateAndDrawRipples() {
    for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];

        // Increase the radius and reduce the opacity
        ripple.radius += 1; // Expand the ripple
        ripple.opacity -= 0.05; // Fade out

        // Remove the ripple if it is fully faded
        if (ripple.opacity <= 0) {
            ripples.splice(i, 1);
            continue;
        }

        // Draw the ripple
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.opacity})`; // Fading white
        ctx.lineWidth = 2; // Thickness of the ripple
        ctx.stroke();
        ctx.closePath();
    }
}
/*function drawScoreCards() {
    ctx.font = "14px Arial";
    ctx.textAlign = "center";

    // Define gradient for the lighter front part
    const frontGradient = ctx.createLinearGradient(
        scoreCards[0].x - scoreCards[0].width / 2,
        0,
        scoreCards[scoreCards.length - 1].x + scoreCards[0].width / 2,
        0
    );
    frontGradient.addColorStop(0, "#FD0241");
    frontGradient.addColorStop(0.5, "#fee505");
    frontGradient.addColorStop(1, "#FD0241");

    scoreCards.forEach((card) => {
        const yOffset = card.bounceOffset || 0; // Apply the bounce offset

        // Draw the card with rounded corners
        ctx.fillStyle = frontGradient;
        ctx.beginPath();
        const radius = card.height / 6; // Rounded corners
        ctx.moveTo(card.x - card.width / 2 + radius, card.y + yOffset);
        ctx.lineTo(card.x + card.width / 2 - radius, card.y + yOffset);
        ctx.quadraticCurveTo(card.x + card.width / 2, card.y + yOffset, card.x + card.width / 2, card.y + radius + yOffset);
        ctx.lineTo(card.x + card.width / 2, card.y + card.height - radius + yOffset);
        ctx.quadraticCurveTo(
            card.x + card.width / 2,
            card.y + card.height + yOffset,
            card.x + card.width / 2 - radius,
            card.y + card.height + yOffset
        );
        ctx.lineTo(card.x - card.width / 2 + radius, card.y + card.height + yOffset);
        ctx.quadraticCurveTo(
            card.x - card.width / 2,
            card.y + card.height + yOffset,
            card.x - card.width / 2,
            card.y + card.height - radius + yOffset
        );
        ctx.lineTo(card.x - card.width / 2, card.y + radius + yOffset);
        ctx.quadraticCurveTo(card.x - card.width / 2, card.y + yOffset, card.x - card.width / 2 + radius, card.y + yOffset);
        ctx.closePath();
        ctx.fill();

        // Draw the multiplier text
        ctx.fillStyle = "black";
        const displayText = `${card.multiplier}x`;
        ctx.fillText(displayText, card.x, card.y + card.height / 2 + 5 + yOffset);
    });
}*/
//const bounceHeights = Array(scoreCards.length).fill(0); // Tracks bounce offset for each card
const bounceVelocities = Array(scoreCards.length).fill(0); // Tracks bounce velocity for each card

function drawScoreCards() {
    ctx.font = "14px Arial";
    ctx.textAlign = "center";

    const gradient = ctx.createLinearGradient(
        scoreCards[0].x - scoreCards[0].width / 2,
        0,
        scoreCards[scoreCards.length - 1].x + scoreCards[0].width / 2,
        0
    );
    gradient.addColorStop(0, "#FD0241");
    gradient.addColorStop(0.5, "#fee505");
    gradient.addColorStop(1, "#FD0241");

    scoreCards.forEach((card) => {
        const yOffset = card.bounceOffset; // Apply bounce offset

        // Draw the card
        ctx.fillStyle = gradient;
        ctx.beginPath();
        const radius = card.height / 6;
        ctx.moveTo(card.x - card.width / 2 + radius, card.y + yOffset);
        ctx.lineTo(card.x + card.width / 2 - radius, card.y + yOffset);
        ctx.quadraticCurveTo(card.x + card.width / 2, card.y + yOffset, card.x + card.width / 2, card.y + radius + yOffset);
        ctx.lineTo(card.x + card.width / 2, card.y + card.height - radius + yOffset);
        ctx.quadraticCurveTo(
            card.x + card.width / 2,
            card.y + card.height + yOffset,
            card.x + card.width / 2 - radius,
            card.y + card.height + yOffset
        );
        ctx.lineTo(card.x - card.width / 2 + radius, card.y + card.height + yOffset);
        ctx.quadraticCurveTo(
            card.x - card.width / 2,
            card.y + card.height + yOffset,
            card.x - card.width / 2,
            card.y + card.height - radius + yOffset
        );
        ctx.lineTo(card.x - card.width / 2, card.y + radius + yOffset);
        ctx.quadraticCurveTo(card.x - card.width / 2, card.y + yOffset, card.x - card.width / 2 + radius, card.y + yOffset);
        ctx.closePath();
        ctx.fill();

        // Draw the multiplier
        ctx.fillStyle = "black";
        ctx.fillText(`${card.multiplier}x`, card.x, card.y + card.height / 2 + 5 + yOffset);
    });
}

function createScoreCards() {
    scoreCards.length = 0; // Clear existing cards
    scores.length = 0; // Reset scores

    const bottomRow = pins.filter(pin => pin.y === Math.max(...pins.map(pin => pin.y)));
    const spacing = bottomRow[1].x - bottomRow[0].x; // Distance between adjacent pins
    const gap = 5; // Gap between score cards
    const adjustedWidth = spacing - gap; // Reduce width to account for gaps

    for (let i = 0; i < bottomRow.length - 1; i++) {
        const x = bottomRow[i].x + spacing / 2; // Center between two pins
        const y = Math.max(...pins.map(pin => pin.y)) + 20; // Below the last row

        scoreCards.push({
            x, // Center of the card
            y,
            width: adjustedWidth, // Adjusted width
            height: cardHeight,
            multiplier: multipliers[i % multipliers.length], // Assign multiplier
            bounceOffset: 0, // Initial bounce offset
            bouncing: false, // Prevent overlapping animations
        });

        scores.push(0); // Initialize score for each card
    }
}

function checkBallInScoreCards(ball) {
    for (let i = 0; i < scoreCards.length; i++) {
        const card = scoreCards[i];
        if (
            ball.x > card.x - card.width / 2 &&
            ball.x < card.x + card.width / 2 &&
            ball.y + ballRadius > card.y
        ) {
            // Ball lands on this card
            scores[i] += 1; // Increment score

            // Trigger bounce animation
            if (!card.bouncing) {
                console.log(`Ball hit card ${i}, triggering bounce.`); // Debugging log
                card.bouncing = true; // Prevent overlapping animations
                card.bounceOffset = -10; // Move up

                // Animate back to original position
                const bounceInterval = setInterval(() => {
                    card.bounceOffset += 1; // Gradual reset
                    if (card.bounceOffset >= 0) {
                        card.bounceOffset = 0; // Reset to original position
                        card.bouncing = false; // Mark animation as complete
                        clearInterval(bounceInterval); // Stop animation
                    }
                }, 16); // ~60 FPS
            }

            return true; // Ball should be removed
        }
    }
    return false;
}


function drawScoreCards() {
    ctx.font = "14px Arial";
    ctx.textAlign = "center";

    const gradient = ctx.createLinearGradient(
        scoreCards[0].x - scoreCards[0].width / 2,
        0,
        scoreCards[scoreCards.length - 1].x + scoreCards[0].width / 2,
        0
    );
    gradient.addColorStop(0, "#FD0241");
    gradient.addColorStop(0.5, "#fee505");
    gradient.addColorStop(1, "#FD0241");

    scoreCards.forEach((card) => {
        const yOffset = card.bounceOffset || 0; // Apply bounce offset
        ctx.fillStyle = gradient;

        // Draw the card
        ctx.beginPath();
        const radius = card.height / 6;
        ctx.moveTo(card.x - card.width / 2 + radius, card.y + yOffset);
        ctx.lineTo(card.x + card.width / 2 - radius, card.y + yOffset);
        ctx.quadraticCurveTo(card.x + card.width / 2, card.y + yOffset, card.x + card.width / 2, card.y + radius + yOffset);
        ctx.lineTo(card.x + card.width / 2, card.y + card.height - radius + yOffset);
        ctx.quadraticCurveTo(
            card.x + card.width / 2,
            card.y + card.height + yOffset,
            card.x + card.width / 2 - radius,
            card.y + card.height + yOffset
        );
        ctx.lineTo(card.x - card.width / 2 + radius, card.y + card.height + yOffset);
        ctx.quadraticCurveTo(
            card.x - card.width / 2,
            card.y + card.height + yOffset,
            card.x - card.width / 2,
            card.y + card.height - radius + yOffset
        );
        ctx.lineTo(card.x - card.width / 2, card.y + radius + yOffset);
        ctx.quadraticCurveTo(card.x - card.width / 2, card.y + yOffset, card.x - card.width / 2 + radius, card.y + yOffset);
        ctx.closePath();
        ctx.fill();

        // Draw the multiplier
        ctx.fillStyle = "black";
        ctx.fillText(`${card.multiplier}x`, card.x, card.y + card.height / 2 + 5 + yOffset);
    });
}


function drawDisplayedMultipliers() {
    const now = Date.now();
    const startX = width - 150; // Position to the right of the grid within the canvas
    let startY = 50; // Starting position at the top

    ctx.font = "14px Arial";
    ctx.textAlign = "center";

    for (let i = displayedMultipliers.length - 1; i >= 0; i--) {
        const { multiplier, color, timestamp } = displayedMultipliers[i];

        // Remove expired multipliers
        if (now - timestamp > multiplierDisplayTime) {
            displayedMultipliers.splice(i, 1);
            continue;
        }

        const rectWidth = 100; // Width of the rectangle
        const rectHeight = 50; // Height of the rectangle
        const radius = 10; // Corner radius for rounded edges
        const rectX = startX;
        const rectY = startY;

        // Darker back layer
        const backOffset = 5; // Offset for the back layer
        const darkerColor = darkenColor(color, 0.6); // Slightly darkened version of the color

        ctx.fillStyle = darkerColor;
        ctx.beginPath();
        ctx.moveTo(rectX + radius, rectY + backOffset);
        ctx.lineTo(rectX + rectWidth - radius, rectY + backOffset);
        ctx.quadraticCurveTo(
            rectX + rectWidth,
            rectY + backOffset,
            rectX + rectWidth,
            rectY + radius + backOffset
        );
        ctx.lineTo(rectX + rectWidth, rectY + rectHeight - radius + backOffset);
        ctx.quadraticCurveTo(
            rectX + rectWidth,
            rectY + rectHeight + backOffset,
            rectX + rectWidth - radius,
            rectY + rectHeight + backOffset
        );
        ctx.lineTo(rectX + radius, rectY + rectHeight + backOffset);
        ctx.quadraticCurveTo(
            rectX,
            rectY + rectHeight + backOffset,
            rectX,
            rectY + rectHeight - radius + backOffset
        );
        ctx.lineTo(rectX, rectY + radius + backOffset);
        ctx.quadraticCurveTo(
            rectX,
            rectY + backOffset,
            rectX + radius,
            rectY + backOffset
        );
        ctx.closePath();
        ctx.fill();

        // Lighter front layer
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(rectX + radius, rectY);
        ctx.lineTo(rectX + rectWidth - radius, rectY);
        ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius);
        ctx.lineTo(rectX + rectWidth, rectY + rectHeight - radius);
        ctx.quadraticCurveTo(
            rectX + rectWidth,
            rectY + rectHeight,
            rectX + rectWidth - radius,
            rectY + rectHeight
        );
        ctx.lineTo(rectX + radius, rectY + rectHeight);
        ctx.quadraticCurveTo(
            rectX,
            rectY + rectHeight,
            rectX,
            rectY + rectHeight - radius
        );
        ctx.lineTo(rectX, rectY + radius);
        ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
        ctx.closePath();
        ctx.fill();

        // Multiplier text
        ctx.fillStyle = "#000000"; // Black text color
        ctx.fillText(`${multiplier}x`, rectX + rectWidth / 2, rectY + rectHeight / 2 + 6);

        // Update vertical offset for the next multiplier
        startY += rectHeight + 10;
    }
}
// Helper function to darken a color
function darkenColor(color, amount) {
    const col = parseInt(color.slice(1), 16);
    const r = Math.max((col >> 16) * amount, 0);
    const g = Math.max(((col >> 8) & 0xff) * amount, 0);
    const b = Math.max((col & 0xff) * amount, 0);
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}
function createPins() {
    pins.length = 0; // Clear existing pins
    const maxPins = 18; // Maximum number of pins in a row
    const baseSpacing = 40; // Fixed spacing between pins (adjust as needed)

    const offsetY = 50; // Vertical spacing between rows
    let pinsInRow = 3; // Start with 3 pins in the first row

    for (let row = 0; pinsInRow <= maxPins; row++) {
        const rowOffsetX = leftPanelWidth + (width - leftPanelWidth - pinsInRow * baseSpacing) / 2; // Center in the right panel
        for (let col = 0; col < pinsInRow; col++) {
            const x = rowOffsetX + col * baseSpacing; // Position pin in the row
            const y = offsetY + row * 40; // Row height
            pins.push({ x, y });
        }

        // Increment the number of pins every row
        pinsInRow++;
    }
}

// Create a ball object
function createBall(x, y) {
    return {
        x,
        y,
        dx: 0,
        dy: 0,
        lifetime: 0, // Track how long the ball is active
    };
}
// Draw pins
function drawPins() {
    ctx.fillStyle = "white";
    for (const pin of pins) {
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, pinRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
}
// Draw balls
function drawBalls() {
    ctx.fillStyle = "red";
    for (const ball of balls) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
}
// Update ball positions and handle physics
function updateBalls() {
    const rightPanelCenter = leftPanelWidth + (width - leftPanelWidth) / 2; // Center of the right panel

    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];

        // Apply gravity and damping
        ball.dy += gravity;
        ball.dx *= dampingFactor;
        ball.dy *= dampingFactor;

        // Bias force toward the center of the right panel
        const biasForce = (rightPanelCenter - ball.x) * biasStrength;
        ball.dx += biasForce;

        // Update position
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Check for collisions with pins
        for (const pin of pins) {
            const dx = ball.x - pin.x;
            const dy = ball.y - pin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < ballRadius + pinRadius) {
                const overlap = ballRadius + pinRadius - distance;
                const angle = Math.atan2(dy, dx);
                ball.x += Math.cos(angle) * overlap * 1.1;
                ball.y += Math.sin(angle) * overlap * 1.1;

                const normalX = Math.cos(angle);
                const normalY = Math.sin(angle);
                const dotProduct = ball.dx * normalX + ball.dy * normalY;

                ball.dx -= 2 * dotProduct * normalX;
                ball.dy -= 2 * dotProduct * normalY;

                ball.dx *= bounceFactor;
                ball.dy *= bounceFactor;
                ball.dy += gravity * 0.3;
                scoreSound.currentTime = 0;
                scoreSound.play();

                // Add a ripple at the pin's position
                ripples.push({ x: pin.x, y: pin.y, radius: 0, opacity: 1.0 });
            }
        }

        // Check for floor or score card
        if (checkBallInScoreCards(ball) || ball.y > thresholdY) {
            balls.splice(i, 1); // Remove ball
            console.log(`Updated Scores: ${scores}`); // Debug log
            errorSound.currentTime = 0;
            errorSound.play();
        }
    }
}
// Update bounce heights for animated cards
function updateBounceHeights() {
    animatedCards.forEach((index) => {
        bounceHeights[index] += 2; // Simulate downward motion
        if (bounceHeights[index] > 10) {
            bounceHeights[index] = 0; // Reset after bounce
            const animatedIndex = animatedCards.indexOf(index);
            if (animatedIndex !== -1) {
                animatedCards.splice(animatedIndex, 1); // Remove from animation list
            }
        }
    });
}
function drawStatistics() {
    const infoX = 20; // Left padding for stats
    const infoYStart = 50; // Starting vertical position
    const lineHeight = 20; // Line height between stats

    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF"; // Text color

    // Display total balls spawned
    ctx.fillText(`Total Balls: ${totalBallsSpawned}`, infoX, infoYStart);

    // Display multiplier stats
    let offsetY = infoYStart + lineHeight;
    for (const [multiplier, count] of Object.entries(multiplierTracker)) {
        const percentage = totalBallsSpawned > 0
            ? ((count / totalBallsSpawned) * 100).toFixed(1)
            : 0;
        ctx.fillText(`${multiplier}x: ${count} (${percentage}%)`, infoX, offsetY);
        offsetY += lineHeight;
    }
}

function spawnBalls(number) {
    const rightPanelStart = leftPanelWidth; // Starting x-coordinate of the right panel
    const rightPanelWidth = width - leftPanelWidth; // Width of the right panel

    // Adjust the spawning range slightly to the left
    const minX = rightPanelStart + rightPanelWidth * 0.44; // Start further left
    const maxX = rightPanelStart + rightPanelWidth * 0.51; // End slightly to the left of center

    for (let i = 0; i < number; i++) {
        totalBallsSpawned++;
        const randomX = Math.random() * (maxX - minX) + minX; // Random x within the adjusted range
        balls.push(createBall(randomX, -ballRadius)); // Spawn ball at random x and above the grid
    }
}

function drawPlayButton() {
    const buttonX = 20; // Left padding in the left panel
    const buttonY = height - 100; // Distance from the bottom of the canvas
    const buttonWidth = leftPanelWidth - 40; // Button width
    const buttonHeight = 50; // Button height
    const radius = 10; // Rounded corners

    // Define gradient for the button
    const gradient = ctx.createLinearGradient(buttonX, buttonY, buttonX + buttonWidth, buttonY + buttonHeight);
    gradient.addColorStop(0, "#33A1FD");  // Light blue
    gradient.addColorStop(1, "#1E90FF");  // Deeper blue

    // Draw button background
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(buttonX + radius, buttonY);
    ctx.lineTo(buttonX + buttonWidth - radius, buttonY);
    ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY, buttonX + buttonWidth, buttonY + radius);
    ctx.lineTo(buttonX + buttonWidth, buttonY + buttonHeight - radius);
    ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY + buttonHeight, buttonX + buttonWidth - radius, buttonY + buttonHeight);
    ctx.lineTo(buttonX + radius, buttonY + buttonHeight);
    ctx.quadraticCurveTo(buttonX, buttonY + buttonHeight, buttonX, buttonY + buttonHeight - radius);
    ctx.lineTo(buttonX, buttonY + radius);
    ctx.quadraticCurveTo(buttonX, buttonY, buttonX + radius, buttonY);
    ctx.closePath();
    ctx.fill();

    // Draw button text
    ctx.font = "20px Arial";
    ctx.fillStyle = "#FFFFFF"; // White text
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PLAY", buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);

    return { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight };
}

// Add the button click logic
function handlePlayButtonClick(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Check if the click is inside the button
    if (
        mouseX >= playButton.x &&
        mouseX <= playButton.x + playButton.width &&
        mouseY >= playButton.y &&
        mouseY <= playButton.y + playButton.height
    ) {
        // Spawn one ball within the narrower range
        const rightPanelStart = leftPanelWidth;
        const rightPanelWidth = width - leftPanelWidth;

        const minX = rightPanelStart + rightPanelWidth * 0.45; // Start closer to center
        const maxX = rightPanelStart + rightPanelWidth * 0.5;  // End closer to center

        const randomX = Math.random() * (maxX - minX) + minX; // Randomize within range
        balls.push(createBall(randomX, -ballRadius)); // Spawn ball
        clickSound.currentTime = 0;
        clickSound.play();
        totalBallsSpawned++; // Increment counter
    }
}

let playButton;

// Modify the game loop to draw the button
function gameLoop() {
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0F212D"; // Background color
    ctx.fillRect(0, 0, width, height);

    // Draw left panel
    ctx.fillStyle = "#172A3A"; // Darker background
    ctx.fillRect(0, 0, leftPanelWidth, height);

    // Update and draw components
    drawStatistics();
    drawPlayButton();
    createScoreCards(); // Ensure scorecards are drawn
    drawPins();
    drawBalls();
    updateBalls();
    drawScoreCards();
    updateAndDrawRipples();
    drawDisplayedMultipliers();

    // Request next frame
    requestAnimationFrame(gameLoop);
}





// Initialize gameboard
createPins()

canvas.addEventListener("click", () => {
    if (balls.length < 50) { // Limit number of active balls
        const rightPanelStart = leftPanelWidth; // Starting x-coordinate of the right panel
        const rightPanelWidth = width - leftPanelWidth; // Width of the right panel

        // Define a narrower spawning range
        const minX = rightPanelStart + rightPanelWidth * 0.45; // Start closer to the center of the right panel
        const maxX = rightPanelStart + rightPanelWidth * 0.5; // End closer to the center of the right panel

        const randomX = Math.random() * (maxX - minX) + minX; // Spawn randomly within the narrower range
        balls.push(createBall(randomX, -ballRadius)); // Spawn ball at random x and above the grid
        totalBallsSpawned++; // Increment the total ball count
        clickSound.currentTime = 0;
        clickSound.play();
    } else {
        errorSound.currentTime = 0;
        errorSound.play();
    }
});



// Start the game loop
gameLoop();
