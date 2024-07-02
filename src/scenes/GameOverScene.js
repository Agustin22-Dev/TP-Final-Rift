export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('gameOver');
    }

    create() {
        // Mensaje de Game Over
        const gameOverText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50,
            'Game Over',
            { fontFamily: 'Arial', fontSize: 48, color: '#ffffff' }
        );
        gameOverText.setOrigin(0.5);

        // Opción para reiniciar el juego
        const restartText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 50,
            'Press SPACE to Restart',
            { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' }
        );
        restartText.setOrigin(0.5);

        // Detectar la tecla SPACE para reiniciar el juego
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('game'); // Reiniciar la escena principal del juego
        });
    }
}