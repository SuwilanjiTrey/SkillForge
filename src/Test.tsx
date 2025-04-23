class Trey {
    public name = "suwilanji"
    public nickname = "trey"


    
    constructor() {
       

        const name = this.name
        const nickname = this.nickname
    }
    

    /**
     * getname
     */
    public getname() {
        alert(`your name is,  ${this.name}`)
    }

    public get string() : string {
        return "my name"
    }
    
}

export default Trey;

