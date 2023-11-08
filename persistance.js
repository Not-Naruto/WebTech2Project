const mongodb = require('mongodb')

const client = undefined;
const station = undefined;
const users = undefined;
const sessions = undefined;
const sales = undefined;

async function connectDatabase(){
    if (!client){
        client = new mongodb.MongoClient('mongodb://127.0.0.1:27017');
        await client.connect();
        station = client.db('Station');
        users = client.db('Users');
        sessions = client.db('Sessions');
        sales = client.db('Sales');
    }
}

async function getAllUsers(){
    await connectDatabase();
    let rawData = await users.find({})
    let result = await rawData.toArray();
    return result;
}

async function getAllStations(){
    await connectDatabase();
    let rawData = await station.find({})
    let result = await rawData.toArray();
    return result;
}

async function getUser(id){
    await connectDatabase();
    let student = await users.findOne({ UserID: id});
    if(!student){
        return false;
    }
    return student;
}

async function getStation(id){
    await connectDatabase();
    let station = await station.find({StationID: id});
    if(!station){
        return false;
    }
    return true;
}

async function updateStation(id, data){
    await connectDatabase();

}

async function updateUser(id, data){

}

async function addSales(data){

}

async function startSession(key, data){

}

async function getSession(key){

}

async function deleteSession(key){

}

module.exports = {
    getAllUsers,
    getAllStations,
    getUser,
    getStation,
    updateUser,
    updateStation,
    addSales,
    startSession,
    getSession,
    deleteSession
}