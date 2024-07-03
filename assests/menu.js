function menu() {
    this.ui=[];
    this.tree= new entity(16, 23, 0, 0, 0, types.TREE, "", 1.2);
    this.tree.ui=true;
    this.rock=new entity(16, 16, 0, 0, 0, types.ROCK, "", 1.5);
    this.rock.ui=true;
  
    // IU AND MENU
    ms=[[-75,types.HAM],[-161,types.SWD],[13,types.AX],[99,types.HAND]];
    for(i=0;i<ms.length;i++){
      this.ui.push(new entity(16, 16, canvasW/2+ms[i][0], canvasH-96, 0, types.UI, "", 4, 0,true,ms[i][1]));
      this.ui.push(new entity(10, 10, canvasW/2+ms[i][0]+14, canvasH-88, 0, ms[i][1], "", 4, true));
    };
    this.ui[7].sx=96;
    this.ui[7].sy=0;
  
    for(i=0;i<3;i++){
      this.ui.push(new entity(16, 16, 20+(i*32), 0, 0, types.HP, "", 4, true));
    }
  
    this.ui.push(new entity(6, 16, 148, 0, 0, types.HPE, "", 4, true));
    m=new entity(6, 16, 0, 0, 0, types.HPE, "", 4, true);
    m.flip=true;
    this.ui.push(m);
  
    this.tick=function(){
      this.ui.forEach((e) => {
        if(e.type == types.UI){
          if(processClick){
            if(rectColiding(e.hb,clickedRec)){
              processClick=false;
              cart.hero.setWeapon(e.weapon);
            }
          }
        }
      });
    }
  }