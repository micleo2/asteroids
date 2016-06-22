function isMobile () {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};
var socket;
var isOnline = false;
var p;

$('form').submit(function(){
  socket.emit('chat message', $('#m').val(), {color: p.fillColor, name: p.name});
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
var mouseIsPressed = false;
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

        if (keys[UP] || keys[87] || (mouseIsPressed && isMobile() && mouseY < height * 0.3)){
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

        if (!(keys[LEFT]) && !(keys[RIGHT]) && !(mouseIsPressed && isMobile() && mouseX < width * 0.3) && !(mouseIsPressed && isMobile() && mouseX > width * 0.7)){
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
        if (keys[UP] || keys[87] || (mouseIsPressed && isMobile() && mouseY < height * 0.3)){
            var copy = new PVector(cos(this.rot - toRadians(90)), sin(this.rot - toRadians(90)));

            copy.normalize();
            copy.mult(1);

            this.acceleration.add(copy);
        }

        if (keys[LEFT] || keys[65] || (mouseIsPressed && isMobile() && mouseX < width * 0.3)){
            this.rotA -= s;
        }
        if (keys[RIGHT] || keys[68] || (mouseIsPressed && isMobile() && mouseX > width* 0.7)){
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
        shootBullet();
    }else if (keyCode === 77){//letter "m"
      showMap = !showMap;
    }
};
function shootBullet(){
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
}
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

void mousePressed(){
  mouseIsPressed = true;
}
void mouseReleased(){
  mouseIsPressed = false;
  if (isOnline && isMobile() && mouseY > height * 0.7){
    shootBullet();
  }
}
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
  socket.on('chat message', function(msg, info){
    $('#messages').prepend($('<li>').text(msg).prepend("<b>" + info.name + ":</b>"));
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
