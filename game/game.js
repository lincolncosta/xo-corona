/**
  Xô Corona. 
  Covid-19 take place in the Exploding Kittens game.
  Copyright (C) 2020 Lincoln Costa

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
*/

var Player = require('./player');
var $ = require('./constants');
var Card = require('./card');
var CardSet = require('./cardset');

/**
 * A game on the server
 * @param {Object} id  The game id
 * @param {String} title The game title
 */
var Game = function(id, title) {

    //Game id
    this.id = id;

    //Game title
    this.title = title;

    //Game status. WAITING or PLAYING.
    this.status = $.GAME.STATUS.WAITING;

    //Array of connected players
    this.players = [];
    
    //Cards in the draw pile
    this.drawPile = [];

    //Cards in the discard pile
    this.discardPile = [];

    //Index of the current user playing
    this.cUserIndex = 0;

    //Min players to start the game
    this.minPlayers = 2;
    
    //The turn direction (1 = top to bottom, -1 = bottom to top)
    this.direction = 1;

    //*************** Settings *******************

    //Amount of players allowed in game
    this.maxPlayers = 8;
    
    //The amount of time before nopes stop in milliseconds
    this.nopeTime = 5000;
    
};

/**
 * Return a sanitized version of the game
 * @returns {Object} A sanitized version of the game
 */
Game.prototype.sanitize = function() {
    return {
        id: this.id,
        title: this.title,
        status: this.status,
        players: this.getPlayers(),
        currentPlayerIndex: this.cUserIndex,
        drawPileLength: this.drawPile.length,
        nopeTime: this.nopeTime
    }
}

/**
 * Add a player to the game
 * @param   {Object} user A user
 * @returns {Boolean}  Whether adding a player is successful
 */
Game.prototype.addPlayer = function (user) {
    if (this.status === $.GAME.STATUS.PLAYING) return false;
    var connected = this.isPlayerConnected(user);

    if (this.players.length + 1 > this.maxPlayers || connected)
        return false;

    if (!connected)
        this.players.push(new Player(user));

    return true;
}

/**
 * Remove a player from the game
 * @param {Object} user A user
 */
Game.prototype.removePlayer = function (user) {
    var index = this.playerIndexForUser(user);
    if (index >= 0)
        this.players.splice(index, 1);
}

/**
 * Get a sanitized version of game players.
 * This makes sure you don't send hand data to the others
 * @returns {Array} An array of players
 */
Game.prototype.getPlayers = function() {
    var players = [];
    for (var key in this.players) {
        var player = this.players[key];
        players.push({
            user: player.user,
            ready: player.ready,
            alive: player.alive,
            drawAmount: player.drawAmount,
            cardCount: player.hand.length
        });
    }
    
    return players;
}

/**
 * Get a player for the associated user
 * @param   {Object} user The user
 * @returns {Object} Returns player or null
 */
Game.prototype.getPlayer = function(user) {
    var index = this.playerIndexForUser(user);
    return (index >= 0) ? this.players[index] : null;
}

/**
 * The current game host.
 * It is always the first person in the array
 * @returns {Object} Returns a user or null
 */
Game.prototype.gameHost = function() {
    return (this.players.length > 0) ? this.players[0].user : null;
}

/**
 * The player index for a given user in connected player array.
 * @param   {Object} user The user
 * @returns {Number} Returns index if found else -1
 */
Game.prototype.playerIndexForUser = function (user) {
    for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];
        if (player.user === user)
            return i;
    }

    return -1;
}

/**
 * Check whether a player is connected to the game
 * @param   {Object} user The user associated with the player
 * @returns {Boolean} Whether player is connected
 */
Game.prototype.isPlayerConnected = function (user) {
    return (this.playerIndexForUser(user) >= 0);
}

/**
 * Generate a random id
 * @returns {String}   A random id
 */
Game.prototype.generateRandomID = function() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Start the game.
 *
 * @returns {Boolean} If game started
 */
Game.prototype.start = function () {
    //Check if we can start/have already started
    if (this.players.length < this.minPlayers || this.status === $.GAME.STATUS.PLAYING)
        return false;
    
    //Only start if all the players are ready
    for (var key in this.players) {
        var player = this.players[key];
        if (!player.ready) return false;
    }

    //We call a reset incase
    this.reset();
    this.status = $.GAME.STATUS.PLAYING;
    
    //Give each player a diffuse and 4 random card from the pile
    for (var key in this.players) {
        var player = this.players[key];
        player.addCard(new Card(this.generateRandomID(), 'Prevenção', $.CARD.PREVENTION, 'a', 'Salvará o jogador que a possuir caso o mesmo encontre uma carta de contaminação.'));
        this.drawCards(player, 4);
    }
    
    //Add in bombs
    for (var i = 0; i < this.players.length - 1; i ++) {
        this.drawPile.push(new Card(this.generateRandomID(), 'Contaminação', $.CARD.INFECTION, 0, 'Infectará o jogador que encontrar a carta a menos que o mesmo possua uma carta de Prevenção.'));
    }
    
    //Add in extra defuses to negate the lack of nopes
    var multiplier = (this.players.length > 5) ? 2 : 1;
    var count = (6 * multiplier) - this.players.length;
    for (var i = 0; i < count; i++) {
        this.drawPile.push(new Card(this.generateRandomID(), 'Prevenção', $.CARD.PREVENTION, 0, 'Salvará o jogador que a possuir caso o mesmo encontre uma carta de contaminação.'));
    }
    
    this.shuffleDeck();
    
    return true;
}

