import React, { useRef, useEffect, useState } from 'react';
import { createPlayer, createEnemy, createBoss } from './game/entities';
import { createBullet, createFireball, AmmoSystem } from './game/projectiles';
import { HealthSystem, rectsOverlap, getEnemySpawnPosition, positionOnPlatform } from './game/utils';
import { drawScore, drawEnemyCounter, drawHearts, drawAmmoBar, drawPlatformGuide, drawHitboxes } from './game/ui';

// Minimal static player implementation: draws a single image and handles simple controls
export default function PlayerCanvas({
  frames = undefined,
  frameRate = 8,
  scale = 2,
  bottomOffset = 12,
  showHitbox = false,
  showPlatform = false,
  initialX = 50,
  platformHeight = 48,
  platformOffset = 0,
  footOffset = 36,
  staticSprite = undefined // path to a single image to use as a non-animated sprite (e.g. '/assets/ps.png')
}) {
  const canvasRef = useRef(null);
  const playerRef = useRef(null);
  const keysRef = useRef({});
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const setScoreRef = useRef(null);
  const scoreDisplayRef = useRef(0);
  const livesRef = useRef(3);

  setScoreRef.current = setScore;
  scoreDisplayRef.current = score;
  livesRef.current = lives;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Música de fundo
    const backgroundMusic = new Audio(process.env.PUBLIC_URL + '/assets/music.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.15; // volume baixinho (15%)

    // Carregar imagens
    const img = new Image();
    img.src = staticSprite || process.env.PUBLIC_URL + '/assets/ps.png';

    const enemyImg = new Image();
    enemyImg.src = process.env.PUBLIC_URL + '/assets/ef.png';

    const bossImg = new Image();
    bossImg.src = process.env.PUBLIC_URL + '/assets/ks.png';

    const bulletImg = new Image();
    bulletImg.src = process.env.PUBLIC_URL + '/assets/bullet.png';

    const fireballImg = new Image();
    fireballImg.src = process.env.PUBLIC_URL + '/assets/bullete.png';

    // Criar player usando a função modular
    const p = createPlayer(img, initialX, scale, footOffset);
    playerRef.current = p;

    // Arrays de entidades
    const enemies = [];
    const bullets = [];
    const fireballs = [];

    // Sistemas de jogo
    let boss = null;
    let bossActive = false;
    let enemiesKilled = 0;

    const healthSystem = new HealthSystem(3, 120);
    const ammoSystem = new AmmoSystem(10, 120);

    function takeDamage() {
      const isGameOver = healthSystem.takeDamage();
      setLives(healthSystem.lives);
      if (isGameOver) {
        setGameOver(true);
      }
    }

    function shootBullet() {
      if (!ammoSystem.shoot()) return;
      
      const bullet = createBullet(bulletImg, playerRef, canvas);
      if (bullet) bullets.push(bullet);
    }

    function reload() {
      ammoSystem.reload();
    }

    function spawnBoss() {
      boss = createBoss(bossImg, playerRef, canvas);
      if (boss) {
        bossActive = true;
        console.log('=== BOSS CRIADO ===');
      }
    }

    function spawnEnemy(x) {
      const e = createEnemy(enemyImg, x, canvas, scale, platformHeight, platformOffset);
      enemies.push(e);
      return e;
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (playerRef.current) {
        playerRef.current.setBounds(canvas.width, canvas.height, platformHeight, platformOffset);
        playerRef.current.x = Math.round(initialX);
        playerRef.current.y = Math.round(playerRef.current.maxY - footOffset);
        if (playerRef.current.y < playerRef.current.minY) playerRef.current.y = playerRef.current.minY;
      }
    }

    img.onload = () => {
      p.width = img.width;
      p.height = img.height;
      resize();
      p.y = Math.round(p.maxY - footOffset);
      if (p.y < p.minY) p.y = p.minY;
    };

    enemyImg.onload = () => {
      spawnEnemy(canvas.width - Math.round(enemyImg.width * scale) - 48);
      spawnEnemy(Math.round(canvas.width / 2));

      enemies.forEach(e => {
        positionOnPlatform(e, canvas, platformHeight, platformOffset);
      });
    };

    resize();
    window.addEventListener('resize', resize);

    // Iniciar música quando o jogo começar
    let musicStarted = false;
    const startMusic = () => {
      if (!musicStarted && gameStarted) {
        backgroundMusic.play().catch(e => console.log('Erro ao tocar música:', e));
        musicStarted = true;
      }
    };

    // keyboard handlers (simple mapping to p)
    function onKey(e, down) {
      // prevent arrow keys from scrolling page
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();

      if (e.code === 'ArrowUp' && down) {
        if (p.onGround) { p.vy = -18; p.onGround = false; }  // salto mais alto
      } else if (e.code === 'ArrowLeft') {
        p.isMovingLeft = down;
      } else if (e.code === 'ArrowRight') {
        p.isMovingRight = down;
      } else if (e.code === 'Space' && down) {
        shootBullet();
      } else if (e.code === 'KeyC' && down) {
        reload();
      }

      keysRef.current[e.code] = down;
    }

    const onKeyDown = (e) => onKey(e, true);
    const onKeyUp = (e) => onKey(e, false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let running = true;

    function loop() {
      if (!running) return;
      
      if (!gameStarted || gameOver) {
        requestAnimationFrame(loop);
        return;
      }

      // Iniciar música quando o jogo começar
      startMusic();

      // Updates
      if (playerRef.current) playerRef.current.update();
      healthSystem.update();
      ammoSystem.update();
      
      if (bossActive && boss) {
        if (boss.shootTimer >= boss.shootInterval) {
          boss.shootTimer = 0;
          const fireball = createFireball(fireballImg, boss, playerRef);
          if (fireball) fireballs.push(fireball);
        }
      }

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Desenhar UI
      drawScore(ctx, scoreDisplayRef.current);
      drawEnemyCounter(ctx, enemiesKilled, bossActive);
      drawHearts(ctx, canvas, livesRef.current);
      drawAmmoBar(ctx, canvas, ammoSystem.getStatus());
      
      if (showPlatform) {
        drawPlatformGuide(ctx, canvas, platformHeight, platformOffset);
      }

      // Desenhar player com efeito de piscar
      if (playerRef.current) {
        if (!healthSystem.shouldFlicker()) {
          playerRef.current.draw(ctx);
        }
      }

      // Bullets
      bullets.forEach(b => { b.update(); b.draw(ctx); });
      for (let i = bullets.length - 1; i >= 0; i--) {
        if (bullets[i].isOffScreen()) bullets.splice(i, 1);
      }

      // Boss
      if (boss && bossActive) {
        boss.update();
        boss.draw(ctx);
        
        if (playerRef.current) {
          const pbox = playerRef.current.collisionBox;
          boss.isColliding = rectsOverlap(pbox, boss.collisionBox);
          if (boss.isColliding && !healthSystem.isInvulnerable) {
            takeDamage();
          }
        }
      }
      
      // Fireballs
      fireballs.forEach(fb => { fb.update(); fb.draw(ctx); });
      
      if (playerRef.current) {
        const pbox = playerRef.current.collisionBox;
        fireballs.forEach(fb => {
          if (rectsOverlap(pbox, fb.collisionBox) && !healthSystem.isInvulnerable) {
            takeDamage();
          }
        });
      }
      
      for (let i = fireballs.length - 1; i >= 0; i--) {
        if (fireballs[i].isOffScreen()) fireballs.splice(i, 1);
      }

      // Colisão bullets com boss
      if (boss && bossActive && bullets.length > 0) {
        for (let i = bullets.length - 1; i >= 0; i--) {
          const bullet = bullets[i];
          if (!bullet) continue;
          
          if (rectsOverlap(bullet.collisionBox, boss.collisionBox)) {
            bullets.splice(i, 1);
            boss.health--;
            
            if (boss.health <= 0) {
              if (setScoreRef.current) {
                setScoreRef.current(prev => prev + 100);
              }
              
              boss = null;
              bossActive = false;
              enemiesKilled = 0;
              fireballs.length = 0;
              
              spawnEnemy(canvas.width - Math.round(enemyImg.width * scale) - 48);
              spawnEnemy(Math.round(canvas.width / 2));
              enemies.forEach(e => {
                positionOnPlatform(e, canvas, platformHeight, platformOffset);
              });
            }
            break;
          }
        }
      }

      // Enemies (apenas se boss não ativo)
      if (!bossActive && enemies.length > 0) {
        enemies.forEach(e => { e.update(playerRef); e.draw(ctx); });

        if (playerRef.current) {
          const pbox = playerRef.current.collisionBox;
          enemies.forEach(e => {
            e.isColliding = rectsOverlap(pbox, e.collisionBox);
            if (e.isColliding && !healthSystem.isInvulnerable) {
              takeDamage();
            }
          });
        }
        
        // Colisão bullets com enemies
        if (bullets.length > 0) {
          for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            for (let j = enemies.length - 1; j >= 0; j--) {
              const enemy = enemies[j];
              if (rectsOverlap(bullet.collisionBox, enemy.collisionBox)) {
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                
                if (setScoreRef.current) {
                  setScoreRef.current(prev => prev + 10);
                }
                
                enemiesKilled++;
                
                if (enemiesKilled >= 10 && !bossActive) {
                  enemies.length = 0;
                  spawnBoss();
                } else if (!bossActive) {
                  const spawnX = getEnemySpawnPosition(playerRef, canvas);
                  const newEnemy = spawnEnemy(spawnX);
                  positionOnPlatform(newEnemy, canvas, platformHeight, platformOffset);
                }
                
                break;
              }
            }
          }
        }
      }

      // Hitboxes (debug)
      if (showHitbox) {
        const entities = [];
        if (playerRef.current) entities.push({ ...playerRef.current, type: 'player' });
        if (boss && bossActive) entities.push({ ...boss, type: 'boss' });
        enemies.forEach(e => entities.push({ ...e, type: 'enemy' }));
        drawHitboxes(ctx, entities);
      }

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    return () => {
      running = false;
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [frames, frameRate, scale, bottomOffset, showHitbox, showPlatform, platformHeight, platformOffset, initialX, footOffset, staticSprite, gameOver, gameStarted]);

    const handleRestart = () => {
      setGameOver(false);
      setScore(0);
      setLives(3);
      setGameStarted(false);
      window.location.reload();
    };

  return (
    <>
      {!gameStarted && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          pointerEvents: 'auto'
        }}>
          <button
            onClick={() => setGameStarted(true)}
            style={{
              padding: '2rem 4rem',
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: '#ff4444',
              border: '4px solid #ffffff',
              borderRadius: '15px',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(255, 68, 68, 0.6)',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '3px'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#ff6666';
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 12px 40px rgba(255, 68, 68, 0.8)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#ff4444';
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 8px 30px rgba(255, 68, 68, 0.6)';
            }}
          >
            START GAME
          </button>
        </div>
      )}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }} />
      {gameOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          pointerEvents: 'auto'
        }}>
          <h1 style={{
            color: '#ff4444',
            fontSize: '4rem',
            marginBottom: '2rem',
            textShadow: '0 0 20px rgba(255, 68, 68, 0.5)'
          }}>GAME OVER</h1>
          <button
            onClick={handleRestart}
            style={{
              padding: '1.5rem 3rem',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: '#ff4444',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 68, 68, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#ff6666';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#ff4444';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Jogar de Novo
          </button>
        </div>
      )}
    </>
  );
}
