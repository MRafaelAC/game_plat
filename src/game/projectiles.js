// projectiles.js - Sistema de projéteis (Bullets, Fireballs)

export function createBullet(bulletImg, playerRef, canvas) {
  if (!playerRef.current) return null;
  
  const bulletScale = 4;
  const bw = 16;
  const bh = 16;
  
  const playerWidth = Math.round(playerRef.current.width * playerRef.current.scale);
  const playerHeight = Math.round(playerRef.current.height * playerRef.current.scale);
  
  const bullet = {
    x: playerRef.current.facing === 1 
      ? playerRef.current.x + playerWidth 
      : playerRef.current.x - Math.round(bw * bulletScale),
    y: playerRef.current.y + Math.round(playerHeight * 0.4),
    vx: playerRef.current.facing === 1 ? 6 : -6,
    width: bw,
    height: bh,
    scale: bulletScale,
    facing: playerRef.current.facing,
    collisionBox: { left: 0, top: 0, right: 0, bottom: 0 },
    
    update() {
      this.x += this.vx;
      
      const wD = Math.round(this.width * this.scale);
      const hD = Math.round(this.height * this.scale);
      this.collisionBox.left = this.x;
      this.collisionBox.top = this.y;
      this.collisionBox.right = this.x + wD;
      this.collisionBox.bottom = this.y + hD;
    },
    
    draw(ctx) {
      const dw = Math.round(this.width * this.scale);
      const dh = Math.round(this.height * this.scale);
      const dx = Math.round(this.x);
      const dy = Math.round(this.y);
      
      ctx.save();
      if (this.facing === -1) {
        ctx.translate(dx + dw, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(bulletImg, 0, 0, dw, dh);
      } else {
        ctx.drawImage(bulletImg, dx, dy, dw, dh);
      }
      ctx.restore();
    },
    
    isOffScreen() {
      return this.x < -50 || this.x > canvas.width + 50;
    }
  };
  
  return bullet;
}

export function createFireball(fireballImg, boss, playerRef) {
  if (!playerRef.current || !boss) return null;

  const fireballScale = 1.5;
  const fbw = 16;
  const fbh = 16;

  const bossWidth = Math.round(boss.width * boss.scale);
  const bossHeight = Math.round(boss.height * boss.scale);
  const bossCenterX = boss.x + bossWidth / 2;
  const bossCenterY = boss.y + bossHeight / 2;
  
  const playerCenterX = playerRef.current.x + Math.round(playerRef.current.width * playerRef.current.scale) / 2;
  
  const dx = playerCenterX - bossCenterX;
  const dy = 0;
  const distance = Math.abs(dx);
  const speed = 4;

  const fireball = {
    x: bossCenterX,
    y: bossCenterY,
    vx: (dx / distance) * speed,
    vy: 0,
    width: fbw,
    height: fbh,
    scale: fireballScale,
    collisionBox: { left: 0, top: 0, right: 0, bottom: 0 },
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      
      const wD = Math.round(this.width * this.scale);
      const hD = Math.round(this.height * this.scale);
      this.collisionBox.left = this.x;
      this.collisionBox.top = this.y;
      this.collisionBox.right = this.x + wD;
      this.collisionBox.bottom = this.y + hD;
    },
    
    draw(ctx) {
      if (!fireballImg.complete) return;
      const dw = Math.round(this.width * this.scale);
      const dh = Math.round(this.height * this.scale);
      const dx = Math.round(this.x);
      const dy = Math.round(this.y);
      ctx.drawImage(fireballImg, dx, dy, dw, dh);
    },
    
    isOffScreen() {
      return this.x < -50 || this.x > 9999 || this.y < -50 || this.y > 9999;
    }
  };
  
  return fireball;
}

export class AmmoSystem {
  constructor(maxBullets = 10, reloadDuration = 120) {
    this.maxBullets = maxBullets;
    this.currentBullets = maxBullets;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.reloadDuration = reloadDuration;
    this.canShoot = true;
  }

  shoot() {
    if (!this.canShoot || this.currentBullets <= 0 || this.isReloading) return false;
    
    this.currentBullets--;
    this.canShoot = false;
    setTimeout(() => { this.canShoot = true; }, 200);
    return true;
  }

  reload() {
    if (this.isReloading || this.currentBullets === this.maxBullets) return;
    this.isReloading = true;
    this.reloadTimer = this.reloadDuration;
  }

  update() {
    if (this.isReloading) {
      this.reloadTimer--;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        this.currentBullets = this.maxBullets;
      }
    }
  }

  getStatus() {
    return {
      current: this.currentBullets,
      max: this.maxBullets,
      isReloading: this.isReloading,
      reloadProgress: this.isReloading ? Math.floor((1 - this.reloadTimer / this.reloadDuration) * 100) : 0
    };
  }
}
