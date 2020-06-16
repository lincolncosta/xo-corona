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

/**
 * A playing card
 * @param {String} id The card id
 * @param {String} name The name
 * @param {String} type The card type
 * @param {String} image The image
 * @param {String} effect The effect
 * @param {Number} imgMin The img category min
 * @param {Number} imgMax The img category max
 */
var Card = function (id, name, type, image, effect, imgMin, imgMax) {

  //Card id
  this.id = id;

  //Card name to display
  this.name = name;

  //Card type
  this.type = type;

  //Card icon
  this.image = image;

  //Card effect
  this.effect = effect;

  //The img category min
  this.imgMin = imgMin;

  //The img category max
  this.imgMax = imgMax;

}

module.exports = Card;
