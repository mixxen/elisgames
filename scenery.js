export class Scenery {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    if (typeof type === 'string' && type.startsWith('tree')) {
      const radiusByType = {
        tree_oak: 42,
        tree_pine: 46,
        tree_birch: 38
      };
      this.radius = radiusByType[type] || 40;
    } else if (type === 'rock') {
      this.radius = 24;
    } else {
      this.radius = 0;
    }
  }

  update(dt, speed) {
    this.x -= speed * dt;
  }

  draw(ctx, sprites, drawSprite) {
    const sprite = sprites?.[this.type];
    if (sprite && typeof drawSprite === 'function') {
      drawSprite(sprite, this.x, this.y);
    }
  }
}

const SCENERY_CONFIG = {
  land: { spawn: ['grass', 'tree', 'rock'], scroll: ['tree', 'rock'], density: 1 },
  forest: { spawn: [], scroll: [], density: 0 },
  sand: { spawn: ['rock'], scroll: ['rock'], density: 0.6 },
  water: { spawn: ['wave'], scroll: ['wave'], density: 1 },
  transition: { spawn: ['beach', 'whitewash'], scroll: ['beach', 'whitewash'], density: 1 }
};

function getSceneryConfig(env = 'land') {
  return SCENERY_CONFIG[env] || SCENERY_CONFIG.land;
}

export function generateScenery(count, width, height, env = 'land', rand = Math.random) {
  const { spawn, density = 1 } = getSceneryConfig(env);
  const items = [];
  if (!spawn.length) return items;
  let actualCount = Math.floor(count * density);
  if (actualCount <= 0 && count > 0) {
    actualCount = 1;
  }
  if (actualCount <= 0) return items;
  for (let i = 0; i < actualCount; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const type = spawn[Math.floor(rand() * spawn.length)];
    items.push(new Scenery(x, y, type));
  }
  return items;
}

export function scrollScenery(items, width, height, speed, dt, rand = Math.random, env = 'land') {
  const { scroll } = getSceneryConfig(env);
  const shift = speed * dt;
  for (const s of items) {
    s.x -= shift;
  }
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i].x < -50) {
      items.splice(i, 1);
      if (scroll.length) {
        const x = width + rand() * 50;
        const y = rand() * height;
        const type = scroll[Math.floor(rand() * scroll.length)];
        items.push(new Scenery(x, y, type));
      }
    }
  }
}

export function backgroundForEnv(env = 'forest') {
  switch (env) {
    case 'water':
      return '#001a33';
    case 'transition':
      return '#704214';
    case 'sand':
      return '#5a3b11';
    case 'land':
    case 'forest':
    default:
      return '#002b11';
  }
}
