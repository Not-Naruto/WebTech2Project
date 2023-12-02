const bs = require("./business")
const per = require('./persistance')

async function test(){
    console.log(await bs.calculateTotalSalesPerStation())
    
}


test()