const express=require('express')
const business = require('./business.js')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const handlebars = require('express-handlebars')
const Handlebars = require("handlebars");
const e = require('express')

let app = express()

Handlebars.registerHelper('ifSuper', function(arg1, options) {
    return arg1 === "Super" ? options.fn(this) : options.inverse(this);
  });

Handlebars.registerHelper('ifLow', function(arg1, options){
    arg1 = parseInt(arg1);
    return arg1<50? options.fn(this):options.inverse(this);
})

Handlebars.registerHelper('isWoqod', function(arg1, options){
    return arg1 === 'Woqod'?options.fn(this):options.inverse(this);
})

app.set('views', __dirname+"/templates")
app.set('view engine', 'handlebars')
app.engine('handlebars', handlebars.engine())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use("/static",express.static(__dirname+'/static'));

app.get("/", async (req,res)=>{
    let message = req.query.message
    res.render('LoginPage', {
        message: message
    })
})
app.post("/", async (req,res)=>{
    let username = req.body.username
    let password = req.body.password
    let session = await business.attemptLogin(username, password)
    if (session) {
        res.cookie('session', session)
        res.redirect(`/HomePage`)
    }
    else {
        res.redirect('/?message=Invalid Credentials')
    }
})
app.get("/HomePage", async(req,res)=>{
    let key = req.cookies.session;
    if(!key){
        res.redirect('/')
        return;
    }
    let sd = await business.getSession(key)
    if(!sd){
        res.redirect('/');
        return;
    }
    if(sd.type== "Manager"){
        res.redirect(`/Manager/${sd.userID}`)
    }else if (sd.type== "Admin"){
        res.redirect(`/Admin/${sd.userID}`)
    }else{
        res.redirect("/Guest")
    }
})


app.get("/Manager/:id", async (req, res)=>{
    let id = parseInt(req.params.id)
    let stationData = await business.findStationByManagerId(id)
    let manager = await business.getUserById(id)
    let fuelTypePremium = undefined
    let fuelTypeSuper = undefined
    
    if(!stationData){
        manageStation = false;
    }
    else{
        manageStation=true;
        fuelTypeSuper = stationData.Fuel[1]
        fuelTypePremium = stationData.Fuel[0]
    }
    res.render('ManagerPage',{
        msg:req.query.msg,
        station: stationData,
        ManagerName: manager.Name,
        isManaging:manageStation,
        premium: fuelTypePremium,
        super: fuelTypeSuper,
    })
})

app.post("/Manager/:id", async (req, res)=>{
    let id = parseInt(req.params.id)
    let viewSales = req.body.salesDate
    console.log(viewSales)
    let manager = await business.getUserById(id)
    let stationData = await business.findStationByManagerId(id)
    let sales = await business.findSales(viewSales, id)
    let fuelTypePremium = undefined
    let fuelTypeSuper = undefined
    
    if(!stationData){
        manageStation = false;
    }
    else{
        manageStation=true;
        fuelTypeSuper = stationData.Fuel[1]
        fuelTypePremium = stationData.Fuel[0]
        
    }

    res.render('ManagerPage',{
        station: stationData,
        ManagerName: manager.Name,
        isManaging:manageStation,
        premium: fuelTypePremium,
        super: fuelTypeSuper,
        sales:sales
    })
})

app.get('/:stationID/recordSales', async (req, res)=>{
    let key = req.cookies.session;
    if(!key){
        res.redirect('/')
        return;
    }
    let sd = await business.getSession(key)
    if(!sd){
        res.redirect('/');
        return;
    }
    
    let station = await business.getStation(parseInt(req.params.stationID));
    if (sd.userID == station.ManagerID){
        manager = await business.getUserById(sd.userID);
        res.render("RecordSales", {
            manager: manager,
            station: station
        })
    }else{
        res.redirect(`/Manager/${sd.userID}?msg=Lacking permissions to access screen`)
    }
})

app.post('/:stationID/recordSales', async (req, res)=>{
    let date = req.body.datepicker
    let premiumFuel = parseInt(req.body.premiumFuel)
    let superFuel = parseInt(req.body.superFuel)
    let stationData = await business.getStation(parseInt(req.params.stationID)) 
    let data = [
        {
            type:"Super",
            quantity:superFuel,
            unitPrice: stationData.Fuel[0].price
        },
        {
            type:"Premium",
            quantity:premiumFuel,
            unitPrice: stationData.Fuel[1].price
        }
    ]

    if(stationData.Fuel[0].remaining<premiumFuel || stationData.Fuel[1].remaining<superFuel){
        res.redirect(`/Manager/${req.body.managerID}?msg=Insufficient Fuel`)
        return;
    }

    await business.updateAddSales(date, parseInt(req.params.stationID), data)
    res.redirect(`/Manager/${req.body.managerID}?msg=Sales has been added/Updated`)
})



