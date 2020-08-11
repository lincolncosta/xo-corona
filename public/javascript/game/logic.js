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

/* TODO: Remove players from player list if they are dead */

jQuery(document).ready(function ($) {

    //Main game instance
    var main = new EK();

    //Connect to socket
    io = io.connect();

    //Init scrollbars
    $('.scrollable').perfectScrollbar();
    $(window).resize(function () {
        $('.scrollable').perfectScrollbar('update');
    });

    //******** Click Events ********//

    $('#nameInput').keypress(function (e) {
        if (e.which == 13) {
            $("#loginButton").click();
        }
    });

    $('#leaveButton').bind('click touchstart', function (e) {
        e.preventDefault();
        var game = main.getCurrentUserGame();
        if (game) {
            io.emit($C.GAME.LEAVE, { gameId: game.id });
        }
    });

    $("#loginButton").bind('click touchstart', function (e) {
        e.preventDefault();
        var nickname = $('#nameInput').val();
        io.emit($C.LOBBY.CONNECT, { nickname: nickname });
    });

    $("#newGameButton").bind('click touchstart', function (e) {
        e.preventDefault();
        var name = prompt("Digite um título:", "Sala de " + main.getCurrentUser().name);
        if (name) {
            io.emit($C.GAME.CREATE, { title: name });
        }
    });

    //Since we dynamically create the button, we have to call the click function this way
    $(document).on('click touchstart', '#joinGameButton', function (e) {
        e.preventDefault();
        var id = $(this).data("id");
        if (id) {
            io.emit($C.GAME.JOIN, { gameId: id });
        }
    });

    $('#startGameButton').bind('click touchstart', function (e) {
        e.preventDefault();
        var user = main.getCurrentUser();
        var game = main.getCurrentUserGame();
        if (user && game) {
            if (!game.isGameHost(user)) {
                GameRoom.logError('Error: Game can only be started by hosts');
                return;
            }

            if (!game.canStart()) {
                GameRoom.logError('Não foi possível iniciar o jogo.');
                return;
            }

            io.emit($C.GAME.START, { gameId: game.id });
        }
    });

    $('#readyGameButton').bind('click touchstart', function (e) {
        e.preventDefault();
        var game = main.getCurrentUserGame();
        if (game) {
            io.emit($C.GAME.PLAYER.READY, { gameId: game.id });
        };
    });

    $('#playGameButton').bind('click touchstart', function (e) {
        e.preventDefault();
        var cards = $("#playingInput .card[data-selected='true']");

        switch (cards.length) {
            case 1:
                var card = main.gameData.getCardFromHand(cards.data('id'));

                if (card.type === $C.CARD.FAVOR) {
                    GameRoom.showFavorSelectOverlay(main);
                } else if (card.type === $C.CARD.CHANGE) {
                    GameRoom.showChangeAllOverlay(main);
                } else if (card.type === $C.CARD.LOCKDOWN) {
                    GameRoom.showLockdownOverlay(main);
                } else {
                    io.emit($C.GAME.PLAYER.PLAY, {
                        gameId: main.getCurrentUserGame().id,
                        cards: cardIdsFromDOMData(cards)
                    });
                }
                break;
            case 2:
                GameRoom.showBlindStealOverlay(main);
                break;
            case 3:
                GameRoom.showNamedStealOverlay(main);
                break;
            case 5:
                GameRoom.showDiscardStealOverlay(main);
                break;
        }
    });

    $('#drawGameButton').bind('click touchstart', function (e) {
        e.preventDefault();
        var game = main.getCurrentUserGame();

        if (game && !main.gameData.currentPlayedSet) {
            io.emit($C.GAME.PLAYER.ENDTURN, { gameId: game.id });
        };
    });

    $('#giveCardButton').bind('click touchstart', function (e) {
        e.preventDefault();
        var game = main.getCurrentUserGame();
        var from = main.gameData.favor.from;
        if (game && from) {
            //Get the selected card id
            var cards = $("#givePopup .card[data-selected='true']");

            if (cards.length > 0) {
                //Get the first card id (since we only need to give 1 card)
                var id = cards.data('id');

                //Give the card to the 'from' player
                io.emit($C.GAME.PLAYER.FAVOR, {
                    gameId: game.id,
                    to: from,
                    card: id
                });
            }

        }

    });

    $('#favorSelectButton').bind('click touchstart', function (e) {
        e.preventDefault();
        var cards = $("#playingInput .card[data-selected='true']");
        var to = $('#favorSelectPopup #player-select').val();
        var game = main.getCurrentUserGame();

        if (cards.length > 0 && to && game) {

            //Play the favor card
            io.emit($C.GAME.PLAYER.PLAY, {
                gameId: game.id,
                cards: cardIdsFromDOMData(cards),
                to: to
            });

            GameRoom.hideOverlay();
        }

    });

    $('#blindStealButton').bind('click touchstart', function (e) {
        e.preventDefault();
        var cards = $("#playingInput .card[data-selected='true']");
        var to = $('#blindStealPopup #player-select').val();
        var game = main.getCurrentUserGame();

        if (cards.length > 0 && to && game) {

            //Play the cards and the steal
            io.emit($C.GAME.PLAYER.PLAY, {
                gameId: game.id,
                cards: cardIdsFromDOMData(cards),
                to: to
            });

            GameRoom.hideOverlay();
        }

    });

    $('#changeAllButton').bind('click touchstart', function (e) {
        e.preventDefault();
        var cards = $("#playingInput .card[data-selected='true']");
        var game = main.getCurrentUserGame();
        var to = $('#changeAllPopup #player-select').val();
        var from = game.getCurrentPlayer();

        if (cards.length > 0 && to && game) {

            io.emit($C.GAME.PLAYER.CHANGE, {
                gameId: game.id,
                to: to
            })

            GameRoom.hideOverlay();
        }
    });

    $('#lockdownButton').bind('click touchstart', function (e) {
        e.preventDefault();
        var cards = $("#playingInput .card[data-selected='true']");
        var game = main.getCurrentUserGame();
        var to = $('#lockdownPopup #player-select').val();
        var from = game.getCurrentPlayer();

        if (cards.length > 0 && to && game) {

            io.emit($C.GAME.PLAYER.LOCKDOWN, {
                gameId: game.id,
                to,
                from
            })

            GameRoom.hideOverlay();
        }
    });

    $('#namedStealButton').bind('click touchstart', function (e) {
        e.preventDefault();
        var cards = $("#playingInput .card[data-selected='true']");
        var to = $('#namedStealPopup #player-select').val();
        var cardTypes = $("#namedStealPopup .card[data-selected='true']");
        var game = main.getCurrentUserGame();

        if (cards.length > 0 && cardTypes.length > 0 && to && game) {

            //Play the cards and the steal
            io.emit($C.GAME.PLAYER.PLAY, {
                gameId: game.id,
                cards: cardIdsFromDOMData(cards),
                to: to,
                cardType: cardTypes.data('type')
            });

            GameRoom.hideOverlay();
        }

    });

    $('#discardStealButton').bind('click touchstart', function (e) {
        e.preventDefault();
        var cards = $("#playingInput .card[data-selected='true']");
        var discardCards = $("#discardStealPopup .card[data-selected='true']");
        var game = main.getCurrentUserGame();

        if (cards.length > 0 && discardCards.length > 0 && game) {

            //Play the cards and the steal
            io.emit($C.GAME.PLAYER.PLAY, {
                gameId: game.id,
                cards: cardIdsFromDOMData(cards),
                cardId: discardCards.data('id')
            });

            GameRoom.hideOverlay();
        }

    });

    $('#nopeGameButton').bind('click touchstart', function (e) {
        e.preventDefault();
        var game = main.getCurrentUserGame();
        var currentSet = main.gameData.currentPlayedSet;
        if (game && main.gameData.hasCardTypeInHand($C.CARD.NOPE) && currentSet) {

            //If we are the one who played the set and the amount of nopes is even then don't emit the event
            if (currentSet.owner.user.id === main.getCurrentUser().id && (main.gameData.currentPlayedSet.nopeAmount % 2 == 0)) {
                console.log('Cannot nope: ' + main.gameData.currentPlayedSet.nopeAmount + ' played');
                return;
            }

            io.emit($C.GAME.PLAYER.NOPE, {
                gameId: game.id,
                setId: main.gameData.currentPlayedSet.id
            });
        }
    });

    //Card click
    $(document).on('click touchstart', '#playingInput .card', function (e) {
        e.preventDefault();
        toggleCardSelected($(this));
        GameRoom.updateInputDisplay(main);
    });

    $(document).on('click touchstart', '.popup .card', function (e) {
        e.preventDefault();
        $('.popup .card').attr('data-selected', "false");
        $('.popup .card').removeClass('card-selected');
        toggleCardSelected($(this));
        GameRoom.updateInputDisplay(main);
    });


    //******** IO Events ********//

    io.on($C.LOBBY.CONNECT, function (data) {
        if (data.hasOwnProperty('success')) {

            var connectedUsers = data.connectedUsers;
            var gameList = data.gameList;

            //Add the connected users to the user list
            $.each(connectedUsers, function (key, user) {
                main.addUser(new User(user.id, user.name));
            });

            //Add the games to the list
            $.each(gameList, function (key, game) {
                main.addGame(gameFromData(game));
            });

            //Set the current user
            var user = main.users[data.user.id];
            main.currentUser = data.user.id;

            //Update displays
            Lobby.updateUserList(main);
            Lobby.updateGameList(main);

            //Hide login
            Login.hide();
        }

        if (data.hasOwnProperty('error')) {
            Login.showError(data.error);
        }
    });

    io.on($C.USER.CONNECT, function (data) {
        main.addUser(new User(data.user.id, data.user.name));
        Lobby.updateUserList(main);
    });

    io.on($C.USER.DISCONNECT, function (data) {
        main.removeUser(data.user.id);
        Lobby.updateUserList(main);
    });

    io.on($C.GAME.UPDATE, function (data) {
        if (main.games[data.game.id]) {
            main.addGame(gameFromData(data.game));
        }
        Lobby.updateGameList(main);
    });

    io.on($C.GAME.CREATE, function (data) {
        if (!data.hasOwnProperty('error')) {
            //Hide lobby
            Lobby.hide();

            //Set the current game
            main.getCurrentUser().currentGame = data.game.id;
            main.gameData = new GameData();

            //Update
            GameRoom.update(main);

            //Tell user they joined the game
            GameRoom.logSystem(main.getCurrentUser().name + ' entrou no jogo.');

            //Ready up
            io.emit($C.GAME.PLAYER.READY, { gameId: data.game.id });
        }
    });

    io.on($C.GAME.CREATED, function (data) {
        main.addGame(gameFromData(data.game));
        Lobby.updateGameList(main);
    });

    io.on($C.GAME.START, function (data) {
        if (data.hasOwnProperty('error')) {
            GameRoom.logError(data.error);
        } else {
            //Update game data
            main.addGame(gameFromData(data.game));

            //Reset local game data
            main.gameData = new GameData();
            GameRoom.update(main);

            //Get hand and discard piles
            var game = main.getCurrentUserGame();
            io.emit($C.GAME.PLAYER.HAND, { gameId: game.id });
            io.emit($C.GAME.DISCARDPILE, { gameId: game.id });

            GameRoom.logSystem('Jogo Iniciado!');
        }
    });

    io.on($C.GAME.STARTED, function (data) {
        main.addGame(gameFromData(data.game));
        Lobby.updateGameList(main);
    });

    io.on($C.GAME.STOP, function (data) {
        //Update game data
        main.addGame(gameFromData(data.game));
        GameRoom.update(main);

        //Reset local game data
        main.gameData = new GameData();
        GameRoom.updateCardDisplay(main);

        //Force ready
        forceGameHostReady(main.getCurrentUserGame());
    });

    io.on($C.GAME.STOPPED, function (data) {
        main.addGame(gameFromData(data.game));
        Lobby.updateGameList(main);
    });

    io.on($C.GAME.WIN, function (data) {
        GameRoom.logSystemGreen(data.user.name + ' VENCEU!');
    });

    io.on($C.GAME.REMOVED, function (data) {
        main.removeGame(data.id);

        //Replace the current game room for user
        if (main.getCurrentUserGame() && main.getCurrentUserGame().id == data.id) {
            main.getCurrentUser().currentGame = null;
        }

        Lobby.updateGameList(main);
    });

    io.on($C.GAME.JOIN, function (data) {
        if (data.hasOwnProperty('success')) {
            //Hide lobby
            Lobby.hide();

            //Update data we have
            main.addGame(gameFromData(data.game));

            //Set the current game
            main.getCurrentUser().currentGame = data.game.id;
            main.gameData = new GameData();

            //Update
            GameRoom.update(main);
            GameRoom.logSystem(main.getCurrentUser().name + ' entrou no jogo.');
        }
    });

    io.on($C.GAME.LEAVE, function (data) {
        if (data.hasOwnProperty('success')) {
            //Show lobby
            Lobby.show();

            //Reset stats
            main.gameData = new GameData();
            GameRoom.updateCardDisplay(main);

            main.getCurrentUser().currentGame = null;
        }
    });

    //Update player ready state
    io.on($C.GAME.PLAYER.READY, function (data) {
        var game = main.getCurrentUserGame();

        if (game) {
            game.updatePlayer(data.player)
        }

        //Force the game host to be ready
        forceGameHostReady(game);

        //Update
        GameRoom.update(main);
    });

    io.on($C.GAME.PLAYER.CONNECT, function (data) {
        //Update game data
        main.addGame(gameFromData(data.game));
        GameRoom.update(main);
        GameRoom.logSystem(data.player.user.name + ' entrou no jogo.');
    });

    io.on($C.GAME.PLAYER.DISCONNECT, function (data) {
        //Update game data
        main.addGame(gameFromData(data.game));
        GameRoom.update(main);
        GameRoom.logSystem(data.player.user.name + ' saiu do jogo.');

        //We need to check if current user was getting a favor or giving a favor to the disconnected player
        var player = data.player;
        if (player) {
            var user = player.user;

            if (user.id === main.gameData.favor.to) {
                //We asked this player for a favor
                main.gameData.favor.to = null;
                GameRoom.hideOverlay();
                GameRoom.logLocal("The coward feld!");
            }

            if (user.id === main.gameData.favor.from) {
                //We got asked for a favor from this user
                main.gameData.favor.from = null;
                GameRoom.hideOverlay();
                GameRoom.logLocal("You did the man a favor and kicked his butt!");
            }
        }

        //Get the discard pile
        io.emit($C.GAME.DISCARDPILE, { gameId: main.getCurrentUserGame().id });

        //We may have a new game host, so force them to be ready
        forceGameHostReady(main.games[data.game.id]);
    });

    io.on($C.GAME.PLAYER.HAND, function (data) {
        var game = main.getCurrentUserGame();
        if (game) {
            main.gameData.hand = data.hand;

            //Update display for the user
            GameRoom.update(main);
        }
    });

    io.on($C.GAME.PLAYER.FAKENEWS, function (data) {
        GameRoom.logLocal("Você encontrou uma carta de fake news e foi recompensado com uma carta de Prevenção!");
    })

    io.on($C.GAME.PLAYER.FUTURE, function (data) {
        var cards = data.cards;
        if (cards.length > 0) {
            var string = "Você vê as seguintes cartas: ";
            $.each(cards, function (index, card) {
                string += card.name + ', ';
            });
            string = string.slice(0, -2); // Remove vírgulas sobrando no final da string ', '
            string = string.replace($C.CARD.FAKENEWS, $C.CARD.PREVENT); // Altera Fake News por Prevenção para que a carta não seja notada
            GameRoom.logLocal(string);
        } else {
            GameRoom.logLocal('Não há nada para ver!');
        }
    });

    io.on($C.GAME.DISCARDPILE, function (data) {
        var game = main.getCurrentUserGame();
        if (game) {
            main.gameData.discardPile = data.cards;
            GameRoom.update(main);
        }
    });

    io.on($C.GAME.PLAYER.ENDTURN, function (data) {
        if (data.hasOwnProperty('error')) {
            GameRoom.logError(data.error);
        } else if (data.hasOwnProperty('force')) {
            //Force end turn
            io.emit($C.GAME.PLAYER.ENDTURN, { gameId: main.getCurrentUserGame().id });
        } else {
            //Update game data
            main.addGame(gameFromData(data.game));
            GameRoom.update(main);

            var game = main.getCurrentUserGame();
            var user = data.player.user;

            //Fetch the hand and discard piles
            io.emit($C.GAME.PLAYER.HAND, { gameId: game.id });
            io.emit($C.GAME.DISCARDPILE, { gameId: game.id });

            var message = null;
            var hasFakeNewsInHand = main.gameData.hasCardTypeInHand($C.CARD.FAKENEWS);
            switch (data.state) {
                case $C.GAME.PLAYER.TURN.PREVENTED:
                    message = user.name + " foi salvo por uma Prevenção!";
                    break;
                case $C.GAME.PLAYER.TURN.CONTAMINED:
                    if (hasFakeNewsInHand) {
                        message = user.name + " foi contaminado enquanto tinha uma Fake News em mãos. Notícias falsas não te manterão seguro!";
                    } else {
                        message = user.name + " foi contaminado!";
                    }
                    break;
                // case $C.GAME.PLAYER.TURN.SURVIVED:
                //     message = user.name + " sobreviveu ao seu turno.";
                //     break;
            }

            //Send the state message to user
            if (message) {
                GameRoom.logSystem(message);
            }

            //Send messages to users
            if (data.state == $C.GAME.PLAYER.TURN.SURVIVED) {
                var nextPlayer = game.getCurrentPlayer();
                var nextUser = main.users[nextPlayer.user];
                var currentUser = main.getCurrentUser();

                //The turn message
                var turnMessage = (currentUser.id === nextUser.id) ? "É o seu turno!" : "É a vez de " + nextUser.name + "!";
                GameRoom.logSystem(turnMessage);

                //Tell the player how much they have to draw
                if (currentUser.id === nextUser.id) {
                    GameRoom.logLocal("Faça a sua jogada e depois compre " + nextPlayer.drawAmount + " carta(s)!");
                }

            }
        }
    });

    io.on($C.GAME.PLAYER.DRAW, function (data) {
        //Update game data
        main.addGame(gameFromData(data.game));
        GameRoom.update(main);

        if (data.hasOwnProperty('hand')) {
            main.gameData.hand = data.hand;
            GameRoom.updateCardDisplay(main);

            //Tell the user what cards they drew
            if (data.cards) {
                $.each(data.cards, function (index, card) {
                    GameRoom.logLocal("Você pegou uma carta " + card.name + ".");
                });
            }

            //Tell the user if they have to draw more cards
            var user = main.getCurrentUser();
            var game = main.getCurrentUserGame();
            if (user && game) {
                var player = game.getPlayer(user);

                //Only tell user to draw more if they have a draw amount >= 1 after removing current drawn
                if (player.drawAmount - 1 >= 1) {
                    GameRoom.logLocal("Faça a sua jogada e depois compre " + (player.drawAmount - 1) + " carta(s)!");
                }
            }

        } else {
            GameRoom.logSystem(data.player.user.name + " comprou uma carta.");
        }
    });

    io.on($C.GAME.PLAYER.PLAY, function (data) {
        if (data.hasOwnProperty('error')) {
            GameRoom.logError(data.error);
        } else {
            //Tell users that a player played cards
            var user = data.player.user;
            var cards = data.cards;
            if (cards) {
                var cardString = '';
                $.each(cards, function (index, card) {
                    cardString += card.type + ", ";
                });

                //Trim excess
                cardString = cardString.slice(0, -2);

                //Build the string to show to user
                var playString = (cards.length <= 1) ? " jogou uma " : " jogou ";
                var suffix = ".";
                if (data.to) {
                    var other = main.users[data.to];
                    var otherString = (other.id === main.getCurrentUser().id) ? "você" : other.name;
                    suffix = " em " + otherString + ".";
                }

                GameRoom.logSystemGreen(user.name + playString + " carta(s) " + cardString + suffix);
            }

            //Update game
            main.addGame(gameFromData(data.game));
            GameRoom.update(main);

            //Get hand again once playing
            var cUser = main.getCurrentUser();
            var game = main.getCurrentUserGame();

            //Set the new set
            if (data.set && cards[0].type != $C.CARD.FAKENEWS) {
                main.gameData.currentPlayedSet = data.set;
                //GameRoom.update(main);
                GameRoom.logSystem("Um jogador pode jogar uma carta de cancelamento!");
                startCancelamentoTimer(game.nopeTime);
            }

            //Get hand
            if (cUser && cUser.id === user.id) {
                io.emit($C.GAME.PLAYER.HAND, { gameId: game.id });
            }

            //Get the discard pile
            io.emit($C.GAME.DISCARDPILE, { gameId: game.id });
        }
    });

    io.on($C.GAME.PLAYER.NOPE, function (data) {
        if (data.hasOwnProperty('error')) {
            GameRoom.logError(data.error);
        } else if (data.hasOwnProperty('canCancelamento')) {
            if (main.gameData.currentPlayedSet) {
                GameRoom.logSystem("Não é possível jogar mais cartas de cancelamento!");
            }
            main.gameData.currentPlayedSet = null;
            GameRoom.update(main);

            //Update nope button timer
            $('#nopeGameButton').text('Cancelamento');
            $('#nopeGameButton').attr('data-count', 0);
        } else {
            //Tell users that nope was played
            var user = data.player.user;
            var cards = data.cards;
            if (cards) {
                $.each(cards, function (index, card) {
                    GameRoom.logSystemGreen(user.name + " jogou uma carta " + card.name + ".");
                });
            }

            //Set the new set
            main.gameData.currentPlayedSet = data.set;

            //Update game data
            main.addGame(gameFromData(data.game));
            GameRoom.update(main);

            //Get hand again once someone played a nope
            var cUser = main.getCurrentUser();
            var game = main.getCurrentUserGame();
            if (cUser && cUser.id === user.id) {
                io.emit($C.GAME.PLAYER.HAND, { gameId: game.id });
            }

            //Start the timer again
            if (cards[0].type != $C.CARD.FAKENEWS) {
                startCancelamentoTimer(game.nopeTime);
            }

            //Get the discard pile
            io.emit($C.GAME.DISCARDPILE, { gameId: game.id });
        }

    });

    io.on($C.GAME.PLAYER.STEAL, function (data) {
        var from = main.users[data.from];
        var to = main.users[data.to];
        var currentUser = main.getCurrentUser();
        var fromString = "";
        var toString = "";

        //Only set strings if we have the data
        if (from) {
            fromString = (currentUser.id === from.id) ? "Você" : from.name;
        }

        if (to) {
            toString = (currentUser.id === to.id) ? "Você" : to.name
        }

        switch (data.type) {
            case $C.CARDSET.STEAL.BLIND:
                GameRoom.logSystemGreen(fromString + " pegou uma carta de " + toString.toLowerCase() + ".");

                //Tell the players involved what they lost or gained
                if (currentUser.id === from.id) {
                    GameRoom.logLocal("Você pegou uma carta de " + data.card.name + ".");
                }

                if (currentUser.id === to.id) {
                    GameRoom.logLocal("Você perdeu uma carta de " + data.card.name + ".");
                }

                break;
            case $C.CARDSET.STEAL.NAMED:
                //Use logLocal so that the card taking stands out
                if (data.success) {
                    GameRoom.logSystemGreen(fromString + " pegou uma carta de " + data.cardType + " de " + toString + ".");
                } else {
                    GameRoom.logSystemGreen(fromString + " falhou ao pegar uma carta de " + data.cardType + " de " + toString + ".");
                }
                break;
            case $C.CARDSET.STEAL.DISCARD:
                //Use logLocal so that the card taking stands out
                if (data.success) {
                    GameRoom.logSystemGreen(fromString + " pegou uma " + data.card.name + " da pilha de descarte.");
                } else {
                    GameRoom.logSystemGreen(fromString + " falhou em pegar uma " + data.card.name + " da pilha de descarte.");
                }
                break;
        }

        //Update hand
        var game = main.getCurrentUserGame();
        if (currentUser.id === from.id || currentUser.id === to.id) {
            io.emit($C.GAME.PLAYER.HAND, { gameId: game.id });
        }

        //Get the discard pile
        io.emit($C.GAME.DISCARDPILE, { gameId: game.id });
    });

    io.on($C.GAME.PLAYER.FAVOR, function (data) {
        if (data.hasOwnProperty('error')) {
            GameRoom.logError(data.error);
        } else {

            var currentUser = main.getCurrentUser();
            var from = main.users[data.from.id];
            var to = main.users[data.to.id];
            var fromString = (currentUser.id === from.id) ? "Você" : from.name;
            var toString = (currentUser.id === to.id) ? "Você" : to.name;

            if (data.hasOwnProperty('force')) {
                GameRoom.logSystemGreen(fromString + " pediu a " + toString + " um favor.");

                if (currentUser.id === from.id) {
                    //Current user asked the favor. Disable end turn button
                    main.gameData.favor.to = to.id;
                    GameRoom.showFavorWaitOverlay(main);
                }

                if (currentUser.id === to.id) {
                    //From user asked current user for a favor
                    //Show the favor screen
                    main.gameData.favor.from = from.id;
                    GameRoom.showGiveOverlay(main);
                }

            } else if (data.hasOwnProperty('success')) {
                GameRoom.logSystemGreen(fromString + " deu uma carta de " + data.card.name + " para " + toString + ".");

                if (currentUser.id === to.id) {
                    //From user did current user a favor
                    main.gameData.favor.to = null;
                    GameRoom.hideOverlay();
                }

                if (currentUser.id === from.id) {
                    //Current user did the favor. 
                    main.gameData.favor.from = null;
                    GameRoom.hideOverlay();
                }

                if (currentUser.id === to.id || currentUser.id === from.id) {
                    io.emit($C.GAME.PLAYER.HAND, {
                        gameId: main.getCurrentUserGame().id
                    });
                }

            }
        }
    });

    io.on($C.GAME.PLAYER.CHANGE, function (data) {
        if (data.hasOwnProperty('error')) {
            GameRoom.logError(data.error);
        } else {

            var currentUser = main.getCurrentUser();
            var from = data.from.user;
            var to = data.to.user;

            var fromString = (currentUser.id === from.id) ? "Você" : from.name;
            var toString = (currentUser.id === to.id) ? "Você" : to.name;

            GameRoom.logSystemGreen(fromString + " aplicou Troca-Tudo em " + toString + " e todas as suas cartas foram trocadas!");
        }
    })

    io.on($C.GAME.PLAYER.LOCKDOWN, function (data) {
        if (data.hasOwnProperty('error')) {
            GameRoom.logError(data.error);
        } else {

            var currentUser = main.getCurrentUser();
            var from = data.from.user;
            var to = data.to.user;

            var fromString = (currentUser.id === from.id) ? "Você" : from.name;
            var toString = (currentUser.id === to.id) ? "Você" : to.name;

            GameRoom.logSystemGreen(fromString + " aplicou Lockdown em " + toString + "!");
        }
    })

    io.on($C.GAME.PLAYER.TURN.CONTAMINED, function (data) {
        var user = data.player.user;
        var hasFakeNewsInHand = main.gameData.hasCardTypeInHand($C.CARD.FAKENEWS);

        if (hasFakeNewsInHand) {
            message = user.name + " foi contaminado enquanto tinha uma Fake News em mãos. Notícias falsas não te manterão seguro!";
        } else {
            message = user.name + " foi contaminado!";
        }

        GameRoom.logSystemBlue(message);
    })
    /**
     * Start an x second timer on the nope button
     * @param {Number} time The time in milliseconds
     */
    var startCancelamentoTimer = function (time) {
        //Add a timer to the nope
        $('#nopeGameButton').attr('data-count', Math.floor(time / 1000));
        updateCancelamentoButton();
        if ($('#nopeGameButton').attr('data-timer-started') == 1) return;

        var interval = setInterval(function () {
            var button = $('#nopeGameButton');
            var count = button.attr('data-count');
            button.attr('data-timer-started', 1);

            count--;
            button.attr('data-count', count);

            updateCancelamentoButton(interval);
        }, 1000);
    }

    /**
     * Update nope button with the interval
     * @param {Object} interval The interval
     */
    var updateCancelamentoButton = function (interval) {
        var button = $('#nopeGameButton');
        var count = button.attr('data-count');

        if (count < 0) {
            //Update nope button timer
            button.text('Cancelamento');
            button.attr('data-count', 0);
            button.attr('data-timer-started', 0);
            if (interval) {
                clearInterval(interval);
            }
        } else {
            button.text('Cancelamento (' + count + ')');
            GameRoom.logLocal(count + ' segundos para cancelamento!');
        }
    }

    /**
     * Get the card ids from the dom data of cards
     * @param   {Object} data The card DOM data
     * @returns {Array}  An array of card ids
     */
    var cardIdsFromDOMData = function (data) {
        var cards = [];
        data.each(function (index, element) {
            cards.push($(this).data('id'));
        });
        return cards;
    };

    /**
     * Toggle the selected attribute on cards
     * @param {Object} card The card dom
     */
    var toggleCardSelected = function (card) {
        //Get select and invert
        var selected = card.attr("data-selected") === 'true';
        selected = !selected;

        if (selected) {
            card.addClass('card-selected');
        } else {
            card.removeClass('card-selected');
        }

        card.attr("data-selected", selected.toString());
    }

    /**
     * Force the game host to be ready
     * @param {Object} game The game
     */
    var forceGameHostReady = function (game) {
        //Check if the current user is host, if they are then don't allow them to be not ready
        var user = main.getCurrentUser();
        if (user && game && game.isGameHost(user)) {
            var player = game.getPlayer(user);
            if (player && !player.ready) {
                io.emit($C.GAME.PLAYER.READY, { gameId: game.id });
            }
        }
    }

    /**
     * Create a game from data
     * @param   {Object}   data The data
     * @returns {Object} A game object
     */
    var gameFromData = function (data) {
        var players = [];

        //Add players
        $.each(data.players, function (index, player) {
            var user = main.users[player.user.id];
            if (user) {
                players.push(new Player(user.id, player.alive, player.ready, player.drawAmount, player.cardCount, player.lockdown));
            }
        });

        return new Game(data.id, data.title, data.status, players, data.currentPlayerIndex, data.drawPileLength, data.nopeTime);
    }

});
