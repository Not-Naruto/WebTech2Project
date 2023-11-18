const bs = require("./business")
const per = require('./persistance')

async function test(){
    console.log(await bs.findSales('2023-10-16', "Mubarak Al-Kuwari"))
    
}

test()