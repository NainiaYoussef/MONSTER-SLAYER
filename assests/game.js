
let canvasW = window.innerWidth;
let canvasH = window.innerHeight;
let gameStarted = false;
let delta = 0.0;
let prevDelta = Date.now();
let currentDelta = Date.now();
let TIME = 0;
let introT = 0;
let mousePos = new vec2(0,0);
let clickedAt = new vec2(0,0);
let clickedRec = new rectanlge(0,0,0,0);
let processClick = false;
let GAMEOVER=false;
let RELOAD=false;
let WIN = false;
let STAGE=1;
colz=40+(STAGE*2);
let atlas = new Image();
atlas.src = "atlas.png";
atlas.crossOrigin = "anonymous";
let shadowImage=new Image();
let shaky = true;
let cart = new Cart();
start=false;
let music=true;
let pause=false;
let leftMB=false;
let rightMB=false;
let startDelay=2;

// Load the music player
genAudio();

// Called by body onload on index page
function startGame() {
  mg.start();
}

let mg = {
  canvas: document.createElement("canvas"),
  start: function() {
    this.canvas.width = canvasW;
    this.canvas.height = canvasH;
    this.context = this.canvas.getContext("2d");
    this.context.scale(1, 1);

    // PixelArt Sharp
    ctx=this.context;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    this.canvas.classList.add("screen");
    document.body.insertBefore(this.canvas, document.body.childNodes[6]);
    this.frameNo = 0;
    this.interval = setInterval(updateGameArea, 20);

    // Shadows
    shadowImage.crossOrigin = "anonymous";
    shadowImage.src = 'atlas.png';

    shadowImage.onload = function() {
      shadowImage = mkShadows(shadowImage);
    }

    // Keyboard
    window.addEventListener('keydown', function(e) {
      if(startDelay<=0)start=true;
      e.preventDefault();
      mg.keys = (mg.keys || []);
      mg.keys[e.keyCode] = (e.type == "keydown");
    })
    dd=true;
    window.addEventListener('keyup', function(e) {
      mg.keys[e.keyCode] = (e.type == "keydown");
      if(e.keyCode==R) RELOAD=true;
      if(e.keyCode==M) pause=!pause;
      if(e.keyCode==T) cart.tips=!cart.tips;
      if(dd){zzfxX=new AudioContext();dd=false;};
    })
    window.addEventListener('mouseup', function(e) {
      e.preventDefault();
      setclicks();
      processClick=true;

      if (e.button === 0) {
        leftMB=false;
      } else if (e.button === 2) {
        rightMB=false;
      }
    })
    window.addEventListener('mousedown', function(e) {
      e.preventDefault();
      if (e.button === 0) {
        leftMB=true;
      } else if (e.button === 2) {
        rightMB=true;
      }
    })
    window.addEventListener('mousemove', function(e) {
      e.preventDefault();
      var r = mg.canvas.getBoundingClientRect();
      mousePos.set((e.clientX - r.left) / (r.right - r.left) * canvasW,
                   (e.clientY - r.top) / (r.bottom - r.top) * canvasH);
  })
    // Disable right click context menu
    this.canvas.oncontextmenu = function(e) {
      e.preventDefault();
    };
  },
  stop: function() {
    clearInterval(this.interval);
  },
  clear: function() {
    this.context.clearRect(0, 0, 4*this.canvas.width, 4*this.canvas.height);
  }
}

function mkShadows(image) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(image, 0, 0);

    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;

    // Convert all non-transparent pixels to black
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] !== 0) { // Check if pixel is not transparent
            data[i] = 0;     // Red
            data[i + 1] = 0; // Green
            data[i + 2] = 0; // Blue
        }
    }

    tempCtx.putImageData(imageData, 0, 0);

    const blackImage = new Image();
    blackImage.src = tempCanvas.toDataURL("image/png");
    return blackImage;
}

