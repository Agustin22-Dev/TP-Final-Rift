import button from '../button.js'
export default class menu extends Phaser.Scene{
constructor(){
    super('menu')
}

create(){
    // this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'start').setScale(1.1)
    const title = this.add.image(550,300,'title')
const boton = new button(this.cameras.main.centerX, this.cameras.main.centerY + this.cameras.main.centerY/3, 'Play', this, () =>{
    this.scene.start('game')
})

}
}