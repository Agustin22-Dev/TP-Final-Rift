export default class ControlsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'controls' });
    }

    create() {
        // Crear texto para mostrar los controles
        const text1 = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50,
            'Controles',
            { fontFamily: 'Arial', fontSize: 36, color: '#ffffff' }
        ).setOrigin(0.5);

        const text2 = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 20,
            'Movimiento: Flechas del teclado',
            { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' }
        ).setOrigin(0.5);

        const text3 = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 60,
            'Ataque: Barra espaciadora',
            { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' }
        ).setOrigin(0.5);
        const text4 = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 100,
            'Derrota la mayor cantidad de enemigos que puedas.',
            { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' }
        ).setOrigin(0.5);
        const text5 = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 140,
            'Los enemigos soltaran vida y corazones, suerte.',
            { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' }
        ).setOrigin(0.5);


        
        const startText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 100,
            'Presiona cualquier tecla para comenzar',
            { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' }
        ).setOrigin(0.5);

        // Configurar evento para avanzar a la siguiente escena al presionar cualquier tecla
        this.input.keyboard.once('keydown', () => {
            this.scene.start('game');
        });

        // Configurar fondo
        this.cameras.main.setBackgroundColor('#000000');
    }
}