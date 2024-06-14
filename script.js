let steps = 0;

function startGame() {
    steps = 0;
    updateStepCounter();
    let rows = parseInt(document.getElementById('rows').value);
    let cols = parseInt(document.getElementById('cols').value);
    const cardWidth = parseInt(document.getElementById('card-width').value);
    const cardHeight = parseInt(document.getElementById('card-height').value);

    if (isNaN(rows) || rows < 1 || isNaN(cols) || cols < 1 || isNaN(cardWidth) || cardWidth < 50 || isNaN(cardHeight) || cardHeight < 50) {
        alert('Please enter valid numbers for rows, columns, and card dimensions.');
        return;
    }

    let totalCards = rows * cols;

    // Adjust to an even number of total cards if necessary
    if (totalCards % 2 !== 0) {
        alert('Please choose dimensions that result in an even number of total cards.');
        return;
    }

    const colors = generateColors(totalCards / 2);
    const gameContainer = document.getElementById('game-container');
    gameContainer.innerHTML = '';
    gameContainer.style.gridTemplateRows = `repeat(${rows}, ${cardHeight}px)`;
    gameContainer.style.gridTemplateColumns = `repeat(${cols}, ${cardWidth}px)`;

    let revealedCards = [];
    let matchedPairs = 0;

    for (let i = 0; i < totalCards; i++) {
        const card = document.createElement('div');
        card.classList.add('card');
        card.style.width = `${cardWidth}px`;
        card.style.height = `${cardHeight}px`;
        const canvas = document.createElement('canvas');
        canvas.width = cardWidth;
        canvas.height = cardHeight;
        card.appendChild(canvas);
        gameContainer.appendChild(card);
    }

    const cards = document.querySelectorAll('.card');
    colors.sort(() => 0.5 - Math.random());

    cards.forEach((card, index) => {
        const canvas = card.querySelector('canvas');
        const gl = canvas.getContext('webgl');

        if (!gl) {
            console.error(`WebGL not supported for card ${index}`);
            return;
        }

        card.dataset.color = colors[index];

        // Initialize the card with a gray color
        gl.clearColor(0.5, 0.5, 0.5, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        card.addEventListener('click', function() {
            if (revealedCards.length < 2 && !card.classList.contains('revealed')) {
                steps++;
                updateStepCounter();

                const color = card.dataset.color;
                const [r, g, b] = getColorComponents(color);
                gl.clearColor(r, g, b, 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                card.classList.add('revealed');
                revealedCards.push(card);

                if (revealedCards.length === 2) {
                    const [firstCard, secondCard] = revealedCards;
                    if (firstCard.dataset.color === secondCard.dataset.color) {
                        revealedCards = [];
                        matchedPairs++;
                        if (matchedPairs === totalCards / 2) {
                            alert(`You have matched all pairs in ${steps} steps!`);
                        }
                    } else {
                        setTimeout(() => {
                            hideCard(firstCard);
                            hideCard(secondCard);
                            revealedCards = [];
                        }, 1000);
                    }
                }
            }
        });
    });
}

function generateColors(pairs) {
    const colors = [];
    for (let i = 0; i < pairs; i++) {
        const color = getRandomColor();
        colors.push(color, color);
    }
    return colors;
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getColorComponents(color) {
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    return [r, g, b];
}

function hideCard(card) {
    const canvas = card.querySelector('canvas');
    const gl = canvas.getContext('webgl');
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    card.classList.remove('revealed');
}

function updateStepCounter() {
    document.getElementById('step-counter').textContent = `Steps: ${steps}`;
}
