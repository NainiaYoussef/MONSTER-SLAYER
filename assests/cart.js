function Cart() {
    var totalWidth = 800;
    var totalHeight = 600;
    var widthToHeight = 4 / 3;
    var newWidthToHeight = totalHeight / canvasH;
    var resize=true;
    this.cam=new Camera();
    this.ratio=1;
    this.tips=true;
    this.time=0;
  
    if (canvasW > totalWidth) {
      this.ratio=canvasW / totalWidth;
    } else {
      this.ratio=canvasH / totalHeight;
    }
  
    // if the window is 800px and your canvas 600px, apply scale(/*800/600 = */ 1.2)
    this.scale = 2;
    this.cube = 16; // width of tiles
    this.scaled = this.scale*this.cube;
    this.hero = new hero(16, 16, 0, 0, 0, types.HERO, this.scale);
    this.introT=0;
    this.shake=0;
    this.shakeTime=0;
    this.reset=false;
    this.wait=2;
  
    this.genLevel = function(num){
      this.levels = []; // Array to get tiles surrounding an entity
  
      for(let i=1;i<=11;i++){
        var lvl = new level(i, canvasW, canvasH, this.scale);
        lvl.reset(i, this.scaled);
        this.levels.push(lvl);
      }
    }
  
    this.setLevel = function(id){
      this.level = this.levels[id];
      this.hero.e.curLevel = id;
      this.hero.e.x=this.level.startPos[0];
      this.hero.e.y=this.level.startPos[1];
      this.level.objs.push(this.hero.e);
    }
  
    this.nextLevel  = function(){
      this.setLevel(STAGE);
      STAGE++;
    }
  
    // Set up levels and start at level 1
    this.genLevel(0);
    this.setLevel(0);
  
    // UI
    this.menu = new menu();
  
    // Render & Logic
    this.update = function(delta, time, intro=false) {
      this.time+=delta/1000;
  
      if(resize){
        resize=false;
        ctx.scale(this.ratio,this.ratio);
      }
  
      // Screen shake
      this.shake = shaky ? Math.cos(TIME) : 0;
      if(cart.shakeTime>0) cart.shakeTime-=delta/1000;
  
      this.hero.setCurrentTile(this.scaled);
  
      // HERO
      if(!intro){
        this.level.draw(this.hero, delta);
        // draw all the shadows
        this.hero.update(ctx, delta);
        // MOUSE
        //mg.canvas.style.cursor='none';
        // Render Menu
        drawBox(ctx,0.8,"black",0,0,canvasW,75);
  
        if(this.level.tip){
          font="25px Papyrus";
          drawBox(ctx,0.8,"black",0,canvasH-100,canvasW,100)
          if(cart.level.complete){
            writeTxt(ctx, 1, font,"WHITE",this.level.tip2, 20, canvasH-10);
          } else {
            writeTxt(ctx, 1, font,"WHITE",this.level.tip, 20, canvasH-10);
          }
        }
        font = "30px Papyrus";
        writeTxt(ctx, 1, font,"WHITE","[M] Music: " + !pause, canvasW-230, canvasH-10);
  
        this.menu.ui.forEach(e => e.update(delta));
        this.menu.tick();
  
        // Draw resources
        for(i=1;i<=this.level.trees;i++){
          this.menu.tree.x=canvasW-(i*30);
          this.menu.tree.y=18;
          this.menu.tree.update(delta);
        }
        for(i=1;i<=this.level.rocks;i++){
          this.menu.rock.x=canvasW-(i*30);
          this.menu.rock.y=45;
          this.menu.rock.update(delta);
        }
      } else {
        // Intro Screen
        this.level.draw(this.hero, delta, intro);
      }
  
      // Tick the mobs but add the entities to the obj list to render!
      this.level.mobs.forEach(m => m.update(delta));
  
      // Follow hero
      this.cam.x = lerp(-this.hero.e.x + (totalWidth/2)-20,this.cam.x ,.8);
      this.cam.y = lerp(-this.hero.e.y + (totalHeight/2)-80,this.cam.y ,.8);
  
      // Remove objects
      this.level.objs = this.level.objs.filter(function (i) {
        return i.hp > 0;
      });
  
      this.level.decor = this.level.decor.filter(function (i) {
        return i.hp > 0;
      });
  
      this.level.dead = this.level.dead.filter(function (i) {
        return i.e.alpha >= 0;
      });
  
      this.level.mobs = this.level.mobs.filter(function (i) {
        return i.e.hp > 0;
      });
    }
  }