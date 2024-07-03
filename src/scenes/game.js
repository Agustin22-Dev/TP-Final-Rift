// import Player from './player.js';
// import UI from './UI.js';
// import Map from './map.js';
export default class game extends Phaser.Scene {
  constructor() {
      super('game');
      //todos los arrays y indices necesarios para las funciones
      this.playerState = 'idle';
      this.lastDirection = 'right'; 
      this.maxHealth = 6; // Vida máxima del jugador
      this.currentHealth = this.maxHealth; // Vida actual del jugador
      this.hearts = []; // Array para almacenar los corazones
      this.enemies = []; // Array para almacenar los enemigos
      this.spawnPoints = []; // Array para almacenar los puntos de aparición en la calle
      this.enemyAttackDelay = 2000; // Retardo del ataque enemigo en milisegundos
      this.score = 0;
      this.enemyIndex = 0; // Índice para controlar el orden de aparición de los enemigos
      this.isWaveActive = false; // Variable para controlar si hay una oleada activa
      this.isCameraFixed = false; // Variable para controlar si la cámara está fija
      this.spawningEnemies = false; // Nueva bandera para controlar el retraso en la generación de enemigos
      this.isPlayerInvulnerable = false; // Variable para controlar la invulnerabilidad del jugador
      this.coinsCollected = 0; // Contador de monedas recolectadas
  }

  preload() {
     //los recursos ya estan cargados en otra pagina
  }



