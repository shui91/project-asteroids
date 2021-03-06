// global variables
var SCORE = 0;
var LIVES = 5;
var STARTED = false;
var GAMEOVER = false;

// canvas variables
var WIDTH = 800;
var HEIGHT = 600;
var TOP = 0;
var LEFT = 0;
var BOTTOM = 600;
var RIGHT = 800;

// image variables
var SPACEBG = 'images/space-oj.jpg';
var spaceInfo = new ImageInfo(400, 300, 800, 600);

var SHIP = 'images/redship.png';
var MINISHIP = 'images/miniship.png'; //load smaller ship images for life points, don't need ImageInfo
var shipInfo = new ImageInfo(37.5, 49.5, 75, 99, 40);
//                            cx, cy,    w,  h, r;
var SLASER = 'images/shot.png'; // lasers
var slaserInfo = new ImageInfo(5, 5, 10, 10, 20, 60);
//                             cx, cy, w, h, r, lifespan;

var ROCK = ['images/rock1.png', 'images/rock2.png'];
var rockInfo = new ImageInfo(50.5, 42, 101, 84, 20);
//                            cx, cy, w,    h, radius

var DEBRIS = 'images/debris.png'; // background debris
var BGPLANET = 'images/planetBG.png'; //background planet image

// Math functions

var angleToVector = function(angle){	// Converts angle to vector to be used for velocity
	return [Math.cos(angle), Math.sin(angle)];
};

var distToObj = function (px, py, qx, qy) {		// disance between to objects
	return Math.sqrt(Math.pow(px - qx, 2) + Math.pow(py - qy, 2));
};

var TO_RADIANS = Math.PI / 180; // use this to multiply an object to radians

function ImageInfo(centerX, centerY, width, height, radius, lifespan) {	// gathers info for images so it's easier to reference data
	this.centerX = centerX;
	this.centerY = centerY;
	this.width = width;
	this.height = height;
	this.radius = radius;
	this.lifespan = lifespan;
}

var gameObj = function(x, y, vx, vy, angle, angleV, image, info){	// gameobject super class
	this.sprite ='';
	this.x = x;
	this.y = y;
	this.velocity = [vx, vy];
	this.angle = angle;
	this.angleV = angleV;
	this.age = 0;
	this.lifespan = slaserInfo.lifespan;
};

gameObj.prototype.collide = function(otherObj){ // Player.collide falls through to here, handles collision detection for the ship and rocks
	var distance = distToObj(this.x, this.y, otherObj.x, otherObj.y);
	if (distToObj < (this.radius + otherObj.radius)){
		return true; // if there is a collision; onCollide kicks in to determine if you earn points or lose a life
	} else {
		return false;
	}
};

var Player = function(vx, vy, angle, angleV, image, info, identity){	// Define Player Object Variables
	gameObj.call(this);
	this.sprite = SHIP;
	this.x = 400;
	this.y = 300;
	this.velocity = [vx, vy];
	this.thrust = false;
	this.angle = angle;
	this.angleV = angleV;
	this.imageCenterX = info.centerX;
	this.imageCenterY = info.centerY;
	this.radius = info.radius;
	this.identity = identity;
};

Player.prototype = Object.create(gameObj.prototype);
Player.prototype.constructor = Player;
Player.prototype.render = function(){ // render the player ship
	ctx.save();
	ctx.translate(this.x, this.y);
	ctx.rotate(this.angle * TO_RADIANS);
	ctx.drawImage(Resources.get(SHIP), 0, 0, shipInfo.width, shipInfo.height, -shipInfo.centerX, -shipInfo.centerY, shipInfo.width, shipInfo.height);
	ctx.restore();
};
// For every downKey, the Player will move accordingly
Player.prototype.update = function(dt){
	/* control ship movement based on acceleration and not velocity
	 * angle and angleV control the orientation of the ship and how fast it rotates respectively
	 * key handlers should control angleV and update method should update self.angle += self.angleV

	 * basic physics = position = x,y, velocity = vx, vy, accel = angleToVector
	 * position update is position += velocity, velocity update is velocity += acceleration

	 * ship class has pos, vel, angle, thrust
	 * position update is self.pos[0] += self.vel[0], self.pos[1] += self.vel[1]
	 */

	if (38 in keysDown) { // update thrust on keydown
		this.thrust = true;
	} else {
		this.thrust = false;
	}

	if (37 in keysDown) { // left rotation updated via angular rotation
		this.angleV = -5;
	} else if (39 in keysDown) { // right rotation
		this.angleV = +5;
	} else {
		this.angleV = 0;
	}

	this.angle += this.angleV; 	// update ang

	if (this.y <= 0) { 	// update position
		this.y = HEIGHT; // reset to top of screen after you hit bottom
	} else {
		this.y = (this.y + this.velocity[1]) % HEIGHT; // ship update y wrap around screen
	}
	if (this.x <= 0) {
		this.x = WIDTH; // reset to right side when you hit left side
	} else {
		this.x = (this.x + this.velocity[0]) % WIDTH;  // ship update x wrap around screen
	}
	/* update velocity
	 * velocity update is acceleration in direction of forward vector which is given by angleToVector
	 * we update the forward vector on thrust.
	 */
	if (this.thrust) {
		var angle = this.angle * TO_RADIANS;
		var accel = angleToVector(angle);
		this.velocity[0] += accel[0] / 10;
		this.velocity[1] += accel[1] / 10;
	}

	// friction needed to help control ship! this eventually wittles down the velocity
	this.velocity[0] *= 0.99;
	this.velocity[1] *= 0.99;
};

