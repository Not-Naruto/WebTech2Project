const bs = require("./business")
const per = require('./persistance')

async function test(){
    x = await bs.findSalesforStation(1001)
    console.log(x)
    
}
// helloi

test()