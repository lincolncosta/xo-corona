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

var $C = {
    LOBBY: {
        ROOM: 'lobby',
        CONNECT: 'connected',
        DISCONNECT: 'disconnect',
    },
    
    GAME: {
        CREATE: 'createGame',
        JOIN: 'joinGame',
        LEAVE: 'leaveGame',
        CREATED: 'gameCreated',
        START: 'startGame',
        STOP: 'stopGame',
        STARTED: 'gameStarted',
        STOPPED: 'gameStopped',
        WIN: 'winGame',
        UPDATE: 'updateGame',
        DISCARDPILE: 'discardPile',
        STATUS: {
            WAITING: 'Aguardando',
            PLAYING: 'Jogando'
        },
        PLAYER: {
            READY: 'playerReady',
            CONNECT: 'playerConnected',
            DISCONNECT: 'playerDisconnected',
            STATUS: {
                NOTREADY: 'Não pronto',
                READY: 'Pronto',
                WAITING: 'Aguardando',
                PLAYING: 'Jogando',
                DEAD: 'Morto'
            },
            ENDTURN: 'playerEndTurn',
            TURN: {
                INVALID: 'invalid',
                PREVENTED: 'prevented',
                CONTAMINED: 'contamined',
                SURVIVED: 'survived',
                DISCONNECT: 'disconnected'
            },
            HAND: 'playerHand',
            DRAW: 'playerDraw',
            PLAY: 'playerPlayCard',
            STEAL: 'playerSteal',
            FAVOR: 'playerFavor',
            FUTURE: 'playerPrever',
            NOPE: 'playerCancelamento',
            CHANGE: 'playerTrocaTroca',
            LOCKDOWN: 'playerLockdown',
            FAKENEWS: 'playerFakeNews'
        },
        REMOVED: 'gameRemoved'
    },
    
    USER: {
        CONNECT: 'userConnected',
        DISCONNECT: 'userDisconnected'
    },

    CARD: {
        ATTACK: 'Ataque',
        NOPE: 'Cancelamento',
        PREVENT: 'Prevenção',
        CONTAMINE: 'Contamine',
        SKIP: 'Pular',
        FUTURE: 'Prever',
        FAVOR: 'Favor',
        SHUFFLE: 'Embaralhar',
        REGULAR: 'Coringa',
        REVERSE: 'Reverse',
        CHANGE: 'Troca-tudo',
        LOCKDOWN: 'Lockdown',
        FAKENEWS: 'Fake News'
    },
    
    CARDSET: {
        STEAL: {
            BLIND: 'blindSteal',
            NAMED: 'namedSteal',
            DISCARD: 'discardSteal',
            INVALID: 'invalidSteal'
        }
    }
};