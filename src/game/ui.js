// ui.js - Sistema de interface do utilizador (HUD, menus, etc)

// Desenhar pontuação
export function drawScore(ctx, score) {
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const scoreText = `Pontuação: ${score}`;
  ctx.strokeText(scoreText, 20, 20);
  ctx.fillText(scoreText, 20, 20);
  ctx.restore();
}

// Desenhar contador de inimigos mortos
export function drawEnemyCounter(ctx, enemiesKilled, bossActive) {
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const enemiesText = `Inimigos mortos: ${enemiesKilled}/10 ${bossActive ? '(BOSS ATIVO)' : ''}`;
  ctx.strokeText(enemiesText, 20, 60);
  ctx.fillText(enemiesText, 20, 60);
  ctx.restore();
}

// Desenhar corações (vidas)
export function drawHearts(ctx, canvas, lives) {
  const heartSize = 30;
  const heartSpacing = 10;
  const heartStartX = canvas.width - (heartSize + heartSpacing) * 3 - 20;
  const heartY = 25;
  
  for (let i = 0; i < 3; i++) {
    const x = heartStartX + i * (heartSize + heartSpacing);
    
    ctx.save();
    if (i < lives) {
      ctx.fillStyle = '#ff0000';
      ctx.strokeStyle = '#8b0000';
    } else {
      ctx.fillStyle = '#333333';
      ctx.strokeStyle = '#000000';
    }
    
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    const topCurveHeight = heartSize * 0.3;
    ctx.moveTo(x + heartSize / 2, heartY + topCurveHeight);
    ctx.bezierCurveTo(
      x + heartSize / 2, heartY,
      x, heartY,
      x, heartY + topCurveHeight
    );
    ctx.bezierCurveTo(
      x, heartY + heartSize * 0.5,
      x + heartSize / 2, heartY + heartSize * 0.8,
      x + heartSize / 2, heartY + heartSize
    );
    ctx.bezierCurveTo(
      x + heartSize / 2, heartY + heartSize * 0.8,
      x + heartSize, heartY + heartSize * 0.5,
      x + heartSize, heartY + topCurveHeight
    );
    ctx.bezierCurveTo(
      x + heartSize, heartY,
      x + heartSize / 2, heartY,
      x + heartSize / 2, heartY + topCurveHeight
    );
    
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// Desenhar barra de munição
export function drawAmmoBar(ctx, canvas, ammoStatus) {
  const { current, max, isReloading, reloadProgress } = ammoStatus;
  
  ctx.save();
  const ammoBarX = 20;
  const ammoBarY = canvas.height - 60;
  const ammoBarWidth = 300;
  const ammoBarHeight = 40;
  const ammoPadding = 5;
  
  // Fundo
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(ammoBarX, ammoBarY, ammoBarWidth, ammoBarHeight);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(ammoBarX, ammoBarY, ammoBarWidth, ammoBarHeight);
  
  // Desenhar balas individuais
  const bulletSlotWidth = (ammoBarWidth - ammoPadding * 2) / max;
  const bulletSlotHeight = ammoBarHeight - ammoPadding * 2;
  const bulletSlotSpacing = 2;
  
  for (let i = 0; i < max; i++) {
    const slotX = ammoBarX + ammoPadding + i * bulletSlotWidth;
    const slotY = ammoBarY + ammoPadding;
    const slotW = bulletSlotWidth - bulletSlotSpacing;
    
    if (i < current) {
      ctx.fillStyle = '#ffd700';
    } else {
      ctx.fillStyle = '#333333';
    }
    
    ctx.fillRect(slotX, slotY, slotW, bulletSlotHeight);
    
    if (i < current) {
      ctx.strokeStyle = '#ff8c00';
      ctx.lineWidth = 1;
      ctx.strokeRect(slotX, slotY, slotW, bulletSlotHeight);
    }
  }
  
  // Texto
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (isReloading) {
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`RECARREGANDO... ${reloadProgress}%`, ammoBarX + ammoBarWidth / 2, ammoBarY - 15);
  } else if (current === 0) {
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('PRESSIONE C PARA RECARREGAR', ammoBarX + ammoBarWidth / 2, ammoBarY - 15);
  } else {
    ctx.fillText(`MUNIÇÃO: ${current}/${max}`, ammoBarX + ammoBarWidth / 2, ammoBarY - 10);
  }
  
  ctx.restore();
}

// Desenhar guia da plataforma (debug)
export function drawPlatformGuide(ctx, canvas, platformHeight, platformOffset) {
  const platformY = Math.round(canvas.height - platformHeight - platformOffset);
  ctx.fillStyle = 'rgba(255,0,0,0.15)';
  ctx.fillRect(0, platformY, canvas.width, 4);
  ctx.strokeStyle = 'rgba(255,0,0,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, platformY + 2);
  ctx.lineTo(canvas.width, platformY + 2);
  ctx.stroke();
}

// Desenhar hitboxes (debug)
export function drawHitboxes(ctx, entities) {
  entities.forEach(entity => {
    if (!entity || !entity.collisionBox) return;
    
    const cb = entity.collisionBox;
    const color = entity.type === 'player' ? 'rgba(255,0,0,0.9)' 
                : entity.type === 'boss' ? 'rgba(255,0,255,0.9)'
                : 'rgba(0,255,0,0.9)';
    
    ctx.strokeStyle = entity.isColliding ? 'rgba(255,165,0,0.95)' : color;
    ctx.lineWidth = entity.type === 'boss' ? 3 : 2;
    ctx.strokeRect(cb.left, cb.top, cb.right - cb.left, cb.bottom - cb.top);
  });
}
