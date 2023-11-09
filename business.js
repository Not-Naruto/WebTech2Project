const persistance = require('./persistance')

async function getAllUsers(){
    let allUsers = await persistance.getAllUsers()
    if(allUsers.length == 0){
        return undefined
    }
    return allUsers
}

async function getAllStations(){
    let allStation = await persistance.getAllStations()
    if(allStation.length == 0){
        return undefined
    }
    return allStation
}

async function getUser(id){
    return await persistance.getUser(id)
}

async function getStation(id){
    return await persistance.getStation(id)
}

async function updateStation(id, data){
    
}



