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

var Helper = {
    /**
     * Sort by a given field.
     * Used in conjunction with Array.sort()
     * 
     * @param   {String} field  The field/property to sort by
     * @param   {Boolean} ascending Ascending sort
     * @param   {Function} primer  function to prime/ready the data for sort
     */
    sortBy: function (field, ascending, primer) {
        var key = function (x) { return primer ? primer(x[field]) : x[field] };

        return function (a, b) {
            var A = key(a), B = key(b);
            return ((A < B) ? -1 : ((A > B) ? 1 : 0)) * [-1, 1][+!!ascending];
        }
    }
}

var Login = {

    /**
     * Show an error on the login page
     * @param {String} error The error
     */
    showError: function (error) {
        $('#login .error').text(error);
        $('#login .error').fadeIn("slow");
    },

    show: function () {
        $('#login').show();
    },

    hide: function () {
        $('#login').hide();
    }
};

var Lobby = {

    show: function () {
        $('#lobby').show();
    },

    hide: function () {
        $('#lobby').hide();
    },

    /**
     * Update the user list display
     */
    updateUserList: function (EK) {
        //Clear users
        $('#userList .content').empty();

        //Add user to the list
        var sorted = Object.keys(EK.users).map(function (key) {
            return EK.users[key];
        });
        sorted.sort(Helper.sortBy('name', true));
        $.each(sorted, function (key, user) {
            var html = "<div class='user' data-id='" + user.id + "'>" + user.name + "</div>";

            //Check that we don't double up on adding users
            if ($("#userList .content .user[data-id='" + user.id + "']").length < 1) {
                $('#userList .content').append(html);
            }
        });

        //Set the user count
        $('#userList .top-bar').text('Usuários conectados (' + Object.keys(EK.users).length + ')');

    },

    /**
     * Update the game list display
     */
    updateGameList: function (EK) {
        //Clear games
        $('#gameList .content').empty();

        //Add games to the list
        $.each(EK.games, function (id, game) {
            var disabledString = (game.status === $C.GAME.STATUS.PLAYING) ? 'disabled' : '';
            var html = "<div class='game' data-id='" + game.id + "'>" +
                "<div id='top'>" +
                "<div id='title'>" + game.title + "</div>" +
                "<div id='status'>" + game.status + " jogadores.</div>" +
                "<div id='players'>Jogadores: " + game.players.length + "</div>" +
                "</div>" +
                "<div id='bottom'>" +
                "<button id='joinGameButton' data-id='" + game.id + "' class='btn btn-success btn-block " + disabledString +
                "' type='button'>Entrar</button>" +
                "</div>" +
                "</div>";


            //Check that we don't double up on adding games
            if ($(".game[data-id='" + game.id + "']").length < 1) {
                $('#gameList .content').append(html);

            }

        });

    }

};

