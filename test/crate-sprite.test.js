import assert from 'node:assert/strict';

const Sprites = { crateGren:{}, crateGun:{}, crateShot:{}, crateMiss:{} };
let lastSprite = null;
function drawSprite(sprite){ lastSprite = sprite; }

class Supply {
  constructor(type){ this.type = type; this.pos = {x:0,y:0}; this.radius = 14; this.pulse = 0; }
  draw(ctx){
    const glow = (Math.sin(this.pulse)*0.5 + 0.5)*6 + 8;
    ctx.save(); ctx.globalAlpha = .18; ctx.fillStyle = this.type==='grenade' ? '#ffe59a' : this.type==='shotgun' ? '#ffa8e2' : this.type==='missile' ? '#a8ffa8' : '#a8d5ff';
    ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, this.radius+glow, 0, Math.PI*2); ctx.fill(); ctx.restore();
    drawSprite(this.type==='grenade'?Sprites.crateGren:this.type==='shotgun'?Sprites.crateShot:this.type==='missile'?Sprites.crateMiss:Sprites.crateGun, this.pos.x, this.pos.y, 0, 1.6);
  }
}

const ctx = { save(){}, restore(){}, beginPath(){}, arc(){}, fill(){}, globalAlpha:0, fillStyle:'' };
const machine = new Supply('machine');
machine.draw(ctx);
assert.equal(lastSprite, Sprites.crateGun);
const shot = new Supply('shotgun');
shot.draw(ctx);
assert.equal(lastSprite, Sprites.crateShot);
const miss = new Supply('missile');
miss.draw(ctx);
assert.equal(lastSprite, Sprites.crateMiss);
console.log('Crate sprite test passed');
