// import Player from './player.js';
// import UI from './UI.js';
// import Map from './map.js';

export default class Game extends Phaser.Scene {
  constructor() {
      super('game');
      this.playerState = 'idle';
      this.lastDirection = 'right'; 
      this.maxHealth = 6; // Vida máxima del jugador
      this.currentHealth = this.maxHealth; // Vida actual del jugador
      this.hearts = []; // Array para almacenar los corazones
      this.enemies = []; // Array para almacenar los enemigos
      this.spawnPoints = []; // Array para almacenar los puntos de aparición en la calle
      this.enemyAttackDelay = 1000; // Retardo del ataque enemigo en milisegundos
      this.score = 0;

  }

  preload() {
      // Cargar recursos si es necesario
  }

  checkForEnemies() {
    this.enemies = this.enemies.filter(enemy => enemy.active); // Eliminar enemigos desactivados del array
    if (this.enemies.length === 0) {
        this.spawnEnemyWave(); // Generar una nueva oleada si no hay enemigos en pantalla
 
    }
}
  create() {
      // Creación de elementos al inicio del juego
      // Crear el mapa y sus capas
      const map = this.make.tilemap({ key: 'tilemap' });
      const tileset = map.addTilesetImage('Escenario (proceso)', 'calles');
      map.createLayer('calle', tileset).setScale(1);
      const edificios = map.createLayer('edificios', tileset).setScale(1);
      // Configurar colisiones con los edificios
      edificios.setCollisionByProperty({ collides: true });
      // Debug de colisiones (opcional)
      const debugGraphics = this.add.graphics().setAlpha(0.7);
      edificios.renderDebug(debugGraphics, {
          tileColor: null,
          collidingTileColor: new Phaser.Display.Color(243, 234, 48, 255),
          faceColor: new Phaser.Display.Color(40, 39, 37, 255)
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

      // Enemigo (solo como ejemplo)
      this.enemigo = this.physics.add.image(700, 500, 'enemigo').setScale(1);
      this.enemigo.body.setSize(150, 150);
      this.enemigo.body.immovable = true; // Hacer que el enemigo sea inmóvil
      this.enemigo.body.moves = false; // Asegurar que el enemigo no empuje al jugador
     // colisión entre el jugador y el enemigo
        this.physics.add.collider(this.player, this.enemigo);
    // Detección de colisión entre hitbox de ataque y enemigo
         this.physics.add.overlap(this.player, this.enemigo, this.handlePlayerEnemyCollision, null, this);
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
    if (!enemy.isAttacking) {
        enemy.isAttacking = true;
        this.time.delayedCall(this.enemyAttackDelay, () => {
            this.handleEnemyAttack(enemy);
            enemy.isAttacking = false;
        });
    }
}
//spawn de enemigos
spawnEnemyWave() {
    // Aparecer dos enemigos en puntos de aparición específicos
    for (let i = 0; i < 2; i++) {
        const spawnPoint = this.spawnPoints[i % this.spawnPoints.length];
        const enemy = this.physics.add.image(spawnPoint.x, spawnPoint.y, 'enemigo').setScale(1);
        enemy.body.setSize(100, 150);
        enemy.health = 2; // Añadir propiedad de salud al enemigo
        this.enemies.push(enemy);
        enemy.body.immovable = true; // Hacer que el enemigo sea inmóvil
        // Añadir colisión entre jugador y enemigo
        this.physics.add.collider(this.player, enemy, this.handlePlayerEnemyCollision, null, this);
    }
}
//colisiones entre jugador y enemigo
handlePlayerEnemyCollision(player, enemy) {
    if (this.playerState === 'attack') {
        // Reducir la salud del enemigo al ser atacado por el jugador
        this.reduceEnemyHealth(enemy, 1);

        // Verificar si el enemigo ha sido derrotado
        if (enemy.health <= 0) {
            // Eliminar al enemigo
            enemy.destroy();
            // Incrementar el score
            this.score += 10; // Puedes ajustar la cantidad de puntos que se acumulan por derrotar a un enemigo
            this.scoreText.setText(`Score: ${this.score}`);
        }

        this.playerState = 'idle'; // Volver al estado idle después de atacar
    } else {
        // Reducir la salud del jugador si no está atacando
        this.reducePlayerHealth(1);
    }
}
//ataque del enemigo
handleEnemyAttack(enemy) {
    // Crear una hitbox para el ataque del enemigo
    const attackHitbox = this.add.rectangle(enemy.x, enemy.y, 150, 100);
    this.physics.world.enable(attackHitbox);
    this.physics.add.overlap(attackHitbox, this.player, () => {
        this.currentHealth -= 1; // Reducir la vida del jugador al ser atacado
        this.updateHealthBar(); // Actualizar la barra de vida
        attackHitbox.destroy(); // Destruir la hitbox después de la colisión
        if (this.currentHealth <= 0) {
            this.player.setTint(0xff0000); // Cambiar color del jugador a rojo
            this.player.anims.play('idle'); // Reproducir animación de idle
            this.physics.pause(); // Pausar el juego
        }
    });
    // Destruir la hitbox después de un tiempo
    this.time.delayedCall(500, () => {
        attackHitbox.destroy();
    });
}
//vida del enemigo (muerte)
reduceEnemyHealth(enemy, amount) {
    enemy.health -= amount; // Reducir la vida del enemigo
    if (enemy.health <= 0) {
        enemy.destroy(); // Eliminar al enemigo si su vida llega a cero
    }
}
  update() {
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
      for (let i = 0; i < numHearts; i++) {
          const heart = this.add.sprite(10 + i * 32, 10, 'heart', 0).setScale(4).setOrigin(0);
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
}

//verificador de enemigos en pantalla
checkForEnemies() {
    this.enemies = this.enemies.filter(enemy => enemy.active); // Eliminar enemigos desactivados del array
    if (this.enemies.length === 0) {
        this.spawnEnemyWave(); // Generar una nueva oleada si no hay enemigos en pantalla
    }
}
//reducir vida del jugador
reducePlayerHealth(amount) {
    this.currentHealth = Math.max(this.currentHealth - amount, 0); // Asegurar que la salud no sea menor a 0
    this.updateHealthBar();

    if (this.currentHealth <= 0) {
        // Manejar la muerte del jugador (mostrar mensaje, reiniciar juego, etc.)
        console.log('Player is dead');
    }
}
}