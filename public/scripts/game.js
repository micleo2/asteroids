var socket;
var isOnline = false;

$('form').submit(function(){
  socket.emit('chat message', $('#m').val());
  $('#m').val('');
  return false;
});
$('#myModal').show("modal");
$("#ready").click(function(){
  startGame();
  p.name = $("#nickname").val().substring(0, 12);
  $('#myModal').hide("modal");
});

var HEART = loadImage("/../images/heart2.png");
HEART.resize(10, 20);
var width = document.body.clientWidth * 0.95;
var height = document.body.clientHeight * 0.95;
void setup(){
  size(width , height);
}
var gameState = "start";
var keys = [];
var asteroids = [];
var remotePlayers = [];
var enemyBullets = [];
var keyIsPressed = false;
var f = createFont("monospace", 32);
var localBulletID = 0, frameCount = 0;
var starField = [];
var lifeBonusAnimationTimer = 0;
var currentKill = "";
var showMap = true;
var GAME_X = 6000;
var GAME_Y = 6000;
var MAX_LIVES = 20;
function Star(x, y, d){
  this.x = x;
  this.y = y;
  this.density = d;
  this.fillNum = getRandomInt(100, 255);

  this.draw = function(){
    noStroke();
    if (frameCount % 30 == 0){
      this.fillNum = getRandomInt(50, 255);
    }
    fill(this.fillNum);
    ellipse(this.x, this.y, this.density, this.density);
  }
}

for (let x = 0; x < width/30; x++){
  starField.push(new Star(getRandomInt(0, width), getRandomInt(0, height), random() * 5 + 1));
}

function drawStars(){
  for (let n = 0; n < starField.length; n++){
    starField[n].draw();
    starField[n].x -= (p.velocity.x * starField[n].density) / 5;
    starField[n].y -= (p.velocity.y * starField[n].density) / 5;

    if (starField[n].x < -10){
      starField[n].x = width + 10;
    }else if (starField[n].x > width + 10){
      starField[n].x = -10;
    }

    if (starField[n].y < -10){
      starField[n].y = height + 10;
    }else if (starField[n].y > height + 10){
      starField[n].y = -10;
    }
  }
}

var limit = function(v, lim){
    if (v.x > lim){
        v.x = lim;
    }else if (v.x < -lim){
        v.x = -lim;
    }
    if (v.y > lim){
        v.y = lim;
    }else if (v.y < -lim){
        v.y = -lim;
    }
};
var lifeBarWidth = 50;
function drawPlayer(plyr){
  stroke(0, 0, 0);
  strokeWeight(0);
  pushMatrix();
  translate(plyr.loc.x - p.loc.x + width/2, plyr.loc.y - p.loc.y + height/2);
  var sizee = 10;
  var yOff = 21;
  rotate(plyr.rot);
  fill(plyr.fillColor);
  triangle(0, -plyr.r+yOff, sizee, -sizee+yOff, -sizee, -sizee+yOff);

  if (plyr.engineOn){
      var yoff = 4;
      if (random() > 0.25){
        fill(225, 69, 0);
          noStroke();
          triangle(0, plyr.r/2+yoff, 5, 10+yoff, -5, 10+yoff);
      }
  }
  rotate(-plyr.rot);
  noStroke();
  fill(200, 200, 200);
  textSize(8);
  text(plyr.name, 0, yOff);
  rectMode(CENTER);
  fill(255);
  rect(0, yOff + 11, lifeBarWidth, 10);
  fill(0, 255, 0);
  rect(0, yOff + 11, lifeBarWidth * (plyr.lives / MAX_LIVES), 10);
  popMatrix();
}

function drawLocalPlayer(plyr){
  stroke(0, 0, 0);
  strokeWeight(0);
  fill(plyr.fillColor);
  pushMatrix();
  translate(width/2, height/2);
  var sizee = 10;
  var yOff = 21;
  rotate(plyr.rot);
  triangle(0, -plyr.r+yOff, sizee, -sizee+yOff, -sizee, -sizee+yOff);

  if (plyr.engineOn){
      var yoff = 4;
      if (random() > 0.25){
        fill(225, 69, 0);
          noStroke();
            triangle(0, plyr.r/2+yoff, 5, 10+yoff, -5, 10+yoff);
      }
  }
  popMatrix();
}

