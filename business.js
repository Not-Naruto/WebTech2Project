const persistance = require('./persistance')
const crypto = require('crypto')

async function attemptLogin(user,pass){
    let details = await persistance.getUser(user)
    if (details == undefined || details.Password != pass) {
        return undefined
    }
    let data = {
        username: details.Name,
        type: details.UserType
    }

    key = await startSession(data)
    
    return key
}

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

async function startSession(data){
    let sessionUUID = crypto.randomUUID()
    let expiry = new Date(Date.now() + 1000*60*10)
    await persistance.updateSession(sessionUUID, expiry, data)
    return sessionUUID
}

async function getSession(key){
    return await persistance.getSession(key)
}

async function deleteSession(key){
    return await persistance.deleteSession(key)
}

async function generateToken(key){
    let token = crypto.randomUUID()
    let sessionData = await persistence.getSession(key)
    sessionData.csrf = token
    await persistance.updateSession(key, new Date(Date.now() + 1000*60*10), sessionData)
    return token
}

async function cancelToken(key){
    let sessionData = await persistence.getSession(key)
    delete sessionData.csrf
    await persistance.updateSession(key, new Date(Date.now() + 1000*60*10), sessionData)
}

async function getToken(key){
    let sessionData = await persistance.getSession(key)
    return sessionData.csrf
}

async function setFlash(key, message){
    let sessionData = await persistance.getSession(key)
    sessionData.flash = message
    await persistance.updateSession(key, new Date(Date.now()+ 1000*60*10), sessionData)
}

async function getFlash(key){
    let sessionData = await persistance.getSession(key)
    if(!sessionData){
        return undefined
    }else{
        let result = sessionData.flash
        delete sessionData.flash
        await persistance.updateSession(key, new Date(Date.now()+ 1000*60*10), sessionData)
        return result 
    }
}

async function findStationByManagerName(ManagerName){
    let allStation = await persistance.getAllStations()
    for(let i=0; i<allStation.length; i++){
        if(ManagerName == allStation[i].Manager){
            return allStation[i]
        }
    }
    return undefined
}


async function findSales(date) {
    
        const salesData = await persistance.findSales(date);

        if (!salesData) {
            return {
                error: "No sales data found for the specified date."
            };
        }

        const salesByType = salesData.Data.map(item => {
            return {
                Date: new Date(salesData.Date).toLocaleDateString('en-US'),
                Type: item.type,
                Quantity: item.quantity,
                Sales: (item.quantity * item.unitPrice).toFixed(2)
            };
        });

        const totalSalesSum = salesByType.reduce((sum, item) => sum + parseFloat(item.Sales), 0).toFixed(2);

        return {
            salesByType,
            totalSalesSum,
        };
}

async function addFuel(stationID, sup, pre){
    let station = await persistance.getStation(parseInt(stationID));
    station.Fuel[0].remaining += pre;
    station.Fuel[1].remaining += sup;
    await persistance.updateStation(stationID, station)
}



module.exports = {
    getAllUsers,
    getAllStations,
    getUser,
    getStation,
    startSession,
    getSession,
    deleteSession,
    generateToken,
    getToken,
    cancelToken,
    setFlash,
    getFlash,
    attemptLogin,
    findStationByManagerName,
    findSales,
    addFuel

}