function updateGameArea() {
  if(GAMEOVER){
    TIME=0;
    GAMEOVER=false;
    WIN=false;
    STAGE=0;
    start=false;
    gameStarted=false;
    cart.hero.e.hp=100;
    cart.genLevel();
    cart.setLevel(0);
    startDelay=3;
  }

  if(start){
    if(cart.hero != null)cart.hero.e.active=true;
    gameStarted=true;
  }

  // Delta
  prevDelta = currentDelta;
  currentDelta = Date.now();
  delta = currentDelta - prevDelta;
  TIME += delta;
  if(startDelay>0)startDelay-=delta/1000;
  if (!gameStarted) {
    // intro Screen
    mg.clear();
    ctx = mg.context;
    cart.update(delta, TIME, true);
    ctx.save();
    drawBox(ctx,0.8,"black",0,0,canvasW,canvasH)
    let font="70px Papyrus";
    writeTxt(ctx, 1, font,"WHITE","Monster Slayer Chronicles!", 30, 90);
    font="50px Papyrus";
    writeTxt(ctx, 1, font,"WHITE",startDelay>0?"Generating World ..":"Press any key to start", 30, canvasH-120);
    font="30px Papyrus";
    writeTxt(ctx, 1, font,"RED","Controls", 30, 160);
    writeTxt(ctx, 1, font,"WHITE","Move: WASD/Arrows", 30, 200);
    writeTxt(ctx, 1, font,"WHITE","Attack: Space/LMB (Hold)", 30, 250);
    writeTxt(ctx, 1, font,"WHITE","Weapon: 1-4/RMB on icons", 30, 300);
    writeTxt(ctx, 1, font,"WHITE","Block: Shift/RMB", 30, 350);
    writeTxt(ctx, 1, font,"WHITE","Upgrade chance: Destroy drops", 30, 400);
    writeTxt(ctx, 1, font,"WHITE","@Nainia Youssef", 30, canvasH-50);
    ctx.restore();
  } else {
    mg.clear();
    cart.update(delta, TIME, false);
    let font = "30px Papyrus";
    if(cart.level.id==11){
      writeTxt(ctx, 1, font,"WHITE","You have saved the land!", canvasW/2-100, 40);
    } else {
      writeTxt(ctx, 1, font,"WHITE","Stage: " + (cart.hero.e.curLevel+1), canvasW/2, 40);
    }

    writeTxt(ctx, 1, font,"WHITE","HP: " + Math.floor(cart.hero.e.hp), 20, 40);
    font = "20px Papyrus";
    writeTxt(ctx, 1, font,"WHITE","Attack+    : " + cart.hero.powPlus, 200, 20);
    writeTxt(ctx, 1, font,"WHITE","Defence+ : " + (cart.hero.defence-1), 200, 40);
    writeTxt(ctx, 1, font,"WHITE","Speed+     : " + cart.hero.speed, 200, 60);
    writeTxt(ctx, 1, font,"WHITE","Castle Resources:", canvasW-260, 18);

    let lvl=cart.hero.e.curLevel;

    // Music
    if(pause){
      audio.pause();
      music=true;
    }

    if(music && songLoaded && !pause){
      audio.play();
      audio.loop=true;
      music=false;
    }
  }
  processClick=false;
}

function drawBox(ctx,a,colour,x,y,w,h) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = a;
  ctx.fillStyle = colour;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function writeTxt(ctx,a,font,colour,txt,x,y) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = a;
  ctx.font = font;
  ctx.fillStyle = colour;
  ctx.fillText(txt, x, y);
  ctx.restore();
}

function left() {
  return mg.keys && (mg.keys[LEFT] || mg.keys[A]);
}

function right() {
  return mg.keys && (mg.keys[RIGHT] || mg.keys[D]);
}

function up() {
  return mg.keys && (mg.keys[UP] || mg.keys[W]);
}

function down() {
  return mg.keys && (mg.keys[DOWN] || mg.keys[S]);
}

function space() {
  return (mg.keys && mg.keys[SPACE]) || leftMB;
}

function shift() {
  return (mg.keys && mg.keys[SHIFT]) || rightMB;
}

function map() {
  return mg.keys && mg.keys[M];
}

function one() {
  return mg.keys && (mg.keys[ONE]);
}

function two() {
  return mg.keys && (mg.keys[TWO]);
}

function three() {
  return mg.keys && (mg.keys[THREE]);
}

function four() {
  return mg.keys && (mg.keys[FOUR]);
}

function t() {
  return mg.keys && (mg.keys[T]);
}

function setclicks(){
  clickedAt.set(mousePos.x, mousePos.y);
  clickedRec.x=mousePos.x-5;
  clickedRec.y=mousePos.y+5;
  clickedRec.h=10;
  clickedRec.w=10;
}