  checkForEnemies() {
    this.enemies = this.enemies.filter(enemy => enemy.active); // Eliminar enemigos desactivados del array
    if (this.enemies.length === 0 && !this.spawningEnemies) {
        this.spawningEnemies = true; // Activar la bandera para evitar nuevas oleadas durante el retraso
        this.time.delayedCall(3000, () => {
            this.spawnEnemyWave(); // Generar una nueva oleada si no hay enemigos en pantalla
            this.spawningEnemies = false; // Reiniciar la bandera después de generar los enemigos
        });
    }
}
  create() {
      // Creación de elementos al inicio del juego
      //reinicio de las variables cada vez que se juega de nuevo
      this.currentHealth = this.maxHealth; // Reiniciar la vida del jugador
      this.enemies = [];
      this.score = 0;
      this.isWaveActive = false;
      this.isCameraFixed = false;
      // Crear el mapa y sus capas
      const map = this.make.tilemap({ key: 'tilemap' });
      const tileset = map.addTilesetImage('Escenario (proceso)', 'calles');
      map.createLayer('calle', tileset).setScale(1);
      const edificios = map.createLayer('edificios', tileset).setScale(1);
      // Configurar colisiones con los edificios
      edificios.setCollisionByProperty({ collides: true });
      // Debug de colisiones (opcional)
    //   const debugGraphics = this.add.graphics().setAlpha(0.7);
    //   edificios.renderDebug(debugGraphics, {
    //       tileColor: null,
    //       collidingTileColor: new Phaser.Display.Color(243, 234, 48, 255),
    //       faceColor: new Phaser.Display.Color(40, 39, 37, 255)
    //   });
    //proyectiles de los enemigos
    this.projectiles = this.physics.add.group({
        defaultKey:'proyectil', // Nombre de la clave de la imagen del proyectil
        maxSize: 10
    });
      //puntos de spawn
      this.spawnPoints = [
        { x: 900, y: 600 }
    ];
 // Crear barra de vida
      this.createHealthBar();
      //crear score
      this.scoreText = this.add.text(
        this.cameras.main.width - 20, 
        20, 
        'Score: 0', 
        { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' }
       ).setOrigin(1, 0).setScrollFactor(0);
    //contador de monedas
    this.coinsCollected = 0;
    this.coinText = this.add.text(
    this.cameras.main.width - 20,
    60,
    'Coins: 0',
    { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' }
    ).setOrigin(1, 0).setScrollFactor(0);
      // Contenedor para la barra de vida
      this.uiContainer = this.add.container();
      this.uiContainer.setScrollFactor(0); // Mantiene el contenedor fijo en la pantalla
      // Crear jugador y configuración física
      this.player = this.physics.add.sprite(500, 600, 'attack').setScale(1.9);
      this.player.body.setSize(50, 60);
      this.player.setCollideWorldBounds(true);
      // Teclas de control
      this.cursors = this.input.keyboard.createCursorKeys();
      this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
     // colisión entre el jugador y el enemigo
        this.physics.add.collider(this.player, this.enemigo);
    // Detección de colisión entre hitbox de ataque y enemigo
         this.physics.add.overlap(this.player, this.enemigo, this.handlePlayerEnemyCollision, null, this);
        //colision jugador y proyectil
        this.physics.add.overlap(this.player, this.projectiles, this.handleProjectileCollision, null, this);
     // movimiento del enemigo hacia el jugador
        this.time.addEvent({
         delay: 2000, // Cada 2 segundos (ajustar según necesidad)
      callback: this.moveEnemyTowardsPlayer,
         callbackScope: this,
        loop: true
     });
      // Animaciones del jugador
      this.anims.create({
          key: 'idle',
          frames: this.anims.generateFrameNames('idle', { start: 0, end: 4 }),
          frameRate: 5,
          repeat: -1
      });
      this.anims.create({
          key: 'right',
          frames: this.anims.generateFrameNames('RunX', { start: 1, end: 14 }),
          frameRate: 10
      });
      this.anims.create({
          key: 'left',
          frames: this.anims.generateFrameNames('runl', { start: 0, end: 13 }),
          frameRate: 10
      });
      this.anims.create({
          key: 'attackX',
          frames: this.anims.generateFrameNames('attack', { start: 7, end: 13 }),
          frameRate: 12,
          repeat: 0
      });
      this.anims.create({
          key: 'attackY',
          frames: this.anims.generateFrameNames('attack', { start: 0, end: 6 }),
          frameRate: 12,
          repeat: 0
      });
      this.anims.create({
        key: 'coin-spin',
        frames: this.anims.generateFrameNames('coin', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1
    });
      // Configurar cámara
      this.myCam = this.cameras.main;
      this.myCam.startFollow(this.player);
      this.myCam.setBounds(0, 0, map.widthInPixels, 700, true);
      this.physics.world.setBounds(0, 0, map.widthInPixels, 700);
  }
  moveEnemiesTowardsPlayer() {
    const speed = 50; // Velocidad de movimiento del enemigo (ajustar según necesidad)
    this.enemies.forEach(enemy => {
        if (enemy.active) {
            // Calcular la dirección hacia el jugador
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            if (distance > 120) {
                // Mover al enemigo hacia el jugador si está lejos
                const angle = Math.atan2(dy, dx);
                enemy.setVelocityX(Math.cos(angle) * speed);
                enemy.setVelocityY(Math.sin(angle) * speed);
            } else {
                // Detener al enemigo y preparar el ataque si está cerca
                enemy.setVelocity(0);
                this.startEnemyAttack(enemy);
            }
        }
    });
}
startEnemyAttack(enemy) {
    if (enemy.active && !enemy.isAttacking) {
        enemy.isAttacking = true;
        // Aquí puedes implementar el tipo de ataque que desees, como crear una hitbox de ataque y reducir la salud del jugador
        const attackHitbox = this.add.rectangle(enemy.x, enemy.y, 250, 100);
        this.physics.world.enable(attackHitbox);
        
        this.physics.add.overlap(attackHitbox, this.player, () => {
            if (enemy.active && enemy.isAttacking) {
                this.reducePlayerHealth(1); // Reducir la vida del jugador al ser atacado por el enemigo
            }
            attackHitbox.destroy();
        });
        this.time.delayedCall(500, () => {
            attackHitbox.destroy();
            enemy.isAttacking = false;
        });
    }
}
//Apartado de enemigos
getSpawnPointsOnXAxis() {
    const distance = 300; // Distancia desde el jugador a los puntos de spawn
    const playerX = this.player.x;
    const playerY = this.player.y;

    return [
        { x: playerX + distance, y: playerY }, // Derecha
        { x: playerX - distance, y: playerY }  // Izquierda
    ];
}
spawnEnemyWave() {
    const positionLeft = { x: this.player.x - 300, y: this.player.y }; // Posición a la izquierda del jugador
    const positionRight = { x: this.player.x + 300, y: this.player.y }; // Posición a la derecha del jugador
    // Incrementar el contador de oleadas normales
    this.enemyWaveCount++;
    // Decidir si la siguiente oleada debe ser especial
    if (this.enemyWaveCount >= 3) {
        this.specialWaveActive = true;
        this.enemyWaveCount = 0; // Reiniciar el contador de oleadas normales
    } else {
        this.specialWaveActive = false;
    }
    // Crear enemigos normales a la derecha y la izquierda
    const enemyLeft = this.physics.add.sprite(positionLeft.x, positionLeft.y, 'enemigoizq').setScale(1).setSize(50, 45);
    const enemyRight = this.physics.add.sprite(positionRight.x, positionRight.y, 'enemigo').setScale(1).setSize(120, 150);
    // Establecer vida y otras propiedades de los enemigos normales
    enemyLeft.health = 3;
    enemyRight.health = 3;
    // Agregar enemigos normales al array
    this.enemies.push(enemyRight);
    // Añadir colisión entre jugador y enemigo derecho
    this.physics.add.collider(this.player, enemyRight, this.handlePlayerEnemyCollision, null, this);
    // Decidir si aparece el enemigo especial izquierdo
    if (this.specialWaveActive && Phaser.Math.RND.frac() < 1) { // 50% de probabilidad para enemigo especial
        const specialEnemyLeft = this.physics.add.sprite(positionLeft.x, positionLeft.y, 'enemigoY').setScale(3).setSize(60, 50);
        specialEnemyLeft.health = 6; // Establecer más vida al enemigo especial izquierdo
        this.enemies.push(specialEnemyLeft); // Agregar enemigo especial izquierdo al array
        // Añadir colisión entre jugador y enemigo especial izquierdo
        this.physics.add.collider(this.player, specialEnemyLeft, this.handleSpecialEnemyCollision, null, this);
    } else {
        // Si no aparece el enemigo especial, crear enemigo normal izquierdo
        this.enemies.push(enemyLeft); // Agregar enemigo normal izquierdo al array
        // Añadir colisión entre jugador y enemigo izquierdo
        this.physics.add.collider(this.player, enemyLeft, this.handlePlayerEnemyCollision, null, this);
    }
}


handlePlayerAttackCollision(enemy, attack) {
    enemy.health -= 1; // Reducir la salud del enemigo en 1
    if (enemy.health <= 0) {
        enemy.destroy();
        this.enemies = this.enemies.filter(e => e !== enemy); // Remover el enemigo de la lista
    }
    attack.destroy(); // Destruir el ataque después de la colisión
}

//ataque del enemigo
handleEnemyAttack(enemy) {
    if (enemy.active && enemy.isAttacking) {
        const attackHitbox = this.add.rectangle(enemy.x, enemy.y, 200, 100);
        this.physics.world.enable(attackHitbox);
        this.physics.add.overlap(attackHitbox, this.player, () => {
            if (enemy.active && enemy.isAttacking) {
                this.reducePlayerHealth(1); // Reducir la vida del jugador al ser atacado por el enemigo
            }
            attackHitbox.destroy();
        });
        this.time.delayedCall(500, () => {
            attackHitbox.destroy();
        });
    }
}
//vida del enemigo (muerte)
reduceEnemyHealth(enemy, amount) {
    enemy.health -= amount;

    if (enemy.health <= 0) {
        // Guarda la posición del enemigo antes de destruirlo
        const posX = enemy.x;
        const posY = enemy.y;
        enemy.destroy();
        // Generar una moneda con cierta probabilidad
        if (Phaser.Math.RND.frac() < 0.2) { // 20%
            this.spawnCoin(posX, posY);
        }
        // Generar un corazón con cierta probabilidad
        if (Phaser.Math.RND.frac() < 0.2) { // 20% 
            this.spawnHeart(posX, posY);
        }
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
    }
}

//recolectable de vida
spawnHeart(x, y) {
    const heart = this.physics.add.sprite(x, y, 'life').setScale(1);
    this.physics.add.overlap(this.player, heart, () => {
        if (this.currentHealth < this.maxHealth) {
            this.currentHealth++; // Aumentar la salud del jugador si no está al máximo
            this.updateHealthBar();
        }
        heart.destroy(); // Eliminar el corazón después de ser recogido
    });
    
}
spawnCoin(x, y) {
    const coin = this.physics.add.sprite(x,y,'coin').setScale(1);
    coin.anims.play('coin-spin'); // Animación de la moneda
    this.physics.add.overlap(this.player, coin, () => {
        this.score += 20; // Sumar puntos al recolectar una moneda
        this.scoreText.setText(`Score: ${this.score}`);
        this.coinsCollected++; // Contar las monedas recolectadas
        coin.destroy(); // Eliminar la moneda después de ser recolectada
        this.updateCoinCount();
    });
}
updateCoinCount() {
    this.coinText.setText(`Coins: ${this.coinsCollected}`);
}
  update() {
    this.enemies.forEach(enemy => {
        if (enemy && enemy.body) {
            this.physics.moveToObject(enemy, this.player, 100); // Velocidad de seguimiento de 100
        }
    });
      // Verificar si el jugador está atacando
      if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
          if (this.playerState !== 'attack' && this.playerState !== 'move') {
              this.playerState = 'attack';
              this.handleAttackState();
          }
      }
      // Actualizar el estado del jugador según el estado actual
      switch (this.playerState) {
          case 'idle':
              this.handleIdleState();
              break;
          case 'move':
              this.handleMoveState();
              break;
          case 'attack':
              // No hace falta actualizar aquí mientras se maneje en el JustDown de arriba
              break;
      }  
      this.checkForEnemies(); // Verificar si hay enemigos en pantalla
      this.moveEnemiesTowardsPlayer(); // Mover enemigos hacia el jugador
      if (this.isCameraFixed) {
        this.cameras.main.startFollow(this.player);
    }
    // Verificar si hay enemigos activos en la oleada
    if (this.isWaveActive) {
        const activeEnemies = this.enemies.filter(enemy => enemy.active);
        if (activeEnemies.length === 0) {
            // Si no hay enemigos activos, comenzar una nueva oleada después de un breve retardo
            this.time.delayedCall(2000, () => {
                this.isWaveActive = false;
                this.isCameraFixed = false; // Permitir que la cámara siga al jugador de nuevo
                this.cameras.main.startFollow(this.player);
                this.startEnemyWave();
            });
        }
    }
    if (this.currentHealth <= 0) {
        this.scene.start('gameOver'); // Cambiar a la escena de Game Over
    }
  }
 //estado idle
  handleIdleState() {
      if (this.isPlayerMoving()) {
          this.playerState = 'move';
          this.handleMoveState();
      } else {
          this.player.setVelocity(0);
          this.player.anims.play('idle', true);
      }
  }
//verificador del movimiento
  isPlayerMoving() {
      return (
          this.cursors.left.isDown ||
          this.cursors.right.isDown ||
          this.cursors.up.isDown ||
          this.cursors.down.isDown
      );
  }
//estado de movimiento
  handleMoveState() {
      if (this.cursors.left.isDown) {
          this.player.setVelocityX(-160);
          this.player.anims.play('left', true);
          this.lastDirection = 'left';
      } else if (this.cursors.right.isDown) {
          this.player.setVelocityX(160);
          this.player.anims.play('right', true);
          this.lastDirection = 'right';
      } else {
          this.player.setVelocityX(0);
          this.player.anims.play('idle', true);
      }
      if (this.cursors.up.isDown) {
          this.player.setVelocityY(-160);
          if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
              this.player.anims.play('up', true);
              this.lastDirection = 'up';
          }
      } else if (this.cursors.down.isDown) {
          this.player.setVelocityY(160);
          if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
              this.player.anims.play('down', true);
              this.lastDirection = 'down';
          }
      } else {
          if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
              this.player.setVelocityY(0);
          }
      }
      if (!this.isPlayerMoving()) {
          this.playerState = 'idle';
      }
  }
