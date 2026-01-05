// utils.js - Funções de utilidade e colisão

// Sistema de vidas e invencibilidade
export class HealthSystem {
  constructor(initialLives = 3, invulnerabilityDuration = 120) {
    this.lives = initialLives;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.invulnerabilityDuration = invulnerabilityDuration;
  }

  takeDamage() {
    if (this.isInvulnerable) return false;
    
    if (this.lives > 1) {
      this.lives--;
      this.isInvulnerable = true;
      this.invulnerabilityTimer = this.invulnerabilityDuration;
      return false; // não é game over
    } else {
      this.lives = 0;
      return true; // game over
    }
  }

  update() {
    if (this.isInvulnerable) {
      this.invulnerabilityTimer--;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
      }
    }
  }

  reset(initialLives = 3) {
    this.lives = initialLives;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
  }

  shouldFlicker() {
    return this.isInvulnerable && Math.floor(this.invulnerabilityTimer / 10) % 2 === 0;
  }
}

// Verificação de colisão (axis-aligned bounding box)
export function rectsOverlap(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

// Sistema de spawn de inimigos
export function getEnemySpawnPosition(playerRef, canvas) {
  if (!playerRef.current) return canvas.width / 2;
  
  const minDistance = 400;
  const playerX = playerRef.current.x;
  const playerCenterX = playerX + Math.round(playerRef.current.width * playerRef.current.scale) / 2;
  
  let spawnX;
  if (playerCenterX < canvas.width / 3) {
    // player à esquerda, spawnar à direita
    spawnX = canvas.width * 0.7 + Math.random() * (canvas.width * 0.25);
  } else if (playerCenterX > canvas.width * 2 / 3) {
    // player à direita, spawnar à esquerda
    spawnX = Math.random() * (canvas.width * 0.25);
  } else {
    // player no meio, escolher aleatoriamente
    if (Math.random() > 0.5) {
      spawnX = Math.random() * (canvas.width * 0.2);
    } else {
      spawnX = canvas.width * 0.8 + Math.random() * (canvas.width * 0.2);
    }
  }
  
  return spawnX;
}

// Posicionar entidade na plataforma
export function positionOnPlatform(entity, canvas, platformHeight, platformOffset) {
  entity.maxY = Math.round(canvas.height - platformHeight - Math.round(entity.height * entity.scale) - platformOffset);
  entity.y = entity.maxY;
  if (entity.y < entity.minY) entity.y = entity.minY;
}
