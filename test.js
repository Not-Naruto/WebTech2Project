const bs = require("./business")
const per = require('./persistance')

async function test(){
    x = await bs.getManagers()
    console.log(x)
}
// helloi

test()