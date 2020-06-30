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

var User = require('./user');
var Game = require('./game');
var $ = require('./constants');

/**
 * Main game manager
 * @param {Object} io Socket.io object
 */
var EK = function(io) {
    
    //List of all the current users
    this.connectedUsers = {};
    
    //List of all the current games
    this.gameList = {};
    
    //List of pending card sets to be processed
    this.pendingSets = {};
}

/**
 * Check if a user with the given name is connected
 * @param   {String}  nickname The name
 * @returns {Boolean} Given name is connected
 */
EK.prototype.isUserWithNameConnected = function(nickname) {
    var connected = false;
    
    for(var key in this.connectedUsers) {
        var user = this.connectedUsers[key];
        if (user.name === nickname) {
            connected = true;
            break;
        }
    }
        
    return connected;
}

/**
 * Add a user to the connected users
 * @param {Object} user The user
 */
EK.prototype.addUser = function(user) {
    if (!(user.id in this.connectedUsers)) {
        this.connectedUsers[user.id] = user;
    }
}

/**
 * Remove a user from connected users
 * @param {Object} user The user
 */
EK.prototype.removeUser = function(user) {
    if (user.id in this.connectedUsers) {
        delete this.connectedUsers[user.id];
    }
}

/**
 * Add a game to the game list
 * @param {Object} game The game
 */
EK.prototype.addGame = function(game) {
    if (!(game.id in this.gameList)) {
        this.gameList[game.id] = game;
    }
}

/**
 * Remove a game from the game list
 * @param {Object} game The game
 */
EK.prototype.removeGame = function(game) {
    if (game.id in this.gameList) {
        delete this.gameList[game.id];
    }
}

/**
 * Add a pending set to the list
 * @param {Object} set    The card set
 * @param {Object} data   The data associated with the set
 * @param {Object} socket The socket
 */
EK.prototype.addPendingSet = function(set, data, socket) {
    this.pendingSets[set.id] = {
        set: set,
        data: data,
        socket: socket
    };
}

/**
 * Remove a set from the pending set list
 * @param {Object} set A card set
 */
EK.prototype.removePendingSet = function(set) {
    if (set.id in this.pendingSets) {
        delete this.pendingSets[set.id];
    }
}

/**
 * Generate a random id
 * @returns {String}   A random id
 */
EK.prototype.generateRandomID = function() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate a random image number
 * @param   {Integer} min Min number
 * @param   {Integer} min Max number
 * @returns {String}   A random integer
 */
EK.prototype.generateRandomBetween = function (min, max) {
    return parseInt(Math.random() * ((max + 1) - min) + min);
}

module.exports = EK;