/**
 * Stop the game
 * @returns {Boolean} If game stopped
 */
Game.prototype.stop = function() {
    if ((this.playerAliveCount() < 2 || this.players.length < this.minPlayers) && this.status === $.GAME.STATUS.PLAYING) {
        this.reset();
        this.status = $.GAME.STATUS.WAITING;
        return true;
    }
    return false;
}

/**
 * Count the amount of players alive
 * @returns {Number} Amount of players alive
 */
Game.prototype.playerAliveCount = function() {
    var count = 0;
    for (var key in this.players) {
        var player = this.players[key];
        if (player.alive) {
            count += 1;
        }
    }
    
    return count;
}

/**
 * Increment a given index and return the new value
 * @param {Number} index The index to increment
 * @returns {Number} The next index
 */
Game.prototype.increment = function(index) {
    if (index + this.direction < 0) {
        index = this.players.length - 1;
    } else if (index + this.direction >= this.players.length) {
        index = 0;
    } else {
        index += this.direction;
    }
    
    return index;
}

/**
 * Get the index of the next alive player
 * @param   {Number} start The start index
 * @returns {Number} The index of the next player
 */
Game.prototype.getNextAliveIndex = function(start) {
    var next = this.increment(start);
    
    //Go to the next alive player
    while(this.playerAliveCount() > 1 && !this.players[next].alive) {
        next = this.increment(next);
    }
    
    return next;
}

/**
 * Get the next alive player
 * @param   {Number} start The start index
 * @returns {Object} The next alive player
 */
Game.prototype.getNextAlive = function(start) {
    return this.players[this.getNextAliveIndex(start)];
}

/**
 * Get player for the current user index
 * @returns {Object} The player
 */
Game.prototype.playerForCurrentIndex = function() {
    return this.players[this.cUserIndex];
}

/**
 * Draw cards from the pile and adds it to the players hand
 * @param   {Object} player The player
 * @param   {Number} amount Amount of cards to draw
 * @returns {Array}  An array of cards drawn
 */
Game.prototype.drawCards = function(player, amount) {
    
    if (amount > 0) {
        var cards = this.drawPile.splice(0, amount);
        player.addCards(cards);
        return cards;
    }
    
    return [];
}

/**
 * Explode a player
 * @param {Object} player The player
 */
Game.prototype.explodePlayer = function(player) {
    player.alive = false;
    
    //Add the hand to the discard pile
    for (var key in player.hand) {
        var card = player.hand[key];
        var set = new CardSet(player, [card]);
        this.discardPile.push(set);
    }
    player.hand = [];
}

/**
 * Reset the game
 */
Game.prototype.reset = function (){
    this.status = $.GAME.STATUS.WAITING;
    this.drawPile = [];
    this.discardPile = [];
    this.cUserIndex = 0;

    //Reset players
    for (var key in this.players) {
        var player = this.players[key];
        player.reset();
    }
    
    //Reset deck
    this.resetDeck();
    this.shuffleDeck();
}

/**
 * Reset the deck
 * Note: This doesn't add defuse and explode cards
 */
