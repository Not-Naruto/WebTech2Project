const persistance = require('./persistance')

async function getAllUsers(){
    return await persistance.getAllUsers()
}

async function