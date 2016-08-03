var socket = io();

$(function() {
  /**
   * Successfully connected to server event
   */
  socket.on('connect', function() {
    console.log('Connected to server.');
    $('#disconnected').hide();
    $('#waiting-room').show();
  });

  /**
   * Disconnected from server event
   */
  socket.on('disconnect', function() {
    console.log('Disconnected from server.');
    $('#waiting-room').hide();
    $('#game').hide();
    $("#chatbox").hide();
    $('#disconnected').show();
  });

  /**
   * User has joined a game
   */
  socket.on('join', function(gameIds) {
    Game.initGame();
    $('#messages').empty();
    $('#disconnected').hide();
    $('#waiting-room').hide();
    $('#game').show();
    $("#chatbox").show();
    $('#game-number').html(gameIds.id);
    console.log(gameIds.gameid);
  })

  /**
   * Update player's game state
   */
  socket.on('update', function(gameState) {
    Game.setTurn(gameState.turn);
    Game.updateGrid(gameState.gridIndex, gameState.grid);
  });

  /**
   * Game chat message
   */
  socket.on('chat', function(msg) {
    if (msg.name == "Me") {
      $('#messages').append(`
        <div class="row msg_container base_sent">
            <div class="col-md-10 col-xs-10">
                <div class="messages msg_sent">
                    <p>${msg.message}</p>
                </div>
            </div>
            <div class="col-md-2 col-xs-2 avatar">
                <img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class=" img-responsive ">
            </div>
        </div>
        `);
    } else {
      $('#messages').append(`
        <div class="row msg_container base_receive">
            <div class="col-md-2 col-xs-2 avatar">
                <img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class=" img-responsive ">
            </div>
            <div class="col-md-10 col-xs-10">
                <div class="messages msg_receive">
                    <p>${msg.message}</p>
                </div>
            </div>
        </div>
        `);
    }
    // $('#messages').append('<li><strong>' + msg.name + ':</strong> ' + msg.message + '</li>');
    $('#messages-list').scrollTop($('#messages-list')[0].scrollHeight);
  });

  /**
   * Game notification
   */
  socket.on('notification', function(msg) {
    $('#messages').append('<li>' + msg.message + '</li>');
    $('#messages-list').scrollTop($('#messages-list')[0].scrollHeight);
  });

  /**
   * Change game status to game over
   */
  socket.on('gameover', function(isWinner) {
    Game.setGameOver(isWinner);
  });

  /**
   * Leave game and join waiting room
   */
  socket.on('leave', function() {
    $('#game').hide();
    $("#chatbox").hide();
    $('#waiting-room').show();
  });

  /**
   * Send chat message to server
   */
  $('#message-form').submit(function() {
    socket.emit('chat', $('#message').val());
    $('#message').val('');
    return false;
  });

});

/**
 * Send leave game request
 * @param {type} e Event
 */
function sendLeaveRequest(e) {
  e.preventDefault();
  socket.emit('leave');
}

/**
 * Send shot coordinates to server
 * @param {type} square
 */
function sendShot(square) {
  socket.emit('shot', square);
}
