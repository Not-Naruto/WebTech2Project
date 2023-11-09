const bs = require("./business")

async function test(){
    console.log(await bs.getAllUsers())
}

test()