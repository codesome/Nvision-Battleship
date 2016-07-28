var grid = [],
    gridHeight = 361, gridWidth = 361, gridBorder = 1,
    gridRows = 10, gridCols = 10, markPadding = 10, shipPadding = 3,
    squareHeight = (gridHeight - gridBorder * gridRows - gridBorder) / gridRows,
    squareWidth = (gridWidth - gridBorder * gridCols - gridBorder) / gridCols,
    turn = false, gameStatus, squareHover = { x: -1, y: -1 };

function drawSquares(context) {
  console.log('came');
  var i, j, squareX, squareY;

  context.fillStyle = '#222222'
  context.fillRect(0, 0, gridWidth, gridHeight);

  for(i = 0; i < gridRows; i++) {
    for(j = 0; j < gridCols; j++) {
      squareX = j * (squareWidth + gridBorder) + gridBorder;
      squareY = i * (squareHeight + gridBorder) + gridBorder;

      context.fillStyle = '#7799FF';

      context.fillRect(squareX, squareY, squareWidth, squareHeight);
    }
  }
};
