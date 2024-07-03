function hero(w, h, x, y, angle, type, scale) {
    this.e = new entity(w, h, x, y, angle, type, "", scale, false, 100);
    this.e.z = 0; // Hero always starts on raised ground. Calculate this if island layout changes
    this.active=true;
    this.particles=[];
    let curTile=null;
    let prevTile=null;
    let speed=0;
    let maxSpeed=3.2;
    let lastDir = RIGHT;
    let runtime=0;
    let cenX=0;
    let cenY=0;
    let offScreen=false;
    this.time=0;
    this.deaths=0;
    this.moved=false;
    this.tool=new entity(10, 10, x, y, 0, types.HAND, "", scale);
    this.shield=new entity(6, 8, x, y, 0, types.SHIELD, "", scale);
    this.tool.setType();
    this.wepPower=0;
    // PowerUps
    this.powPlus=0;
    this.defence=1;
    this.speed=0;
    this.attackTime=0;
    this.renderPower=false;
    this.facing=lastDir;
    this.attackOver=false;
    this.dance=false;
    this.axePower=1;
    this.hammerPower=1;
    this.castleDst=0;
    this.isGad = false;
    this.gadDur = 1000;
    this.dmgTime = 0;
    this.stopsound=0;
    this.walkSound=0;
    this.step1=true;
  
    // Hands
    let theta = 0;  // This is the angle that will increase over time
    this.punchProgress = 0;
    let punch=false;
    let hState = 'idle';
    this.hState=hState; // remove
    // BODY
    this.hands = [];
    this.hands.push(new entity(4, 4, x, y, 0, types.HAND, "", scale, false));
    this.hands.push(new entity(4, 4, x, y, 0, types.HAND, "", scale, false));
  
    this.update = function(ctx, delta){
      this.time+=delta/1000;
      this.moved=false;
  
      // Controls
      if(this.active && zzfx!=null){
        // Progress level
        if(this.curTile && this.curTile.progress){
          this.e.hp+=20;
          if(this.e.hp>100)this.e.hp=100;
          cart.nextLevel();
        }
  
        if(!left() && !right() && !up() && !down()){
          speed = 0;
          runtime = 0;
        } else {
          runtime += delta;
          this.moved=true;
  
          if(this.walkSound<=0){
            this.walkSound=.3;
            zzfxV=.17;
            if(this.step1){
              zzfx(...[,,2,.01,.02,.03,3,.2,-85,-75,-673,.03,.01,-0.1,1,.3,,.3,,.04]);
            } else {
              zzfx(...[,,2,.01,.02,.03,3,.2,-85,-75,-673,.03,.01,-0.1,1,.3,,.42,,.03]);
            }
            zzfxV=.3
            this.step1=!this.step1;
          } else {
            this.walkSound-=delta/1000;
          }
        }
  
        if (up())this.e.y -= this.gMove(0,-1);
        if (down())this.e.y += this.gMove(0,1);
  
        if (left()){
          this.e.x -= this.gMove(-1,0);
          if((hState != 'punch' && hState != 'retracting')){
            this.e.flip = true;
            lastDir=LEFT;
          }
        }
  
        if (right()){
          this.e.x += this.gMove(1,0);
          if((hState != 'punch' && hState != 'retracting')){
            this.e.flip = false;
            lastDir=RIGHT;
          }
        }
  
        // SWORD
        if(one()&&this.tool!=types.SWD)this.setWeapon(types.SWD);
        // HAMMER
        if(two()&&this.tool!=types.HAM)this.setWeapon(types.HAM);
        // AXE
        if(three()&&this.tool!=types.AX)this.setWeapon(types.AX,true);
        //HANDS
        if(four()&&this.tool!=types.HAND)this.setWeapon(types.HAND);
      }
  
      // Particles
      for (let i = 0; i <= this.particles.length-1; i++){
        this.particles[i].update(ctx,delta);
      }
  
      // HANDS CONSTANTS
      this.punchDistance = 75;
      this.punchSpeed = 5;
  
      // hands move when in water
      const waterY = this.e.wet ? -6 : 0;
  
      // Calculate the sine value based on elapsed time
      const amount = this.moved ? 0.01 : 0.003;
      const sin = Math.sin(this.time * amount) * 1.7;
      const offsin = Math.sin(this.time * amount + Math.PI) * 1.7;
  
      // Set X position for both hand
      this.hands[0].x = 30;
      this.hands[1].x = 9;
  
      // Calculate Y position based on movement state
      this.hands[0].y= this.moved? 29 + offsin + waterY : 29 + sin + waterY;
      this.hands[1].y = 29 + sin + waterY;
  
      // IDLE check
      if(this.e.idle>10 || this.dance || this.moved){
        let m=Math.sin(this.time * 15)*.6;
        if(!this.moved)this.e.z+=m;
        this.hands[0].y-=m*6;
        this.hands[1].y+=m*6;
        if(this.e.idle>15)this.e.idle=0;
      }
  
      // Weapon Position
      this.setWeaponX(delta);
      this.setWeaponY();
  
      // Hand logic
      if(space() && (hState=='idle' || hState=='spin' || hState=='swipe')){
        switch (hState) {
          case 'idle':
            if(this.tool.type==types.HAND){ // HANDS
              hState = 'spin';
            } else { // SWORD, AXE, HAMMER
              hState = 'swipe';
            }
            break;
  
          case 'spin':
            theta += .8; // .8 is speed
            this.hands[1].x += 4 * Math.cos(theta); // 4 is Distance from pivot to hand's center
            this.hands[1].y += 4 * Math.sin(theta);
  
            if (theta >= 2 * Math.PI) { // If a full circle is achieved, prepare for punch
              theta = 0;
              punch = true;
              this.punchProgress = 0;
            }
            this.chargeUp();
            break;
        }
      } else { // Button is not down
        // If Hands
        if (punch) {
          this.punchProgress += this.punchSpeed;
          this.hands[1].x = this.punchProgress;
          this.hands[1].scale += 0.1;
          this.tool.scale += 0.1;
          hState = 'punch';
  
          if (this.punchProgress >= this.punchDistance) {
            hState = 'retracting';
            punch = false;
            this.wepPower=0;
          }
        }
  
        switch (hState) {
          case 'idle':
            this.wepPower=0;
            this.attackOver=false;
            break;
          case 'swipe':
            hState = 'retracting'
            break;
        }
      }
  
      if(this.wepPower>=10){
        cart.shakeTime=.1;
        this.dance=true;
      } else {
        this.dance=false;
      }
  
      // Do I need these?
      cenX = this.e.x-this.e.mhWScld;
      cenY = this.e.y-this.e.mhHScld;
  
      // remove after testing
      this.hState=hState;
  
      // Check if we have attacked anything
      if(this.attackTime>0 || this.punchProgress > 0){
        if(lastDir==RIGHT){
           xtra=this.tool.type==types.HAND?25:0;
          hb=new rectanlge(this.e.x+16, this.e.y-10,33+xtra, 35);
        } else {
          xtra=this.tool.type==types.HAND?35:0;
          hb=new rectanlge(this.e.x-15-xtra, this.e.y-10,33+xtra, 35);
        }
  
        // Break decor
        cart.level.decor.forEach((i) => {
          if(i.type!=types.HERO && !this.attackOver){
            if(rectColiding(hb, i.hb)){
              if(this.stopsound<=0){
                zzfx(...[2.04,,265,,,.13,4,.74,,-9.2,,,.15,1.9,,.2,.16,.71,.08]);
                this.stopsound=.25;
              }
              i.hp=0;
              // Upgrade Defence
              if(i.isSkelly() && rndNo(1,100)>70 && this.defence<=5){
                zzfx(...[,,679,.06,.19,.35,,1.67,,,-172,.13,.2,,,,,.59,.25,.06]);
                this.defence++;
              }
              // Upgrade Attack
              if(i.type==types.GRAVE && rndNo(1,100)>70 && this.powPlus<=5){
                zzfx(...[,,679,.06,.19,.35,,1.67,,,-172,.13,.2,,,,,.59,.25,.06]);
                this.powPlus++;
              }
              // Upgrade Speed
              if(i.type==types.STUMP && rndNo(1,100)>70 && this.speed<=1){
                zzfx(...[,,679,.06,.19,.35,,1.67,,,-172,.13,.2,,,,,.59,.25,.06]);
                this.speed+=.25;
              }
            }
          }
        });
  
        cart.level.objs.forEach((i) => {
          if(i.type!=types.HERO && !this.attackOver){
            if(rectColiding(hb, i.hb)){
              switch(i.type){
                case types.TREE:
                  if(this.tool.type==types.AX){
                    // SOUND
                    zzfx(...[2.15,,312,.02,.08,.13,4,.08,,1.7,,,.1,.9,,.1,.08,.7,,.25]);
                    i.hp-=this.axePower+this.powPlus;
                    if(i.hp<=0){
                      cart.level.decor.push(new entity(4, 6, i.x+18, i.y+41, 0, types.STUMP, "", scale, false, 3));
                      zzfx(...[2.03,,585,.05,.18,.35,2,3.08,,.4,,,.06,1.7,,.1,.42,.33,.14]);
                    }
                    // SOUND
                    this.attackOver=true;
                  } else {
                    //SOUND STOP
                    if(this.stopsound<=0){
                      zzfx(...[1.99,,1163,.01,.03,.01,4,.49,,,,,,.1,-219,.1,.19,,,.26]);
                      this.stopsound=.25;
                    }
                  }
                  cart.shakeTime=.15;
  
                  break;
                case types.ROCK:
                  if(this.tool.type==types.HAM){
                    i.hp-=this.hammerPower+this.powPlus;
                    // SOUND
                    zzfx(...[2.04,,265,,,.13,4,.74,,-9.2,,,.15,1.9,,.2,.16,.71,.08]);
                    i.hp-=this.axePower;
                    this.attackOver=true;
                    if(i.hp==0 && rndNo(1,100)>50) this.e.hp +=5;
                  } else {
                    //SOUND STOP
                    if(this.stopsound<=0){
                      zzfx(...[1.99,,1163,.01,.03,.01,4,.49,,,,,,.1,-219,.1,.19,,,.26]);
                      this.stopsound=.25;
                    }
                  }
                  cart.shakeTime=.1;
                  break;
                case types.SKELLY:
                  i.parent.hit(delta, this.tool.type, this.wepPower);
                  cart.shakeTime=.2;
                  this.attackOver=true;
                  if(i.parent.e.hp<=0){
                    if(rndNo(1,10)>5)cart.level.decor.push(new entity(11, 10, i.x+18, i.y+10, rndNo(-45,45), types.SKELLY, "", scale, false, 1));
                    cart.level.dead.push(i.parent);
                  }
                   kBack(this, i.parent.e, this.wepPower+this.powPlus);
                  break;
                case types.GOB:
                  i.parent.hit(delta, this.tool.type, this.wepPower+this.powPlus);
                  // SOUND
                  zzfx(...[,,354,.01,.08,.13,2,.3,-1.5,.1,,.01,,1.7,,.4,,.75,.02,.22]);
                  cart.shakeTime=.2;
                  this.attackOver=true;
                  if(i.parent.e.hp<=0){
                    cart.level.dead.push(i.parent);
                    // GRAVE
                    cart.level.decor.push(new entity(7, 9, i.parent.e.x, i.parent.e.y, 0, types.GRAVE, "", scale, false, 1))
                  }
                  break;
              }
            }
          }
        });
      }
      // Show the power meter?
      this.renderPower=((hState == 'spin' || hState == 'swipe') && (this.tool.type == types.HAND || this.tool.type == types.SWD));
      this.facing=lastDir;
  
      // invincible
      if(this.isGad && Date.now() - this.dmgTime >= this.gadDur){
        this.isGad = false;
      }
  
      // set shield
      if(lastDir==RIGHT){
        this.shield.x=this.hands[1].x;
        this.shield.y=this.hands[1].y-3;
      } else {
        this.shield.x=this.hands[0].x;
        this.shield.y=this.hands[0].y-3;
      }
  
      if(this.stopsound>0) this.stopsound-=delta/1000;
    } // End of Update
  
    this.hit = function(damage, e){
      if(!this.isGad || e.isSkelly()){
          zzfx(...[.9,-0.05,105,.04,.06,.03,3,1.1,-2.6,-1.1,,,,.4,,.4,,.7,.01,.21]);
          this.e.hp -= damage/this.defence;
          this.isGad = true;
          this.dmgTime = Date.now();
          knockback(this, e, 5);
      }
  }
  
    this.reset = function(){
      this.done=false;
      this.particles=[];
      let lvl=cart.levels[this.e.curLevel];
      this.e.x=lvl.startPos[0];
      this.e.y=lvl.startPos[1];
    }
  
    this.kill = function(){
      if(this.active){
        cart.shakeTime=3;
      }
    }
  
    this.setCurrentTile = function(scaled) {
      if(this.moved){
        prevTile=curTile;
        // Convert hero's Cartesian position to grid position
        curTile=getTile(this.e.x,this.e.y,this.e.height,this.e.z);
  
        // Deal with the elevation
        if (curTile && prevTile && curTile.id !== prevTile.id) {
            // Changed Tiles
            if (prevTile.up !== curTile.up) {
              this.e.z = -curTile.up*.25;
            }
        }
      }
      // Hero Speed based on the tile
      if(curTile != null){
        if(curTile.e.type==types.WTR){
          speed=1;
          this.e.wet=true;
        } else if(curTile.e.type==types.SEA){
          speed=.3;
          this.e.wet=true;
        } else {
          speed=maxSpeed+this.speed;
          this.e.wet=false;
        }
      }
      this.curTile=curTile;
    }
  
    this.setWeaponX = function(delta){
      switch(this.tool.type){
        case types.SWD: // SWORD
          if(hState=='idle')this.tool.angle=lastDir==RIGHT?80:45;
          if(hState=="swipe"){
            this.chargeUp();
            if(lastDir==RIGHT){
              if(this.tool.angle>10)this.tool.angle-=3;
            } else {
              if(this.tool.angle<90)this.tool.angle+=3;
            }
          }
          if(hState=='retracting') this.retract();
          this.tool.x=this.e.x+this.hands[1].x+1;
          break;
        case types.HAM: // HAMMER
          if(hState=="idle")this.tool.angle=lastDir==RIGHT?70:30;
          if(hState=="swipe"){
            this.tool.angle=this.tool.angle=lastDir==RIGHT?30:70;
            this.hands[0].y-=10;
            this.hands[1].y-=7;
          };
          if(hState=='retracting') this.retract();
          this.tool.x=lastDir==RIGHT?this.e.x+this.hands[1].x+1:this.e.x+this.hands[1].x-20;
          this.hands[1].x = 30;
          break;
        case types.AX: // AXE
          if(hState=="idle")this.tool.angle=30;
          if(hState=="swipe"){
            this.tool.angle=90;
            this.hands[0].y-=10;
            this.hands[1].y-=7;
          };
          if(hState=='retracting') this.retract();
          this.tool.flip=lastDir==RIGHT;
          this.hands[1].x = 30;
          this.tool.x=lastDir==RIGHT?this.e.x+this.hands[0].x+1 : this.e.x+this.hands[0].x-40;
          break;
        case types.HAND: // HANDS
          if(hState=='retracting'){
            this.punchProgress -= this.punchSpeed;
            this.hands[1].x = this.punchProgress;
            this.hands[1].scale -= 0.1;
            this.tool.scale -= 0.1;
            if (this.punchProgress <= 0) {
              this.punchProgress = 0;
              hState = 'idle';
            }
          }
          break;
      }
    }
  
    this.setWeaponY=function(){
      if(hState=="idle"||hState=="swipe"){
        // Weapon position in hands
        let h=lastDir==RIGHT?0:1;
        this.tool.y=this.hands[h].y+this.e.y-this.e.z-17;
      }
    }
  
    this.chargeUp=function(){
      this.wepPower=this.wepPower>=10?10:this.wepPower+=.25;
      if(this.wepPower>=10);
    }
  
    this.retract=function(){
      let h=lastDir==RIGHT?1:0;
      this.tool.y=this.hands[h].y+this.e.y-this.e.z-17;
      if(this.tool.type==types.AX){
        this.tool.angle=330;
      } else if(this.tool.type==types.HAM) {
        this.tool.angle=lastDir==RIGHT?120:330;
      } else if(this.tool.type==types.SWD) {
        if(lastDir==RIGHT){
          this.tool.angle=lerp(this.tool.angle,120,.8);
        } else {
          this.tool.angle=330;
        }
      }
      if(this.attackTime>.2){
          hState='idle';
          this.attackTime=0;
      } else {
        this.attackTime+=delta/1000;
      }
    }
  
    this.setWeapon = function(t,f=false){
      if(hState=='idle'){
        this.tool.type=t;
        this.tool.setType();
        this.tool.flip=f;
        this.tool.ui=false;
      }
    }
  
    this.isShielded = function(){
      return shift() && (this.tool.type==types.SWD||cart.hero.tool.type==types.HAND);
    }
  
    // todo add the isSword etc
    this.gMove = function(xx,yy, grav=false, jump=false){
      this.e.idle=0;
  
      rec = cloneRectanlge(this.e.hb);
      rec.w=20; // Fudge a smaller HB
      rec.h=10;
      rec.x += xx * speed;
      rec.y += yy * speed/2;
      canMove = true;
  
      for (var t = 0; t < cart.level.objs.length; t++) {
        obj = cart.level.objs[t];
        if(obj!=null){
          if(rectColiding(obj.hb,rec)&&obj.type!=2){
            if(obj.isSolid){
              canMove = false;
              break;
            }
          }
        }
      }
      if(canMove){
        if(yy!=0){
          return speed/2;
        } else {
          return speed;
        }
      } else {
        return 0;
      }
    }
  }