Game.prototype.resetDeck = function() {
    /*
    A deck consists of:
    4 Ataque cards
    4 Pular cards
    4 Favor cards
    4 Embaralhar cards
    5 Prever cards
    4 x 5 Coringa cards
    More than 5 players then deck size doubles
    */
    
    this.drawPile = [];
    
    var multiplier = (this.players.length > 5) ? 2 : 1;
    
    //Generate cards
    for (var i = 0; i < 5 * multiplier; i++) {
        if (i < 4 * multiplier) {
            //Special
            this.drawPile.push(new Card(this.generateRandomID(), 'Ataque', $.CARD.ATTACK, 0, 'Faz com que o próximo jogador compre uma carta extra durante a sua rodada e isenta o aplicante do efeito de comprar uma carta ao final do turno.'));
            this.drawPile.push(new Card(this.generateRandomID(), 'Pular', $.CARD.SKIP, 1, 'Faz com que o jogador termine o seu turno sem precisar comprar uma carta do deck. É uma ação que pode ser anulada pela carta de Cancelamento.'));
            this.drawPile.push(new Card(this.generateRandomID(), 'Favor', $.CARD.FAVOR, 2, 'Pede uma carta para qualquer jogador escolhido, a carta dada será de escolha do mesmo. É uma ação que pode ser anulada pela carta de Cancelamento.'));
            this.drawPile.push(new Card(this.generateRandomID(), 'Embaralhar', $.CARD.SHUFFLE, 3, 'Embaralha a pilha de cartas.'));
            
            //Only add the reverse if we have more than 2 players since with 2 people order doesn't matter
            // if (this.players.length > 2) {
            //     this.drawPile.push(new Card(this.generateRandomID(), 'Reverse', $.CARD.REVERSE, 3));
            // }
            
            //Coringa
            this.drawPile.push(new Card(this.generateRandomID(), 'alcool', $.CARD.REGULAR, 4, 'É uma carta coringa, mas apesar do nome, não têm nada de especial e somente pode ser descartada em pares. Ao fazer, o jogador que descartou deve pegar uma carta aleatória da mão de qualquer adversário a sua escolha.'));
            this.drawPile.push(new Card(this.generateRandomID(), 'lenços-umidecidos', $.CARD.REGULAR, 5, 'É uma carta coringa, mas apesar do nome, não têm nada de especial e somente pode ser descartada em pares. Ao fazer, o jogador que descartou deve pegar uma carta aleatória da mão de qualquer adversário a sua escolha.'));
            this.drawPile.push(new Card(this.generateRandomID(), 'mascara', $.CARD.REGULAR, 6, 'É uma carta coringa, mas apesar do nome, não têm nada de especial e somente pode ser descartada em pares. Ao fazer, o jogador que descartou deve pegar uma carta aleatória da mão de qualquer adversário a sua escolha.'));
            this.drawPile.push(new Card(this.generateRandomID(), 'lenços-papel', $.CARD.REGULAR, 7, 'É uma carta coringa, mas apesar do nome, não têm nada de especial e somente pode ser descartada em pares. Ao fazer, o jogador que descartou deve pegar uma carta aleatória da mão de qualquer adversário a sua escolha.'));
            this.drawPile.push(new Card(this.generateRandomID(), 'agua', $.CARD.REGULAR, 8, 'É uma carta coringa, mas apesar do nome, não têm nada de especial e somente pode ser descartada em pares. Ao fazer, o jogador que descartou deve pegar uma carta aleatória da mão de qualquer adversário a sua escolha.'));
        }
        
        this.drawPile.push(new Card(this.generateRandomID(), 'Prever', $.CARD.FUTURE, 9, 'Mostrará ao jogador que a utilizou as primeiras 3 cartas no topo do deck. É uma ação que pode ser anulada pela carta de Cancelamento.'));
        this.drawPile.push(new Card(this.generateRandomID(), 'Cancelamento', $.CARD.NOPE, 3, 'Cancela o efeito da última carta jogada. Sempre que for possível utilizá-la, a interface exibirá um botão de ação.'));
    }
}

/**
 * Embaralhar the deck of cards
 * @returns {Object} The shuffled deck
 */
Game.prototype.shuffleDeck = function() {
  for (var i = this.drawPile.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = this.drawPile[i];
        this.drawPile[i] = this.drawPile[j];
        this.drawPile[j] = temp;
    }
    return this.drawPile;
}

/**
 * Toggle the ready state of a user
 * @param   {Object} user The user
 * @returns {Boolean} Whether the user is ready
 */
Game.prototype.toggleReady = function(user) {
    var player = this.getPlayer(user);
    if (player) {
        player.ready = !player.ready;
        return player.ready;
    }
    
    return false;
}

/**
 * Check whether we can start a game
 * @returns {Boolean} Whether we can start a game
 */
Game.prototype.canStart = function() {
    if (this.players.length >= this.minPlayers) {
        //Make sure everyone is ready
        for (var key in this.players) {
            var player = this.players[key];
            if (!player.ready) return false;
        }
        
        return true;
    }
    
    return false;
}

/**
 * Get the discard pile of cards
 * @returns {Array} An array of cards in the discard pile
 */
Game.prototype.getDiscardPile = function() {
    var pile = [];
    
    //We have to iterate backwards from the pile so that the recently played cards are at the top
    for(var i = this.discardPile.length - 1; i >= 0; i--) {
        var cards = this.discardPile[i].cards;
        pile = pile.concat(cards);
    }
    
    return pile;
}

/**
 * Get the last played set in discard which isn't a nope
 * @returns {Object} The last set in discard
 */
Game.prototype.getLastDiscardSet = function() {
    var last = null;
    for (var i = this.discardPile.length - 1; i >= 0; i--) {
        var set = this.discardPile[i];
        var hasCancelamento = set.cards.length == 1 && set.hasCardType($.CARD.NOPE);
        if (!hasCancelamento) {
            last = set;
            break;
        }
    }
    return last;
}

/**
 * Update a discarded set if it is in the discard pile
 * @param {Object} set The card set
 */
Game.prototype.updateDiscardSet = function(set) {
    for (var key in this.discardPile) {
        if (this.discardPile[key].id === set.id) {
            this.discardPile[key].cards = set.cards;
            this.discardPile[key].nopeAmount = set.nopeAmount;
            this.discardPile[key].nopePlayed = set.nopePlayed;
            this.discardPile[key].effectPlayed = set.effectPlayed;
            break;
        }
    }
}

module.exports = Game;