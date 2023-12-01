const mongodb = require('mongodb')

client = undefined;
station = undefined;
users = undefined;
session = undefined;
session = undefined;
sales = undefined;

async function connectDatabase(){
    if (!client){
        client = new mongodb.MongoClient('mongodb+srv://webtech856:Doha2023@project.tgm3esr.mongodb.net/');
        await client.connect()
        let db = client.db('Project')
        station = db.collection('Stations');
        users = db.collection('Users');
        session = db.collection('Sessions');
        session = db.collection('Sessions');
        sales = db.collection('Sales');
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
async function getUserById(id){
    await connectDatabase();
    let student = await users.findOne({ UserID: id});
    if(!student){
        return false;
    }
    return student;
}
async function getUser(name){
    await connectDatabase();
    let student = await users.findOne({ Name: name});
    if(!student){
        return false;
    }
    return student;
}

async function getStation(id){
    await connectDatabase();
    let findStation = await station.findOne({StationID: id});
    if(!findStation){
        return false;
    }
    return findStation;
}

async function updateStation(id, data){
    await connectDatabase();
    await station.replaceOne({StationID:parseInt(id)}, data);
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
    let findSession = await session.findOne({"sessionKey": uuid})
    if(!findSession){
        await session.insertOne({
            "sessionKey": uuid,
            "expiry": expiry,
            "data": data
        })
    }else{
        await session.replaceOne({"sessionKey":uuid}, {
            "sessionKey": uuid,
            "expiry": expiry,
            "data": data
        })
    }
    return true;
}

async function getSession(key){
    await connectDatabase()
    let sd = await session.findOne({"sessionKey":key});
    if(!sd){
        return undefined;
    }
    return sd.data;
}

async function deleteSession(key){
    await connectDatabase()
    await session.deleteOne({ "sessionKey": key });
}

async function findSales(date, stationID){
    await connectDatabase()
    let findSalesByDate = await sales.findOne({"Date": new Date(date), "StationID": stationID})
    if(!findSalesByDate){
        return undefined
    }
    return findSalesByDate
}

async function updateAddSales(date, stationID, data){
    await connectDatabase()
    let dateNow = new Date(date)
    let findSalesByDate = await sales.findOne({"Date": new Date(date), "StationID": stationID})
    if(!findSalesByDate){
        await sales.insertOne({
            "Date": new Date(dateNow),
            "StationID": stationID,
            "Data": data
        })
    }else{
        await sales.replaceOne({"Date":new Date(date), "StationID": stationID}, {
            "Date": new Date(date),
            "StationID": stationID,
            "Data": data
        })
    }
}

async function findAllSales(){
    await connectDatabase();
    let rawData = await sales.find({})
    let result = await rawData.toArray();
    return result;
}

module.exports = {
    getUserById,
    getAllUsers,
    getAllStations,
    getUser,
    getStation,
    updateUser,
    updateStation,
    addSales,
    updateSession,
    getSession,
    deleteSession,
    findSales,
    updateAddSales,
    findAllSales
}