Player.prototype.shoot = function(){ 	// ship shoots lasers based off of the ships details
	var vangle = this.angle * TO_RADIANS;
	var forwardDir = angleToVector(vangle);
	var laserX = this.x + (this.radius) * forwardDir[0];
	var laserY = this.y + (this.radius) * forwardDir[1];
	var laserXVel = this.velocity[0] + 5 * forwardDir[0];
	var laserYVel = this.velocity[1] + 5 * forwardDir[1];
	var laser = new Laser(laserX, laserY, laserXVel, laserYVel, vangle, 0, SLASER, slaserInfo, 'laser'); // make the new laser
	lasers.push(laser); // push the laser into an array of lasers to be used for collision detection
};

// make new Player at default x, y position that's in Player
var player = new Player(0, 0, 0, 0, SHIP, shipInfo, 'ship');

var Rock = function(x, y, vx, vy, angle, angleV, image, info, identity){	// Rock class
	gameObj.call(this);
	this.sprite = ROCK[Math.floor(Math.random() * 2)]; // picks one of two rock sprites
	this.x = x;
	this.y = y;
	this.angle = angle;
	this.angleV = angleV;
	this.velocity = [vx, vy];
	this.imageCenterX = info.centerX;
	this.imageCenterY = info.centerY;
	this.radius = info.radius;
	this.identity = identity;
};
Rock.prototype = Object.create(gameObj.prototype);
Rock.prototype.constructor = Rock;
Rock.prototype.render = function (x, y, vx, vy, angle, angleV, image, info) {
	var ROCK = this.sprite;
	ctx.save();
	ctx.translate(this.x, this.y);
	ctx.rotate(this.angle * TO_RADIANS);
	ctx.drawImage(Resources.get(ROCK), 0, 0, rockInfo.width, rockInfo.height, -rockInfo.centerX, -rockInfo.centerY, rockInfo.width, rockInfo.height);
	ctx.restore();
};
Rock.prototype.update = function(dt){	// changes rock position and makes sure they wrap around the screen
	this.x += (this.velocity[0] /3);
	this.y += (this.velocity[1] /3);
	this.angle += this.angleV;
	if (this.x >= RIGHT){ // Handles screen wrapping for the rocks
		this.x = LEFT;
	} else if (this.x <= LEFT){
		this.x = RIGHT;
	}
	if (this.y >= BOTTOM){
		this.y = TOP;
	} else if (this.y <= TOP){
		this.y = BOTTOM;
	}
};

Rock.prototype.collide = function(otherObj){	// collision detection for the Rocks, takes ships and lasers
	var distance = distToObj(this.x, this.y, otherObj.x, otherObj.y);
	if (distance < (this.radius + otherObj.radius)){
		return true;
	} else {
		return false;
	}
};

var Laser = function(x, y, vx, vy, angle, angleV, image, info, radius, identity){ // Laser class
	gameObj.call(this);
	this.x = x;
	this.y = y;
	this.angle = angle;
	this.angleV = angleV;
	this.velocity = [vx, vy];
	this.imageCenterX = slaserInfo.centerX;
	this.imageCenterY = slaserInfo.centerY;
	this.radius = info.radius;
	this.lifespan = info.lifespan;
	this.identity = identity;
};
Laser.prototype = Object.create(gameObj.prototype);
Laser.prototype.constructor = Laser;
Laser.prototype.render = function(x, y, vx, vy, angle, angleV, image, info){
	ctx.save();
	ctx.translate(this.x, this.y);
	ctx.rotate(this.angle * TO_RADIANS);
	ctx.drawImage(Resources.get(SLASER), 0, 0, slaserInfo.width, slaserInfo.height, -this.imageCenterX, -this.imageCenterY, slaserInfo.width, slaserInfo.height);
	ctx.restore();
};
Laser.prototype.update = function(){
	this.x += this.velocity[0];
	this.y += this.velocity[1];
	this.angle += this.angleV;
	this.age += 1;

    if (this.y <= 0) {
		this.y = HEIGHT; // reset to top of screen
	} else {
		this.y = this.y % HEIGHT; // y wrap around screen
	}
	if (this.x <= 0) {
		this.x = WIDTH; // reset to opposite side
	} else {
		this.x = this.x % WIDTH;  // x wrap around screen
	}

	// expiration date for lasers
	if (this.age >= this.lifespan) {
		return false; // end
	} else {
		return true; // keep
	}
};
Laser.prototype.collide = function(otherObj){ 	// checks if laser hits rocks
	var distance = distToObj(this.x, this.y, otherObj.x, otherObj.y);
	if (distance < (this.radius + otherObj.radius)){
		return true;
	} else {
		return false;
	}
};