//estado de ataque
  handleAttackState() {
    this.player.setVelocity(0);
    // Tamaño y desplazamiento de la hitbox de ataque
    const attackHitboxWidth = 160;
    const attackHitboxHeight = 100;
    const offsetX = this.lastDirection === 'right' ? 90 : -50; // Ajuste de posición según la dirección
    // Crear y posicionar la hitbox para el ataque
    const attackHitbox = this.add.rectangle(this.player.x + offsetX, this.player.y, attackHitboxWidth, attackHitboxHeight);
    this.physics.world.enable(attackHitbox);
    this.enemies.forEach(enemy => {
        this.physics.add.overlap(attackHitbox, enemy, () => {
            // Lógica para dañar al enemigo aquí
            this.reduceEnemyHealth(enemy, 2); // Reducir la vida del enemigo al colisionar con la hitbox de ataque
            attackHitbox.destroy(); // Eliminar hitbox después de la colisión
        });
    });
    if (this.lastDirection === 'right') {
        this.player.anims.play('attackX', true).on('animationcomplete', () => {
            attackHitbox.destroy(); // Eliminar hitbox al finalizar el ataque
            this.playerState = 'idle';
        });
    } else if (this.lastDirection === 'left') {
        this.player.anims.play('attackY', true).on('animationcomplete', () => {
            attackHitbox.destroy(); // Eliminar hitbox al finalizar el ataque
            this.playerState = 'idle';
        });
    } else {
        attackHitbox.destroy(); // Eliminar hitbox si no se especifica dirección
        this.playerState = 'idle';
    }
    // Activar la hitbox solo durante el ataque
    this.time.delayedCall(200, () => {
        attackHitbox.destroy(); // Eliminar hitbox después de 200ms (ajustar según necesidad)
    });
}
//crear barra de vida
  createHealthBar() {
      const numHearts = Math.ceil(this.maxHealth / 2); // Número de corazones necesarios
      this.hearts = [];
      for (let i = 0; i < numHearts; i++) {
          const heart = this.add.sprite(10 + i * 32, 10, 'heart', 0).setScale(5).setOrigin(0);
          heart.setScrollFactor(0); // Mantiene los corazones fijos en la pantalla
          this.hearts.push(heart);
      }
      this.updateHealthBar(); // Actualizar la barra de vida al crearla
  }
