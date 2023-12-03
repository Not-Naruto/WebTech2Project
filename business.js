const { stat } = require('fs/promises')
const persistance = require('./persistance')
const crypto = require('crypto')

async function attemptLogin(user,pass){
    let details = await persistance.getUser(user)
    if (details == undefined || details.Password != pass) {
        return undefined
    }
    let data = {
        userID: details.UserID,
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

async function getUser(Name){
    return await persistance.getUser(Name)
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

async function findStationByManagerId(id){
    let allStation = await persistance.getAllStations()
    for(let i=0; i<allStation.length; i++){
        if(id == allStation[i].ManagerID){
            return allStation[i]
        }
    }
    return undefined
}


async function findSales(date, id) {
    
        let stationData = await findStationByManagerId(id)
        console.log(stationData)
        let salesData = await persistance.findSales(date, stationData.StationID);

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

async function findAllSales() {
    let uniqueStationsWithSales = [];
    let rawsales = await persistance.findAllSales();

    for (let sales of rawsales) {
        let existingSales = uniqueStationsWithSales.find(item => item.StationID === sales.StationID);

        if (!existingSales) {
            uniqueStationsWithSales.push(sales);
        }
    }
    uniqueStationsWithSales.sort((a, b) => a.StationID - b.StationID);

    return uniqueStationsWithSales;
}

async function findSalesforStation(id){
    let mapping = {0:"Jan", 1:"Feb", 2:"Mar", 3:'Apr', 4:'May', 5:'Jun', 6:"Jul", 7:'Aug', 8:"Sep", 9:'Oct', 10:'Nov', 11:"Dec"}
    let superOutput = {'Jan':0,'Feb':0,"Mar":0,"Apr":0,"May":0,"Jun":0,"Jul":0,"Aug":0,"Sep":0,'Oct':0,"Nov":0,"Dec":0};
    let premiumOutput = {'Jan':0,'Feb':0,"Mar":0,"Apr":0,"May":0,"Jun":0,"Jul":0,"Aug":0,"Sep":0,'Oct':0,"Nov":0,"Dec":0};
    let rawsales = await persistance.findAllSales();
    rawsales = rawsales.filter(item=>item.StationID==id)

    for(let i = 0; i<rawsales.length;i++){
        superOutput[mapping[rawsales[i].Date.getMonth()]]+=rawsales[i].Data[0].quantity * rawsales[i].Data[0].unitPrice
        premiumOutput[mapping[rawsales[i].Date.getMonth()]]+=rawsales[i].Data[1].quantity * rawsales[i].Data[1].unitPrice
    }
    return {super: superOutput, premium: premiumOutput}
}

async function updateAddSales(date, id, data){
    let stationData = await getStation(id)
    await persistance.updateAddSales(date, stationData.StationID, data)
    stationData.Fuel[0].remaining-=data[1].quantity;
    stationData.Fuel[1].remaining-=data[0].quantity;
    await persistance.updateStation(id, stationData);
}

async function calculateTotalSalesPerStation() {
    try {

        const allSales = await persistance.findAllSales();
        const totalSalesPerStation = {};

        allSales.forEach(sale => {
            const stationID = sale.StationID;
            if (!totalSalesPerStation[stationID]) {
                totalSalesPerStation[stationID] = 0;
            }
            const totalSalesForSale = sale.Data.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
            totalSalesPerStation[stationID] += totalSalesForSale;
        });

        return totalSalesPerStation;
    } catch (error) {
        console.error("Error calculating total sales per station:", error);
        throw error;
    }
}

async function deleteStation(id){
    await persistance.deleteStation(id);
}

async function addFuel(stationID, sup, pre){
    let station = await persistance.getStation(parseInt(stationID));
    station.Fuel[0].remaining += pre;
    station.Fuel[1].remaining += sup;
    await persistance.updateStation(stationID, station)
}

async function updateUser(id, data){
    await persistance.updateUser(id, data)
}

async function getUserById(id){
    return await persistance.getUserById(id)
}

async function updateStation(id, data){
    await persistance.updateStation(id, data);
}

async function getManagers(){
    let users = await getAllUsers();
    let managers = users.filter((item)=>item.UserType=='Manager');
    return managers;
}

async function getManagersWithoutStation() {
    let users = await getAllUsers();
    let stations = await getAllStations();
    let managers = users.filter((item) => item.UserType === 'Manager');

    let managersWithoutStation = managers.filter((manager) => {
        return stations.every((station) => manager.UserID !== station.ManagerID);
    });

    return managersWithoutStation;
}



async function getRemainingPremuemFuel(){
    let data = await persistance.getAllStations()
    
    let Remaining = []
    for(let station of data){
        let Premium = station.Fuel[0].remaining
        Remaining.push(Premium)
    }

    return Remaining
}

async function getRemainingSuperFuel(){
    let stationData = await persistance.getAllStations()
    
    let SuperRemaining = []
    for(let station of stationData){
        let Super = station.Fuel[1].remaining
        SuperRemaining.push(Super)
    }

    return SuperRemaining
}


async function addStation(data){
    return await persistance.addStation(data)
}

async function generateStationID(){
    let stations = await persistance.getAllStations();
        
        let maxID = 0;
        for (let station of stations) {
            if (station.StationID > maxID) {
                maxID = station.StationID;
            }
        }

        let newID = maxID + 1;

        return newID;
}



module.exports = {
    getUserById,
    updateUser,
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
    findStationByManagerId,
    findSales,
    updateAddSales,
    addFuel,
    findAllSales,
    calculateTotalSalesPerStation,
    getRemainingSuperFuel,
    getRemainingPremuemFuel,
    findSalesforStation,
    deleteStation,
    updateStation,
    getManagers,
    getManagersWithoutStation,
    addStation,
    generateStationID
}



