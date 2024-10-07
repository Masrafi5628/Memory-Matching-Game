let steps = 0;

function startGame() {
  steps = 0;
  updateStepCounter();
  let rows = parseInt(document.getElementById("rows").value);
  let cols = parseInt(document.getElementById("cols").value);
  const cardWidthElement = document.getElementById("card-width");
  const cardWidth = cardWidthElement ? parseInt(cardWidthElement.value) : 100;
  const cardHeightElement = document.getElementById("card-height");
  const cardHeight = cardHeightElement ? parseInt(cardHeightElement.value) : 100;

  if (
    isNaN(rows) ||
    rows < 1 ||
    isNaN(cols) ||
    cols < 1 ||
    isNaN(cardWidth) ||
    cardWidth < 50 ||
    isNaN(cardHeight) ||
    cardHeight < 50
  ) {
    alert("Please enter valid numbers for rows, columns, and card dimensions.");
    return;
  }

  let totalCards = rows * cols;
  if (totalCards % 2 !== 0) {
    alert("Please choose dimensions that result in an even number of total cards.");
    return;
  }

  const colors = generateColors(totalCards / 2);
  const gameContainer = document.getElementById("game-container");
  gameContainer.innerHTML = "";
  gameContainer.style.gridTemplateRows = `repeat(${rows}, ${cardHeight}px)`;
  gameContainer.style.gridTemplateColumns = `repeat(${cols}, ${cardWidth}px)`;

  let revealedCards = [];
  let matchedPairs = 0;

  for (let i = 0; i < totalCards; i++) {
    const card = document.createElement("div");
    card.classList.add("card");
    card.style.width = `${cardWidth}px`;
    card.style.height = `${cardHeight}px`;
    const canvas = document.createElement("canvas");
    canvas.width = cardWidth;
    canvas.height = cardHeight;
    card.appendChild(canvas);
    gameContainer.appendChild(card);
  }

  const cards = document.querySelectorAll(".card");
  colors.sort(() => 0.5 - Math.random());

  cards.forEach((card, index) => {
    const canvas = card.querySelector("canvas");
    const gl = canvas.getContext("webgl");

    if (!gl) {
      console.error(`WebGL not supported for card ${index}`);
      return;
    }

    card.dataset.color = colors[index];

    // Initialize the card with a gray color using shaders
    initShaders(gl);
    drawCard(gl, [0.5, 0.5, 0.5], { scale: 1, rotation: 1, translate: [0, 0] });

    card.addEventListener("click", function () {
      if (revealedCards.length < 2 && !card.classList.contains("revealed")) {
        steps++;
        updateStepCounter();

        const color = card.dataset.color;
        const [r, g, b] = getColorComponents(color);

        // Rotate card by 45 degrees (for effect)
        const rotation = Math.PI / 4; // 45 degrees in radians
        drawCard(gl, [r, g, b], { scale: 1.1, rotation, translate: [0, 0] });
        card.classList.add("revealed");
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

function drawCard(gl, color, transform) {
  const { scale, rotation, translate } = transform;

  const vertices = new Float32Array([
    -1.0, 1.0,
    -1.0, -1.0,
    1.0, 1.0,
    1.0, -1.0,
  ]);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const a_Position = gl.getAttribLocation(gl.program, "a_Position");
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  const u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], 1.0);

  const u_Transform = gl.getUniformLocation(gl.program, "u_Transform");

  // Create a transformation matrix (scaling, rotation, and translation combined)
  const transformMatrix = createTransformationMatrix(scale, rotation, translate);
  gl.uniformMatrix3fv(u_Transform, false, transformMatrix);

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function createTransformationMatrix(scale, rotation, translate) {
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);

  return new Float32Array([
    scale * cosR, scale * sinR, 0,
    -scale * sinR, scale * cosR, 0,
    translate[0], translate[1], 1,
  ]);
}

function initShaders(gl) {
  const vertexShaderSource = `
        attribute vec4 a_Position;
        uniform mat3 u_Transform;
        void main() {
            gl_Position = vec4(u_Transform * vec3(a_Position.xy, 1.0), 1.0);
        }
    `;

  const fragmentShaderSource = `
        precision mediump float;
        uniform vec4 u_FragColor;
        void main() {
            gl_FragColor = u_FragColor;
        }
    `;

  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error("Could not initialize shaders");
    return null;
  }

  gl.useProgram(shaderProgram);
  gl.program = shaderProgram;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(`Error compiling shader: ${gl.getShaderInfoLog(shader)}`);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function hideCard(card) {
  const canvas = card.querySelector("canvas");
  const gl = canvas.getContext("webgl");
  drawCard(gl, [0.5, 0.5, 0.5], { scale: 1, rotation: 0, translate: [0, 0] });
  card.classList.remove("revealed");
}

function getColorComponents(color) {
  const r = parseInt(color.slice(1, 3), 16) / 255;
  const g = parseInt(color.slice(3, 5), 16) / 255;
  const b = parseInt(color.slice(5, 7), 16) / 255;
  return [r, g, b];
}

function generateColors(numPairs) {
  const colors = [];
  for (let i = 0; i < numPairs; i++) {
    const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
    colors.push(color, color);
  }
  return colors;
}

function updateStepCounter() {
  document.getElementById("steps").textContent = steps;
}