//update de la barra de vida en vivo
  updateHealthBar() {
    const fullHearts = Math.floor(this.currentHealth / 2);
    const halfHeart = this.currentHealth % 2;

    for (let i = 0; i < this.hearts.length; i++) {
        if (i < fullHearts) {
            this.hearts[i].setFrame(0); // Corazón lleno
        } else if (i === fullHearts && halfHeart === 1) {
            this.hearts[i].setFrame(2); // Medio corazón
        } else {
            this.hearts[i].setFrame(4); // Corazón vacío
        }
    }

    this.hearts.forEach((heart, index) => {
        heart.setVisible(index < this.currentHealth);
    });
}
//verificador de enemigos en pantalla
//reducir vida del jugador
reducePlayerHealth(amount) {
    if (!this.isPlayerInvulnerable) {
        // Tintar al jugador de rojo temporalmente al recibir daño
        this.player.setTint(0xff0000); // Tinte rojo
        // Después de un segundo, quitar el tinte rojo y reducir la salud del jugador
        this.time.delayedCall(500, () => {
            this.player.clearTint(); // Quitar el tinte rojo
        });
        // Reducir la salud del jugador
        this.currentHealth = Math.max(this.currentHealth - amount, 0);
        this.updateHealthBar();
        if (this.currentHealth <= 0) {
            this.handlePlayerDeath();
        } else {
            // Activar invulnerabilidad temporal
            this.isPlayerInvulnerable = true;
            this.time.delayedCall(2000, () => {
                this.isPlayerInvulnerable = false;
            });
        }
    }
}

//variable de gameover
handlePlayerDeath() {
    this.scene.start('gameOver', { score: this.score, coinsCollected: this.coinsCollected });
}
}