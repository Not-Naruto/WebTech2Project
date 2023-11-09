const mongodb = require('mongodb')

const client = undefined;
const station = undefined;
const users = undefined;
const sessions = undefined;
const sales = undefined;

async function connectDatabase(){
    if (!client){
        client = new mongodb.MongoClient('mongodb+srv://WebTech856:Doha2023@project.tgm3esr.mongodb.net/');
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
    let station = await station.findOne({StationID: id});
    if(!station){
        return false;
    }
    return station;
}

async function updateStation(id, data){
    await connectDatabase();
    await station.replaceOne({stationID:id}, data);
}

async function updateUser(id, data){
    await connectDatabase();
    await users.replaceOne({UserID:id}, data);
}

async function addSales(data){
    await connectDatabase();
    await users.insertOne(data);
}
// need fixing
async function updateSession(uuid, expiry, data){
    await connectDatabase()
    let findSession = await sessions.findOne({"SessionKey": uuid})
    if(!findSession){
        await session.insertOne({
            "sessionKey": uuid,
            "expiry": expiry,
            "data": data
        })
    }else{
        await session.replaceOne({"SessionKey":uuid}, {
            "sessionKey": uuid,
            "expiry": expiry,
            "data": data
        })
    }
    return true;
}

async function getSession(key){
    let sd = await sessions.findOne({SessionKey:key}).data;
    if(!sd){
        return undefined;
    }
    return sd;
}

async function deleteSession(key){
    await sessionsCollection.deleteOne({ sessionKey: key });
}

module.exports = {
    getAllUsers,
    getAllStations,
    getUser,
    getStation,
    updateUser,
    updateStation,
    addSales,
    updateSession,
    getSession,
    deleteSession
}