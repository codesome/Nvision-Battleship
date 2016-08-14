var grid = [],
    gridHeight = 361, gridWidth = 361, gridBorder = 1,
    gridRows = 10, gridCols = 10, markPadding = 10, shipPadding = 3,
    squareHeight = (gridHeight - gridBorder * gridRows - gridBorder) / gridRows,
    squareWidth = (gridWidth - gridBorder * gridCols - gridBorder) / gridCols,
    turn = false, gameStatus, squareHover = { x: -1, y: -1 };

function drawSquares(context) {
  var i, j, squareX, squareY;

  context.fillStyle = '#222222'
  context.fillRect(0, 0, gridWidth, gridHeight);

  for(i = 0; i < gridRows; i++) {
    for(j = 0; j < gridCols; j++) {
      squareX = j * (squareWidth + gridBorder) + gridBorder;
      squareY = i * (squareHeight + gridBorder) + gridBorder;

      context.fillStyle = '#c49754';

      context.fillRect(squareX, squareY, squareWidth, squareHeight);
    }
  }
};

function drawShips(context,ships) {
  var ship, i, x, y,
      shipWidth, shipLength;

  context.fillStyle = '#444444';

  for(i = 0; i < ships.length; i++) {
    ship = ships[i];

    x = ship.x * (squareWidth + gridBorder) + gridBorder + shipPadding;
    y = ship.y * (squareHeight + gridBorder) + gridBorder + shipPadding;
    shipWidth = squareWidth - shipPadding * 2;
    shipLength = squareWidth * ship.size + (gridBorder * (ship.size - 1)) - shipPadding * 2;

    if(ship.horizontal) {
      context.fillRect(x, y, shipLength, shipWidth);
    } else {
      context.fillRect(x, y, shipWidth, shipLength);
    }
  }
};

function drawMarks(box) {
  var i = box.y, j = box.x, squareX, squareY, context;
  if(box.player == 0){
    context = document.getElementById('canvas2').getContext('2d');
  } else if(box.player == 1){
    context = document.getElementById('canvas1').getContext('2d');
  }

      squareX = j * (squareWidth + gridBorder) + gridBorder;
      squareY = i * (squareHeight + gridBorder) + gridBorder;

      // draw black cross if there is a missed shot on square
      if(box.type == 'miss') {
        context.beginPath();
        context.moveTo(squareX + markPadding, squareY + markPadding);
        context.lineTo(squareX + squareWidth - markPadding, squareY + squareHeight - markPadding);
        context.moveTo(squareX + squareWidth - markPadding, squareY + markPadding);
        context.lineTo(squareX + markPadding, squareY + squareHeight - markPadding);
        context.strokeStyle = '#000000';
        context.stroke();
      }
      // draw red circle if hit on square
      else if(box.type == 'hit') {
        context.beginPath();
        context.arc(squareX + squareWidth / 2, squareY + squareWidth / 2,
                               squareWidth / 2 - markPadding, 0, 2 * Math.PI, false);
        context.fillStyle = '#E62E2E';
        context.fill();
      }
};

var currentShot = -1;
var playInProgress = false;
$(document).ready(function(){

  $("#next").click(function(){
    if(currentShot != allShots.length-1){
      drawMarks(allShots[++currentShot]);
      if(allShots[currentShot].player) {
        $("#commentary").html(player2 + " shot " + player1 + " at (" + (allShots[currentShot].y+1) + "," + (allShots[currentShot].x+1) + ")");
      } else {
        $("#commentary").html(player1 + " shot " + player2 + " at (" + (allShots[currentShot].y+1) + "," + (allShots[currentShot].x+1) + ")");
      }
    } else {
      $("#commentary").html("End");
      $("#pause").click();
    }

  });

  $("#previous").click(function(){
    if(playInProgress){
      $("#pause").click();
    }
    if(currentShot>=0){
      context1.clearRect(0,0,canvas1.width,canvas1.height);
      context2.clearRect(0,0,canvas2.width,canvas2.height);
      drawSquares(context1);
      drawSquares(context2);
      drawAllShips();
      currentShot--;
      for(var i=0 ; i<=currentShot ; i++){
        drawMarks(allShots[i]);
      }
      $("#commentary").html(player1 + " vs " + player2);
    }
  });

  $("#play").click(function(){
    playInProgress = true;
    $(this).hide();
    $("#pause").show();
    function nextTurn() {
      $("#next").click();
      setTimeout(function(){
        if(playInProgress) {
          nextTurn();
        }
      },1000);
    }
    nextTurn();
  });

  $("#pause").click(function(){
    playInProgress = false;
    $(this).hide();
    $("#play").show();
  });

  $("#stop").click(function(){
    playInProgress = false;
    $("#pause").hide();
    $("#play").show();
    context1.clearRect(0,0,canvas1.width,canvas1.height);
    context2.clearRect(0,0,canvas2.width,canvas2.height);
    drawSquares(context1);
    drawSquares(context2);
    drawAllShips();
    currentShot = -1;
    $("#commentary").html(player1 + " vs " + player2);
  });

});
