// entities.js - Sistema de entidades do jogo (Player, Enemy, Boss)

export function createPlayer(img, initialX, scale, footOffset) {
  const p = {
    x: Math.round(initialX),
    y: 0,
    vx: 0,
    vy: 0,
    width: 0,
    height: 0,
    scale,
    maxSpeedX: 6,
    facing: 1,
    onGround: false,
    minY: 0,
    maxY: Infinity,
    collisionBox: { left: 0, top: 0, right: 0, bottom: 0 },
    
    setBounds(w, h, platH = 0, platOffset = 0) {
      this.maxX = w;
      this.maxY = Math.round(h - platH - Math.round(this.height * this.scale) - platOffset);
      if (this.maxY < 0) this.maxY = 0;
    },
    
    update() {
      // apply gravity
      this.vy += 0.8;
      this.y += this.vy;

      // floor collision
      if (this.y >= this.maxY) {
        this.y = this.maxY;
        this.vy = 0;
        this.onGround = true;
      } else this.onGround = false;

      // horizontal movement from keys
      if (this.isMovingRight) { this.vx += 1; this.facing = 1; }
      else if (this.isMovingLeft) { this.vx -= 1; this.facing = -1; }
      else {
        // friction
        if (this.vx > 0) { this.vx -= 1; if (this.vx < 0) this.vx = 0; }
        else if (this.vx < 0) { this.vx += 1; if (this.vx > 0) this.vx = 0; }
      }

      // clamp
      if (this.vx > this.maxSpeedX) this.vx = this.maxSpeedX;
      if (this.vx < -this.maxSpeedX) this.vx = -this.maxSpeedX;

      this.x += this.vx;
      if (this.x < 0) this.x = 0;
      if (this.x > this.maxX - Math.round(this.width * this.scale)) this.x = this.maxX - Math.round(this.width * this.scale);

      // collision box
      const w = Math.round(this.width * this.scale);
      const h = Math.round(this.height * this.scale);
      const shrinkX = Math.floor(w / 6);
      const shrinkY = Math.floor(h / 6);
      this.collisionBox.left = this.x + shrinkX;
      this.collisionBox.top = this.y + shrinkY;
      this.collisionBox.right = this.x + w - shrinkX;
      this.collisionBox.bottom = this.y + h - shrinkY;
    },
    
    draw(ctx) {
      if (!img.complete) return;
      const sw = this.width; const sh = this.height;
      const dw = Math.round(sw * this.scale);
      const dh = Math.round(sh * this.scale);
      const dx = Math.round(this.x);
      const dy = Math.round(this.y);

      ctx.save();
      if (this.facing === -1) {
        ctx.translate(dx + dw, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, sw, sh, 0, dy, dw, dh);
      } else {
        ctx.drawImage(img, 0, 0, sw, sh, dx, dy, dw, dh);
      }
      ctx.restore();
    }
  };
  
  return p;
}