var GameRoom = {

    /**
     * Update the room
     * @param {Object} EK The main game instance
     */
    update: function (EK) {
        this.updateCardDisplay(EK);
        this.updateInputDisplay(EK);
        this.updatePlayerList(EK);
        this.updateGameOverlay(EK);
        this.updatePlayAreaDisplay(EK);
    },

    /**
     * Update the start, ready, play and end turn buttons
     * @param {Object} EK The main game instance
     */
    updateInputDisplay: function (EK) {
        var user = EK.getCurrentUser();
        var game = EK.getCurrentUserGame();
        if (user && game) {
            var waitingInput = $('#waitingInput');
            var playingInput = $('#playingInput');
            var startButton = $('#startGameButton');
            var readyButton = $('#readyGameButton');
            var playButton = $('#playGameButton');
            var drawButton = $('#drawGameButton');
            var playArea = $('#playArea');
            var nopeButton = $('#nopeGameButton');

            if (game.status === $C.GAME.STATUS.WAITING) {
                waitingInput.show();
                playingInput.hide();
                playArea.hide();

                //Show and hide the buttons
                if (game.isGameHost(user)) {
                    startButton.show();
                    readyButton.hide();
                } else {
                    startButton.hide();
                    readyButton.show();

                    //Toggle the display of the ready game button
                    var player = game.getPlayer(user);
                    var text = (player.ready) ? "Não Pronto" : "Pronto";
                    readyButton.text(text);
                }

            } else if (game.status == $C.GAME.STATUS.PLAYING) {
                waitingInput.hide();
                playingInput.show();
                playArea.show();

                var currentPlayer = game.getCurrentPlayer();
                if (currentPlayer && currentPlayer.user === user.id) {
                    playButton.show();
                    drawButton.show();
                    nopeButton.hide();

                    if (currentPlayer.lockdown) {
                        playButton.text("Você está em lockdown e não pode descartar agora.");
                    } else {
                        playButton.text("Jogar");
                    }

                    if ($("#playingInput .card[data-selected='true']").length < 1) {
                        drawButton.show();
                        playButton.hide();
                    } else {
                        playButton.show();
                        drawButton.hide();
                    }

                    if (this.shouldEnablePlayButton(EK)) {
                        playButton.prop("disabled", false);
                    } else {
                        playButton.prop("disabled", true);
                    }
                } else {
                    playButton.hide();
                    drawButton.hide();
                }

                //Show nope button if we have a set and a nope card
                if (EK.gameData.currentPlayedSet && EK.gameData.hasCardTypeInHand($C.CARD.NOPE)) {
                    var currentPlayer = game.getCurrentPlayer();

                    //If we are the current player and the set has an even amount of nopes then disable the nope button
                    if (currentPlayer && currentPlayer.user === user.id &&
                        (EK.gameData.currentPlayedSet.nopeAmount % 2 == 0)) {
                        nopeButton.addClass('disabled');
                    } else {
                        nopeButton.removeClass('disabled');
                    }

                    nopeButton.show();
                } else {
                    nopeButton.hide();
                }
            }
        }
    },

    /**
     * Update all cards in current game.
     * All cards get auto deselected.
     * @param {Object} EK The main game instance
     */
    updateCardDisplay: function (EK) {
        var sortedHand = EK.gameData.hand;
        sortedHand.sort(Helper.sortBy('name', true));

        //Update current playing card display
        this.updateCardsForElement(sortedHand, $('#playingInput #cardDisplay'));

        //Update give popup card display
        this.updateCardsForElement(sortedHand, $('#givePopup #cardDisplay'));

        //Update discard popup card display
        var sortedDiscards = EK.gameData.getDiscardPileWithoutExplode();
        sortedDiscards.sort(Helper.sortBy('name', true));

        this.updateCardsForElement(sortedDiscards, $('#discardStealPopup #cardDisplay'));
        this.updateCardsForElement(EK.gameData.discardPile, $('#discardPilePopup #cardDisplay'));

        //Get top 6 cards for discard pile display
        var discards = [];
        var pile = EK.gameData.discardPile;
        if (pile.length > 0) {
            var num = Math.min(1, pile.length);
            for (var i = 0; i < num; i++) {
                var card = pile[i];
                discards.push(card);
            };
        }
        this.updateCardsForElement(discards, $('#playArea #cardDisplay'));

        //Update named popup card display
        $('#namedStealPopup #cardDisplay').empty();
        $.each($C.CARD, function (key, type) {
            if (type != $C.CARD.INFECTION) {
                var html = "<div data-selected='false' data-type='" + type + "' class='card noselect card-" + type.toLowerCase() + "'></div>";
                $('#namedStealPopup #cardDisplay').append(html);
            }
        });
    },

    updateCardsForElement: function (cards, element) {
        //Clear cards
        element.empty();

        $.each(cards, function (index, card) {
            var html = "<div data-selected='false' data-id='" + card.id + "' class='card noselect card-" + card.image + "'><span class='tooltiptext'>" + card.effect + "</span></div>";

            element.append(html);

        });
    },

    /**
     * Update the play area display
     * @param {Object} EK The main game instance
     */
    updatePlayAreaDisplay: function (EK) {
        var game = EK.getCurrentUserGame();
        if (game) {
            $('#playArea #text').text('Deck de cartas (' + game.drawPileLength + ' restantes)');
        }
    },

    /**
     * Update the player display
     * @param {Object} EK The main game instance
     */
    updatePlayerList: function (EK) {
        if (EK.getCurrentUser() && EK.getCurrentUserGame()) {
            var game = EK.getCurrentUserGame();

            //Clear players
            $('#playerList .content').empty();

            //Add players to the list
            $.each(game.players, function (index, player) {
                var user = EK.users[player.user];
                var classString = (game.isGameHost(user)) ? "status-blue" : "";
                var html = "<div class='user data-id='" + user.id + "'>" +
                    "<div id='name' class='" + classString + "'>" + user.name + "</div>" +
                    "<div class='status status-" + player.statusColor(game) + "'>" + player.status(game) + "</div>";

                //Add card counts
                if (game.status == $C.GAME.STATUS.PLAYING) {
                    html += "<div class='status status-grey'>" + (player.cardCount || 0) + "</div>";
                }

                html += "</div>";

                //Check that we don't double up on adding users
                if ($("#playerList .content .user[data-id='" + user.id + "']").length < 1) {
                    $('#playerList .content').append(html);
                }
            });

            //Set the user count
            $('#playerList .top-bar').text('Jogadores conectados (' + game.players.length + ')');

        }
    },

    /**
     * Update the overlays in game
     * @param {Object} EK The main game instance
     */
    updateGameOverlay: function (EK) {
        this.updateGiveOverlay(EK);
        this.updatePlayerSelectOverlays(EK);
        this.updateFavorWaitOverlay(EK);
    },

    /**
     * Update give card overlay
     * @param {Object} EK The main game instance
     */
    updateGiveOverlay: function (EK) {
        var from = EK.gameData.favor.from;
        if (from) {
            var user = EK.users[from];
            if (user) {
                $('#givePopup #text').text('Dê uma carta para ' + user.name + '.');
            }
        }
    },

    /**
     * Update overlays which require a player select
     * @param {Object} EK The main game instance
     */
    updatePlayerSelectOverlays: function (EK) {
        //Clear the options
        $('.popup #player-select').empty();

        //Add all players except us
        var user = EK.getCurrentUser();
        var game = EK.getCurrentUserGame();
        if (game) {
            $.each(game.players, function (index, player) {
                if (!(player.user === user.id) && player.alive) {
                    var current = EK.users[player.user];
                    var html = '<option value="' + current.id + '">' + current.name + '</option>';

                    //Add to all player selects
                    $('.popup #player-select').each(function (index, element) {
                        $(this).append(html);
                    });
                }
            });
        }
    },

    /**
     * Update favor wait overlay
     * @param {Object} EK The main game instance
     */
    updateFavorWaitOverlay: function (EK) {
        var to = EK.gameData.favor.to;
        if (to) {
            var user = EK.users[to];
            if (user) {
                $('#favorWaitPopup #text').text('Aguarde um favor de ' + user.name + '.');
            }
        }
    },

    showGiveOverlay: function (EK) {
        this.updateGameOverlay(EK);
        $('#overlay').show();
        $('#overlay .popup').hide();
        $('#givePopup').show();
        $('#playingInput button').addClass('disabled');
    },

    showBlindStealOverlay: function (EK) {
        this.updateGameOverlay(EK);
        $('#overlay').show();
        $('#overlay .popup').hide();
        $('#blindStealPopup').show();
        $('#playingInput button').addClass('disabled');
    },

    showChangeAllOverlay: function (EK) {
        this.updateGameOverlay(EK);
        $('#overlay').show();
        $('#overlay .popup').hide();
        $('#changeAllPopup').show();
        $('#playingInput button').addClass('disabled');
    },

    showLockdownOverlay: function (EK) {
        this.updateGameOverlay(EK);
        $('#overlay').show();
        $('#overlay .popup').hide();
        $('#lockdownPopup').show();
        $('#playingInput button').addClass('disabled');
    },

    showNamedStealOverlay: function (EK) {
        this.updateGameOverlay(EK);
        $('#overlay').show();
        $('#overlay .popup').hide();
        $('#namedStealPopup').show();
        $('#playingInput button').addClass('disabled');
    },

    showDiscardStealOverlay: function (EK) {
        this.updateGameOverlay(EK);
        $('#overlay').show();
        $('#overlay .popup').hide();
        $('#discardStealPopup').show();
        $('#playingInput button').addClass('disabled');
    },

    showFavorWaitOverlay: function (EK) {
        this.updateGameOverlay(EK);
        $('#overlay').show();
        $('#overlay .popup').hide();
        $('#favorWaitPopup').show();
        $('#playingInput button').addClass('disabled');
    },

    showFavorSelectOverlay: function (EK) {
        this.updateGameOverlay(EK);
        $('#overlay').show();
        $('#overlay .popup').hide();
        $('#favorSelectPopup').show();
        $('#playingInput button').addClass('disabled');
    },

    showDiscardPileOverlay: function () {
        $('#overlay').show();
        $('#overlay .popup').hide();
        $('#discardPilePopup').show();
        $('#playArea button').addClass('disabled');
    },

    hideOverlay: function () {
        $('#overlay').hide();
        $('#playingInput button').removeClass('disabled');
        $('#playArea button').removeClass('disabled');
    },

    /**
     * Whether the play button should be enabled.
     * This occurs when cards are selected and to make sure that no invalid combos are played.
     * @returns {Boolean} Whether the play button should be enabled
     */
    shouldEnablePlayButton: function (EK) {
        //Get selected cards and add them to an array
        var game = EK.getCurrentUserGame();
        var currentPlayer = game.getCurrentPlayer();
        var ids = $("#playingInput .card[data-selected='true']");
        var cards = [];
        ids.each(function (index, element) {
            var id = $(this).data('id');
            var card = EK.gameData.getCardFromHand(id);
            if (card) {
                cards.push(card);
            }
        });

        if (!currentPlayer.lockdown) {
            switch (cards.length) {
                case 1: //Don't allow playing defuse, regular, nope or explode (if it somehow got into players hand)
                    return !(cards[0].type === $C.CARD.PREVENTION || cards[0].type === $C.CARD.INFECTION || cards[0].type === $C.CARD.REGULAR || cards[0].type === $C.CARD.NOPE);
                case 2: //Blind pick
                case 3: //Named pick
                    return EK.gameData.cardsMatching(cards);
                case 5:
                    return EK.gameData.cardsDifferent(cards);
                default:
                    return false;
            }
        }

        return false;
    },

    /**
     * Log a message into the chat
     * @param {String} message The message
     * @param {String} type The message class tye
     */
    logMessage: function (message, type) {
        type = type || 'default';
        var dt = new Date();
        var utcDate = dt.toLocaleTimeString();
        var html = "<div class='message message-" + type + "'>[" + utcDate + "] " + message + "</div>";

        $('#messages').append(html);
        $('#messages').animate({
            scrollTop: $('#messages')[0].scrollHeight
        }, 500);
    },

    /**
     * Log an error into the chat.
     * This appends a '[Erro]' tag.
     * @param {String} error The error string
     */
    logError: function (error) {
        this.logMessage('[Erro] ' + error, "error");
    },

    /**
     * Log a system message into the chat.
     * This appends a '[System]' tag.
     * Generally use this over logLocal when everyone is going to get the message.
     * @param {String} message The message
     */
    logSystem: function (message) {
        this.logMessage('[Sistema] ' + message, "system");
    },

    /**
     * Log a green system message
     * @param {String} message The message
     */
    logSystemGreen: function (message) {
        this.logMessage('[Sistema] ' + message, "system-green");
    },

    /**
     * Log a local message into the chat.
     * This appends a '[Local]' tag.
     * Generally use this over logSystem when just the local user is going to get the message.
     * @param {String} message The message
     */
    logLocal: function (message) {
        this.logMessage('[Local] ' + message, "local");
    },

    /**
     * Log a chat message.
     * This appends a '[Chat]' tag.
     * @param {String} message The message
     */
    logChat: function (message) {
        this.logMessage('[Chat] ' + message);
    }
};