var pointText = function(text, x, y){	// Text class, which is spawned onCollide
	this.text = text;
	this.x = x;
	this.y = y;
	this.lifespan = 15;
	this.age = 0;
};
pointText.prototype.render = function(){
	ctx.save();
	ctx.fillText(this.text, this.x, this.y);
	ctx.restore();
};
pointText.prototype.update = function(){
	this.age += 1; // adds one age for every tick and expires at the lifespand of text
	if (this.age >= this.lifespan){
		return false;
	} else {
		return true;
	}
};

// Helper Functions listed below

var rocks = [];	// array of rocks to be rendered

var lasers = []; // array of lasers to be rendered

var texts = []; // explosion texts

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomIntInclusive(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

var rockMaker = function(){ // make individual rocks to be pushed to rocks array
	if (rocks.length < 8) {
		var x = getRandomIntInclusive(0, WIDTH);
		var y = getRandomIntInclusive(0, HEIGHT);
		var vx = getRandomIntInclusive(-6, 6);
		var vy = getRandomIntInclusive(-6, 6);
		var angle = getRandomIntInclusive(0, 90);
		var angleV = getRandomIntInclusive(-6, 6);
		var image = ROCK;
		var info = rockInfo;
		var rock = new Rock(x, y, vx, vy, angle, angleV, ROCK, rockInfo, 'rock');
		rocks.push(rock);
	}
};

var onCollide = function(group, thing){ // handles object collision, takes a group of objects and sees which one hit a thing
	var collisions = 0;
	for (var i = 0; i < group.length; i++){
		if (group[i].collide(thing)){ // if there is a collision between objects
			if (group[i].identity == "rock" && thing.identity == "ship"){
				texts.push(new pointText('-1 LIFE', group[i].x, group[i].y)); // draws text at that collision position if a rock hits the ship
			} else {
				texts.push(new pointText('+10 pts', group[i].x, group[i].y)); // draws text at the point where a laser hits a rock
			}
			collisions += 1; // adds one to collisions
			group.splice(i, 1); // removes the laser/rock that was involved in the above
			thing.lifespan = 0; // deletes the thing that was hit
			i--; // shrink the group size by 1 because we've removed something
		}
	}
	return collisions; // returns collision so groupsCollide can calculate the score
};

var groupsCollide = function(groupA, groupB) { // handles group object collisions i.e lasers on rocks
	for (var i = 0; i < groupA.length; i++){
		var collisions = onCollide(groupB, groupA[i]);
		SCORE += (collisions * 10); // Score goes up by # of collisions x 10
	}
};

var updateGroupOnCollide = function (group) { // removes objects from screen once they collide
	for (var i = 0; i < group.length; i++) {
		if (group[i].update() === false) {
			group.splice(i, 1);
			i--;
		}
	}
};

var startGame = function(){ // start and reset button functionalities
	STARTED = true;
	return STARTED;
};

var reset = function() {	// resets the game by drawing the start to play screen again and resetting the game data
	ctx.fillStyle = "rgba(0, 0, 0, 1)";
	ctx.fillRect(0, 0, WIDTH, HEIGHT);
	ctx.fillStyle = "rgb(250, 250, 250)";
	ctx.font = "18px 'Press Start 2P'";
	ctx.fillText('PRESS START TO PLAY', 250, 300);
	player.x = 400;
	player.y = 300;
	player.velocity = [0, 0];
	player.angle = 0;
	rocks = [];
	SCORE = 0;
	LIVES = 5;
	STARTED = false;
	GAMEOVER = false;
};

// keysDown is an object that holds an array of keyCodes to be referenced to move the ship
// It makes it much easier to account for two keyDown actions like left+up
var keysDown = {};
var checkTime = 0;

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
	var currentTime = new Date();
	console.log(keysDown);
	switch(e.keyCode){
		case 37: case 39: case 38:  case 40: // arrow keys
		case 32: e.preventDefault(); break; // space
		default: break; // do not block other keys
	}
	if (e.keyCode == 32) {
		if ((currentTime.getTime() - checkTime) > 200){ //add time delay to prevent spamming
			player.shoot();
			checkTime = currentTime.getTime();
		}
	}
}, false);

addEventListener("keyup", function (e) {
  delete keysDown[e.keyCode];
}, false);

// Start and Reset Buttons
var startButton = document.createElement('input');
startButton.setAttribute('id', 'button');
startButton.setAttribute('type', 'button');
startButton.setAttribute('name', 'start');
startButton.setAttribute('value', 'Start Game');
startButton.setAttribute('onClick', 'startGame()');

var restartButton = document.createElement('input');
restartButton.setAttribute('id', 'button');
restartButton.setAttribute('type', 'button');
restartButton.setAttribute('type', 'button');
restartButton.setAttribute('name', 'restart');
restartButton.setAttribute('value', 'Restart Game');
restartButton.setAttribute('onClick', 'reset()');