export function createEnemy(enemyImg, x, canvas, scale, platformHeight, platformOffset) {
  const w = enemyImg.width || 32;
  const h = enemyImg.height || 32;

  // compute scale based on player size
  const desiredW = Math.max(8, Math.round(48 * 0.5));
  let computedScale = desiredW / w;
  computedScale = Math.max(0.25, Math.min(computedScale, 2));

  const e = {
    x: typeof x === 'number' ? x : Math.round(Math.random() * Math.max(0, canvas.width - w)),
    y: 0,
    vx: Math.random() > 0.5 ? 2 : -2,
    width: w,
    height: h,
    scale: computedScale,
    facing: 1,
    minY: 0,
    maxY: Infinity,
    collisionBox: { left: 0, top: 0, right: 0, bottom: 0 },
    isColliding: false,
    
    update(playerRef) {
      // AI: perseguir o player
      if (playerRef.current) {
        const playerCenterX = playerRef.current.x + Math.round(playerRef.current.width * playerRef.current.scale) / 2;
        const enemyCenterX = this.x + Math.round(this.width * this.scale) / 2;
        const diff = playerCenterX - enemyCenterX;
        
        const speed = 1;
        if (Math.abs(diff) > 5) {
          if (diff > 0) {
            this.vx = speed;
            this.facing = 1;
          } else {
            this.vx = -speed;
            this.facing = -1;
          }
        } else {
          this.vx = 0;
        }
      }
      
      this.x += this.vx;
      if (this.x < 0) { this.x = 0; }
      if (this.x > canvas.width - Math.round(this.width * this.scale)) { 
        this.x = canvas.width - Math.round(this.width * this.scale); 
      }

      // update collision box
      const wD = Math.round(this.width * this.scale);
      const hD = Math.round(this.height * this.scale);
      const shrinkX = Math.floor(wD / 6);
      const shrinkY = Math.floor(hD / 6);
      this.collisionBox.left = this.x + shrinkX;
      this.collisionBox.top = this.y + shrinkY;
      this.collisionBox.right = this.x + wD - shrinkX;
      this.collisionBox.bottom = this.y + hD - shrinkY;
    },
    
    draw(ctx) {
      if (!enemyImg.complete) return;
      const dw = Math.round(this.width * this.scale);
      const dh = Math.round(this.height * this.scale);
      const dx = Math.round(this.x);
      const dy = Math.round(this.y);
      ctx.save();
      if (this.facing === -1) {
        ctx.translate(dx + dw, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(enemyImg, 0, 0, this.width, this.height, 0, dy, dw, dh);
      } else {
        ctx.drawImage(enemyImg, 0, 0, this.width, this.height, dx, dy, dw, dh);
      }
      ctx.restore();
    }
  };
  
  return e;
}

export function createBoss(bossImg, playerRef, canvas) {
  if (!playerRef.current) return null;

  const w = bossImg.width || 64;
  const h = bossImg.height || 64;
  const bossScale = 0.15;

  const playerCenterX = playerRef.current.x + Math.round(playerRef.current.width * playerRef.current.scale) / 2;
  const bossWidth = Math.round(w * bossScale);
  const bossX = playerCenterX < canvas.width / 2 
    ? canvas.width - bossWidth - 80
    : 80;

  const bossHeight = Math.round(h * bossScale);
  const bossY = playerRef.current.maxY;

  const boss = {
    x: bossX,
    y: bossY,
    width: w,
    height: h,
    scale: bossScale,
    facing: playerCenterX < canvas.width / 2 ? -1 : 1,
    health: 2,
    maxY: playerRef.current.maxY,
    collisionBox: { left: 0, top: 0, right: 0, bottom: 0 },
    isColliding: false,
    shootTimer: 0,
    shootInterval: 150,
    
    update() {
      const wD = Math.round(this.width * this.scale);
      const hD = Math.round(this.height * this.scale);
      const shrinkX = Math.floor(wD / 12);
      const shrinkY = Math.floor(hD / 12);
      this.collisionBox.left = this.x + shrinkX;
      this.collisionBox.top = this.y + shrinkY;
      this.collisionBox.right = this.x + wD - shrinkX;
      this.collisionBox.bottom = this.y + hD - shrinkY;

      this.shootTimer++;
    },
    
    draw(ctx) {
      const dw = Math.round(this.width * this.scale);
      const dh = Math.round(this.height * this.scale);
      const dx = Math.round(this.x);
      const dy = Math.round(this.y);
      
      ctx.save();
      if (bossImg.complete && bossImg.width > 0) {
        if (this.facing === -1) {
          ctx.translate(dx + dw, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(bossImg, 0, 0, this.width, this.height, 0, dy, dw, dh);
        } else {
          ctx.drawImage(bossImg, 0, 0, this.width, this.height, dx, dy, dw, dh);
        }
      }
      ctx.restore();

      // barra de vida
      const barWidth = dw;
      const barHeight = 8;
      const barX = dx;
      const barY = dy - 20;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      ctx.fillStyle = this.health === 2 ? '#00ff00' : '#ffff00';
      ctx.fillRect(barX, barY, (barWidth * this.health) / 2, barHeight);
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
  };
  
  return boss;
}