var Player = function(){

    this.loc = new PVector(width / 2, height / 2);
    this.velocity = new PVector();
    this.acceleration = new PVector();

    this.rot = 0;
    this.rotA = 0;
    this.rotSpeed = 0.01;
    this.r = 44;
    this.fillColor = getRandomColor();
    this.engineOn = false;

    this.gameScore = 0;
    this.bulletsTaken = 0;
    this.lives = MAX_LIVES;

    this.update = function(){
        this.rot += this.rotA;

        if (keys[UP] || keys[87]){
            this.velocity.add(this.acceleration);
            this.velocity.x *= 0.9;
            this.velocity.y *= 0.9;
            this.engineOn = true;
        }else{
          this.engineOn = false;
        }
        var rotLim = 0.2;
        if (this.rotA > rotLim){
            this.rotA = rotLim;
        }
        else if (this.rotA < -rotLim){
            this.rotA = -rotLim;
        }

        if (!(keyIsPressed && keyCode === LEFT) && !(keyIsPressed && keyCode === RIGHT)){
            this.rotA *= 0.9;
        }

        limit(this.velocity, 5);
        this.loc.add(this.velocity);
        this.acceleration.mult(0);
        socket.emit("playerUpdate", this);
    };

    this.checkEdges = function(){
        var l = this.loc;
        if (l.x < -GAME_X){
            l.x = GAME_X;
        }else if (l.x > GAME_X){
            l.x = -GAME_X;
        }
        if (l.y < -GAME_Y){
            l.y = GAME_Y;
        }
        if (l.y > GAME_Y){
            l.y = -GAME_Y;
        }
    };

    this.userInput = function(){
        var s = this.rotSpeed;
        //87 65 83 68 -- WASD
        if (keys[UP] || keys[87]){
            var copy = new PVector(cos(this.rot - toRadians(90)), sin(this.rot - toRadians(90)));

            copy.normalize();
            copy.mult(1);

            this.acceleration.add(copy);
        }

        if (keys[LEFT] || keys[65]){
            this.rotA -= s;
        }
        if (keys[RIGHT] || keys[68]){
            this.rotA += s;
        }

    };
};

var Asteroid = function(x, y, vx, vy, s){
  this.x = x;
  this.y = y;
  this.vx = vx;
  this.vy = vy;
  this.stage = s;
  this.draw = function(){
    fill(255);
    stroke(0);
    var radi = this.stage * 20;

    ellipse(this.x, this.y, radi*2, radi*2);
  };
};

var p;
var bullets = [];

void keyPressed (){
    keys[keyCode] = true;
    keyIsPressed = true;
      if (keyCode === 32 && gameState === "start"){
          gameState = "playing";
      }
};

void keyReleased (){
  keyIsPressed = false;
    keys[keyCode] = false;
    if ((keyCode === 32 || keyCode === 83) && bullets.length < 7){

        var copy = new PVector(sin(p.rot), -cos(p.rot));
        copy.normalize();
        copy.mult(8);

        var vvx = copy.x;
        var vvy = copy.y;
        var bulObj = {
            x: p.loc.x + sin(p.rot)*18,
            y: p.loc.y- (cos(p.rot)*24),
            vx: vvx + p.velocity.x,
            vy: vvy + p.velocity.y,
            r: 3,
            life: 100,
            fillColor: p.fillColor,
            bulletID: localBulletID++
        };
        bullets.push(bulObj);
        socket.emit("fireBullet", bulObj);
    }else if (keyCode === 77){//letter "m"
      showMap = !showMap;
    }
};

  var drawBullets = function(bulletList){
      for (var i = 0; i < bulletList.length; i++){
        var b = bulletList[i];
        fill(b.fillColor);
        stroke(255);
        strokeWeight(0.3);
        ellipse(bulletList[i].x - p.loc.x + width/2, bulletList[i].y - p.loc.y + height/2, b.r*2, b.r*2);
    }
  };

  var drawLocalBullets = function(bulletList){
      for (var i = 0; i < bulletList.length; i++){
        var b = bulletList[i];
        fill(b.fillColor);
        strokeWeight(0.3);
        stroke(255);
        ellipse(bulletList[i].x - p.loc.x + width/2, bulletList[i].y - p.loc.y + height/2, b.r*2, b.r*2);
    }
  };

  var handleCollisions = function(bulletList){
      for (var i = 0; i < bulletList.length; i++){
        noStroke();
        var b = bulletList[i];
        b.x += b.vx;
        b.y += b.vy;
          b.life--;
          if (b.life < 0){
              bulletList.splice(i, 1);
          }
    }
  };

  function isHit(bulletList){
    for (var n = 0; n < bulletList.length; n++){
      var curB = bulletList[n];
      if (dist(p.loc.x, p.loc.y, curB.x, curB.y) < 25){
        socket.emit("bulletHit", curB);
        bulletList.splice(n, 1);
        p.bulletsTaken++;
        p.lives--;
        if (p.lives <= 0){
          socket.emit("rewardPlayer", curB.id, p.name)
          endGame();
          return;
        }
      }
    }
  }

  var init = function(){
    asteroids = [];
    bullets = [];
      for (var i = 1; i <= 10; i++){
        var xpos = random();
        var cush = 250;
        xpos = xpos > 0.5? random(width/2+cush, width) : random(0, width/2-cush);
        asteroids.push(new Asteroid(xpos, random(height), random(-5, 5), random(-5, 5), round(random(1, 4))));
      }
      asteroids = [];
  };
  init();
  var mapXSize = 300;
  var mapYSize = 300;
  var xScale = (mapXSize / 2) / GAME_X;
  var yScale = (mapYSize / 2) / GAME_Y;
  function drawminiMap(){
    rectMode(CORNER);
    fill(255, 255, 255, 255);
    noStroke();
    rect(width - mapXSize, height - mapYSize, mapXSize, mapYSize);
    pushMatrix();
    translate(width - mapXSize/2, height - mapYSize/2);
    rectMode(RADIUS);
    for (let n = 0; n < remotePlayers.length; n++){
      var location = remotePlayers[n].player.loc;
      fill(255, 0, 0);
      rect(location.x * xScale, location.y * yScale, 1.5, 1.5);
    }
    fill(0, 255, 0);
    rect(p.loc.x * xScale, p.loc.y * yScale, 1.5, 1.5);
    popMatrix();
    rectMode(CORNER);
  }

