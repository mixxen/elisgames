export class Scenery {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
  }

  update(dt, speed) {
    this.x -= speed * dt;
  }

  draw(ctx, sprites, drawSprite) {
    const sprite = sprites[this.type];
    if (sprite) {
      drawSprite(sprite, this.x, this.y);
    }
  }
}

export function generateScenery(count, width, height, rand = Math.random) {
  const types = ['grass', 'tree', 'rock'];
  const items = [];
  for (let i = 0; i < count; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const type = types[Math.floor(rand() * types.length)];
    items.push(new Scenery(x, y, type));
  }
  return items;
}

export function scrollScenery(items, width, height, speed, dt, rand = Math.random) {
  const types = ['tree', 'rock'];
  for (const s of items) {
    s.update(dt, speed);
  }
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i].x < -50) {
      items.splice(i, 1);
      const x = width + rand() * 50;
      const y = rand() * height;
      const type = types[Math.floor(rand() * types.length)];
      items.push(new Scenery(x, y, type));
    }
  }
}