app.get('/Stations', async (req,res)=>{
    let stations = await business.getAllStations();
    stations = stations.map((item)=>{
        return {...item, isWoqod:item.Name==="Woqod"}
    })
    res.render('Stations', {
        stationList: stations,
        msg:req.query.msg
    })
})

app.get('/Stations/:stationID', async (req,res)=>{
    let key = req.cookies.session;
    if(!key){
        res.redirect('/Stations/?msg=Insufficient permission')
        return;
    }
    let sd = await business.getSession(key)
    if(!sd){
        res.redirect('/Stations/?msg=Insufficient permission');
        return;
    }

    let stationID = parseInt(req.params.stationID)
    let station = await business.getStation(stationID)
    let admin = false;
    if (sd.type == 'Admin'){
        admin = true;
    }
    if(sd.userID == station.ManagerID || sd.type == 'Admin'){
        let  managerName = await business.getUserById(station.ManagerID)
        let sales = await business.findSalesforStation(stationID)
        managerName = managerName.Name
        res.render("StationPage",{
            station:station,
            admin: admin,
            super: station.Fuel[0],
            premium: station.Fuel[1],
            manager: managerName,
            message: req.query.msg,
            superSales: Object.values(sales.super),
            premiumSales: Object.values(sales.premium)
        }
        )
    }else{
        res.redirect("/Stations/?msg=Insufficient permission")
    }
})

app.get('/:stationID/delivery', async (req, res)=>{
    let key = req.cookies.session;
    if(!key){
        res.redirect('/')
        return;
    }
    let sd = await business.getSession(key)
    if(!sd){
        res.redirect('/');
        return;
    }
    
    let station = await business.getStation(parseInt(req.params.stationID));
    if (sd.userID == station.ManagerID){
        manager = await business.getUserById(sd.userID);
        res.render("Delivery", {
            manager: manager,
            station: station
        })
    }else{
        res.redirect(`/Manager/${sd.userID}?msg=Lacking permissions to access screen`)
    }
})

app.post('/:stationID/delivery', async(req,res)=>{
    let superFuel = parseInt(req.body.superFuel);
    let premiumFuel = parseInt(req.body.premiumFuel);
    await business.addFuel(req.params.stationID, superFuel, premiumFuel)
    res.redirect(`/Manager/${req.body.managerId}?msg=Fuel Delivery recorded`)
})


//making admin homePage
app.get('/admin/:adminName', async (req, res)=>{
    let sales = await business.findAllSales()
    let totalSales = await business.calculateTotalSalesPerStation()
    res.render('adminPage',{
        adminName: req.params.adminName,
        sales:sales,
        total: totalSales
    })
})

app.get("/logout", async (req,res)=>{
    await business.deleteSession(req.cookies.session)
    res.clearCookie("session");
    res.redirect('/?message=Logged out Succesfully');
})

app.get("/AccountInfo", async (req,res)=>{
    let key = req.cookies.session;
    if(!key){
        res.redirect('/')
        return;
    }
    let sd = await business.getSession(key)
    if(!sd){
        res.redirect('/');
        return;
    }
    user=sd.userID
    userDetails = await business.getUserById(user)
    res.render('AccountInfo',{
        details: userDetails,
        msg : req.query.msg
    })
})

app.post("/AccountInfo", async (req,res)=>{
    console.log(req.body)
    id = req.body.userId
    userName = req.body.NewUser
    phoneNumber = req.body.phoneNumber

    user = await business.getUserById(parseInt(id))
    if(!user){
        console.log("Not found")
    }
    if(userName != ""){
        user.Name = userName
    }
    if(phoneNumber!= ""){
        user.PhoneNumber = parseInt(phoneNumber)
    }
    console.log(user)
    await business.updateUser(parseInt(id),user)
    res.redirect('/AccountInfo?msg=Info Updated')
})
app.get("/ResetPassword/:id", async (req,res)=>{
    res.render("ResetPassword")
})
app.post("/ResetPassword/:id", async (req,res)=>{
    id= parseInt(req.params.id)
    user = await business.getUserById(parseInt(id))
    user.Password = req.body.Password
    await business.updateUser(id,user)
    res.redirect("/AccountInfo?msg=Password reset")
})
app.get("/ContactUs", async (req,res)=>{
    res.render("ContactUs")
})

app.use((req,res)=>{
    res.status(404).render('notFound');

})

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).render('Error');
  });


app.listen(8000, () => {console.log("App running at port 8000")})