var xSize = width / 4;
var ySize = height / 4;
void draw () {
  if (isOnline){
    frameCount++;
    frameRate(30);
    background(0);
    fill(0, 255, 0);
    /*DRAW BACKGROUND; BEGIN*/
    drawStars();
    /*DRAW BACKGROUND; END*/
    p.update();
    p.checkEdges();
    p.userInput();
    drawLocalBullets(bullets);
    handleCollisions(bullets);
    drawBullets(enemyBullets);
    handleCollisions(enemyBullets);
    for (let n = 0; n < remotePlayers.length; n++){
      drawPlayer(remotePlayers[n].player);
      textAlign(LEFT, CENTER);
      fill(255);
      text("Rank\t\tScore   Name", 20, 20);
      fill(remotePlayers[n].player.fillColor);
      text("#" + (n+1) + "       " + remotePlayers[n].player.gameScore + "            " + remotePlayers[n].player.name, 20, (n*30) + 40);
    }
    drawLocalPlayer(p);
    textAlign(CENTER);
    fill(255);
    text("Name: " + p.name, width/2,50);
    text("Your score: " + p.gameScore, width/2, 65);
    text("Bullets taken: " + p.bulletsTaken, width/2,80);
    if (showMap){
      drawminiMap();
    }
    for (let l = 0; l < p.lives; l++){
      image(HEART, 12 + (32*l), height - 40);
    }
    textAlign(LEFT);
    fill(255);
    text(p.lives + "/" + MAX_LIVES + "lives left", 14, height - 60);
    isHit(enemyBullets);
    textAlign(CENTER);
    if (lifeBonusAnimationTimer > 0){
      lifeBonusAnimationTimer--;
      fill(lifeBonusAnimationTimer, 0, 0);
      text("You erased " + currentKill + "!", width/2, height/2 - 100);
    }
  }else{
    background(255);
    fill(0);
    text("Pending...", width/2, height/2);
  }
};

function getRandomColor() {
    return color(getRandomInt(0, 255), getRandomInt(0, 255), getRandomInt(0, 255));
  }

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function toRadians (angle) {
    return angle * (Math.PI / 180);
  }

function compare(a,b) {
  if (a.player.gameScore < b.player.gameScore){
    return 1;
  }
  else if (a.player.gameScore > b.player.gameScore){
    return -1;
  }
  else{
    return 0;
  }
}

function startGame(){
  socket = io();
  isOnline = true;
  p = new Player();
  socket.on("playerUpdate", function (msgObj) {
    for (let n = 0; n < remotePlayers.length; n++){

      if (msgObj.id === remotePlayers[n].id){
        remotePlayers[n] = msgObj;
        remotePlayers.sort(compare);
        return;
      }
    }
    remotePlayers.push(msgObj);
  })

  socket.on("fireBullet", function (bulObj) {
    enemyBullets.push(bulObj);
    console.log(bulObj);
  });

  socket.on("bulletSuccess", function (bulObj) {
    for (let n = 0; n < bullets.length; n++){
      if (bullets[n].bulletID === bulObj.bulletID){
        bullets.splice(n, 1);
        break;
      }
    }
    p.gameScore++;
  });

  socket.on("playerLeft", function (playerID) {
    for (let n = 0; n < remotePlayers.length; n++){
      if (remotePlayers[n].id === playerID.id){
        remotePlayers.splice(n, 1);
      }
    }
  });

  socket.on("killedPlayer", function(name){
    p.lives += 5;
    if (p.lives > MAX_LIVES){
      p.lives = MAX_LIVES;
    }
    lifeBonusAnimationTimer = 255;
    currentKill = name;
  });
  socket.on('chat message', function(msg){
    $('#messages').prepend($('<li>').text(msg));
  });
}

function endGame(){
  socket.close();
  socket = null;
  isOnline = false;
  p = null;
  remotePlayers = [];
  enemyBullets = [];
  $('#myModal').show("modal");
  lifeBonusAnimationTimer = -1;
  currentKill = "";
}
