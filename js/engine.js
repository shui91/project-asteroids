/* Engine.js
 * This file provides the game loop functionality (update entities and render),
 * draws the initial game board on the screen, and then calls the update and
 * render methods on your player and enemy objects (defined in your app.js).
 *
 * A game engine works by drawing the entire game screen over and over, kind of
 * like a flipbook you may have created as a kid. When your player moves across
 * the screen, it may look like just that image/character is moving or being
 * drawn but that is not the case. What's really happening is the entire "scene"
 * is being drawn over and over, presenting the illusion of animation.
 *
 * This engine is available globally via the Engine variable and it also makes
 * the canvas' context (ctx) object globally available to make writing app.js
 * a little simpler to work with.
 */

var Engine = (function(global) {
    /* Predefine the variables we'll be using within this scope,
     * create the canvas element, grab the 2D context for that canvas
     * set the canvas elements height/width and add it to the DOM.
     */
    var doc = global.document,
        win = global.window,
        canvas = doc.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        time = 0,
        time2 = 540,
        lastTime;

    document.body.style.backgroundColor = "black";
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.border = "1px solid white";
    canvas.setAttribute('id', 'canvas');
    doc.body.appendChild(canvas);
    // append start and restart buttons
    doc.getElementById('button-div').appendChild(startButton);
    doc.getElementById('button-div').appendChild(restartButton);


    /* This function serves as the kickoff point for the game loop itself
     * and handles properly calling the update and render methods.
     */
    function main() {
        /* Get our time delta information which is required if your game
         * requires smooth animation. Because everyone's computer processes
         * instructions at different speeds we need a constant value that
         * would be the same for everyone (regardless of how fast their
         * computer is) - hurray time!
         */
        var now = Date.now(),
            dt = (now - lastTime) / 1000.0;

        /* Call our update/render functions, pass along the time delta to
         * our update function since it may be used for smooth animation.
         */
        update(dt);
        render();

        /* Set our lastTime variable which is used to determine the time delta
         * for the next time this function is called.
         */
        lastTime = now;

        /* Use the browser's requestAnimationFrame function to call this
         * function again as soon as the browser is able to draw another frame.
         */
        win.requestAnimationFrame(main);
    }

    /* This function does some initial setup that should only occur once,
     * particularly setting the lastTime variable that is required for the
     * game loop.
     */
    function init() {
        lastTime = Date.now();
        main();
    }

    /* This function is called by main (our game loop) and itself calls all
     * of the functions which may need to update entity's data. Based on how
     * you implement your collision detection (when two entities occupy the
     * same space, for instance when your character should die), you may find
     * the need to add an additional function call here. For now, we've left
     * it commented out - you may or may not want to implement this
     * functionality this way (you could just implement collision detection
     * on the entities themselves within your app.js file).
     */
    function update(dt) {
        updateEntities(dt);
    }

    /* This is called by the update function  and loops through all of the
     * objects within your allEnemies array as defined in app.js and calls
     * their update() methods. It will then call the update function for your
     * player object. These update methods should focus purely on updating
     * the data/properties related to  the object. Do your drawing in your
     * render methods.
     */
    function updateEntities(dt) {// updates all game objects
        player.update();
        rocks.forEach(function(rock){
            rock.update(dt);
        });
        lasers.forEach(function(laser) {
            laser.update(dt);
        });
        texts.forEach(function(text) {
            text.update(dt);
        });

        if (LIVES > 0){// lose lifepoints on collision event
            LIVES -= onCollide(rocks, player); // updates Lives on collision with rocks and ship
            groupsCollide(lasers, rocks); // checks for collisions between lasers and rocks
        }
        // updates game screen to reflect objects that need to be removed
        updateGroupOnCollide(lasers);
        updateGroupOnCollide(rocks);
        updateGroupOnCollide(texts);
    }
    /* This function initially draws the "game level", it will then call
     * the renderEntities function. Remember, this function is called every
     * game tick (or loop of the game engine) because that's how games work -
     * they are flipbooks creating the illusion of animation but in reality
     * they are just drawing the entire screen over and over.
     */
    function render() {
        // Draw background
        ctx.drawImage(Resources.get(SPACEBG), 0, 0);
        ctx.drawImage(Resources.get(BGPLANET), 440, 375);

        /* time element paces the movement of the background
         * moving background math ported from my python version of asteroids
         * http://www.codeskulptor.org/#user39_tlhzYVXuHl_17.py on line 299
         */
        time+=0.5; // increase the tick
        time2+=0.5; // second timer for second round of debris because the image isn't large enough

        /* wtime and wtime2 are used to simulate a scrolling down effect as time and time2 tick on
         * we modulo divide with twice the debris width to loop it so we have a changing dy
         */
        wtime = time % 900 ;
        wtime2 = time2 % 960;

        // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
        // dWidth and dHeight are to specify the scaled image resolution (can't run without it)
        ctx.drawImage(Resources.get(DEBRIS), 0, 0, 640, 480, 30, wtime - 380, 640, 480);
        ctx.drawImage(Resources.get(DEBRIS), 0, 0, 640, 480, 30, wtime2 - 400, 640, 480);

        // Draw every gameobj like asteroids
        renderEntities();
    }
    setInterval(rockMaker, 1200); // put outside of render because render spawns all rocks at once..

    /* This function is called by the render function and is called on each game
     * tick. It's purpose is to then call the render functions you have defined
     * on your enemy and player entities within app.js
     */
    function renderEntities() {
        if (STARTED){// Renders Points on Screen, renders gameObjs on screen
            ctx.fillStyle = "rgb(250, 250, 250)";
            ctx.font = "20px 'Press Start 2P'";
            ctx.fillText('SCORE: ' + SCORE, 5, 590);
            /* Loop through all of the objects within the allEnemies array and call
            * the render function you have defined.
            */
            rocks.forEach(function(rock) {
                rock.render();
            });
            lasers.forEach(function(laser) {
                laser.render();
            });
            texts.forEach(function(text) {
                text.render();
            });
            if (LIVES > 0){ // renders the # of lives the player currently has
                player.render();
                var x = 730;
                for (var i = 0; i < LIVES; i++){
                    ctx.drawImage(Resources.get(MINISHIP), x, 550, 55, 40);
                    x -= 70;
                }
            }
            if (LIVES === 0){ //sets the GAMEOVER condition to be true
                GAMEOVER = true;
            }
        }
        if (!STARTED){ // Renders Start Screen
            ctx.fillStyle = "rgba(0, 0, 0, 1)";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.fillStyle = "rgb(250, 250, 250)";
            ctx.font = "18px 'Press Start 2P'";
            ctx.fillText('PRESS START TO PLAY', 250, 300);

        }
        if (GAMEOVER){// Renders Game Over Screen
            ctx.fillStyle = "rgba(0, 0, 0, 1)";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.fillStyle = "rgb(250, 250, 250)";
            ctx.font = "18px 'Press Start 2P'";
            ctx.fillText('GAME OVER!', 250, 250);
            ctx.fillText('YOUR SCORE:' + SCORE, 250, 300);
        }
    }
    /* This function does nothing but it could have been a good place to
     * handle game reset states - maybe a new game menu or a game over screen
     * those sorts of things. It's only called once by the init() method.
     */
    function reset() {
    }
    /* Go ahead and load all of the images we know we're going to need to
     * draw our game level. Then set init as the callback method, so that when
     * all of these images are properly loaded our game will start.
     */
    Resources.load([
        'images/space-bg.jpg',
        'images/space-oj.jpg',
        'images/redship.png',
        'images/miniship.png',
        'images/rock1.png',
        'images/rock2.png',
        'images/debris.png',
        'images/shot.png',
        'images/planetBG.png'
    ]);
    Resources.onReady(init);
    /* Assign the canvas' context object to the global variable (the window
     * object when run in a browser) so that developer's can use it more easily
     * from within their app.js files.
     */
    global.ctx = ctx;
})(this);