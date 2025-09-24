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
}

export function generateScenery(count, width, height, env = 'land', rand = Math.random) {
  const types = env === 'transition'
    ? ['beach', 'whitewash']
    : env === 'water'
      ? []
      : ['tree_oak', 'tree_pine', 'tree_birch', 'rock'];
  const density = env === 'land' ? 1.1 : 1;
  const actualCount = Math.floor(count * density);
  const items = [];
  for (let i = 0; i < actualCount; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const type = types.length ? types[Math.floor(rand() * types.length)] : null;
    if (type) items.push(new Scenery(x, y, type));
  }
  return items;
}

export function scrollScenery(items, width, height, speed, dt, rand = Math.random, env = 'land') {
  const types = env === 'transition'
    ? ['beach', 'whitewash']
    : env === 'water'
      ? []
      : ['tree_oak', 'tree_pine', 'tree_birch', 'rock'];
  const shift = speed * dt;
  for (const s of items) {
    s.x -= shift;
  }
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i].x < -80) {
      items.splice(i, 1);
      if (types.length) {
        const x = width + rand() * 80;
        const y = rand() * height;
        const type = types[Math.floor(rand() * types.length)];
        items.push(new Scenery(x, y, type));
      }
    }
  }
}

export function backgroundForEnv() {
  return '#002b11';
}
