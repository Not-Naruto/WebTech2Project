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
        res.redirect(`/Manager/${sd.username}`)
    }else if (sd.type== "Admin"){
        res.redirect(`/Admin/${sd.username}`)
    }else{
        res.redirect("/Guest")
    }
})


app.get("/Manager/:ManagerName", async (req, res)=>{
    let ManagerName = req.params.ManagerName
    let stationData = await business.findStationByManagerName(ManagerName)
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
        ManagerName: ManagerName,
        isManaging:manageStation,
        premium: fuelTypePremium,
        super: fuelTypeSuper,
    })
})

app.post("/Manager/:ManagerName", async (req, res)=>{
    let ManagerName = req.params.ManagerName
    let viewSales = req.body.salesDate
    console.log(viewSales)
    let stationData = await business.findStationByManagerName(ManagerName)
    let sales = await business.findSales(viewSales, ManagerName)
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
        ManagerName: ManagerName,
        isManaging:manageStation,
        premium: fuelTypePremium,
        super: fuelTypeSuper,
        sales:sales
    })
})

app.get('/:ManagerName/:stationName/recordSales', async (req, res)=>{
    let managerName = req.params.ManagerName
    let stationData = await business.findStationByManagerName(managerName)
    res.render('RecordSales',{
        ManagerName: managerName,
        StationID: stationData.StationID
    })
})

app.post('/:ManagerName/:stationName/recordSales', async (req, res)=>{
    let date = req.body.datepicker
    let premiumFuel = parseInt(req.body.premiumFuel)
    let superFuel = parseInt(req.body.superFuel)
    let stationData = await business.findStationByManagerName(req.params.ManagerName) 
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

    let updateAdd = await business.updateAddSales(date, req.params.ManagerName, data)
    res.redirect(`/Manager/${req.params.ManagerName}?msg=Sales has been added/Updated`)
})



app.get('/Stations', async (req,res)=>{
    let stations = await business.getAllStations();
    stations = stations.map((item)=>{
        return {...item, isWoqod:item.Name==="Woqod"}
    })
    res.render('Stations', {
        stationList: stations
    })
})

app.get('/:ManagerName/:stationID/delivery', async (req, res)=>{
    let station = await business.getStation(parseInt(req.params.stationID));
    if (req.params.ManagerName == station.Manager){
        res.render("Delivery", {
            station: station
        })
    }else{
        res.redirect(`/Manager/${req.params.ManagerName}?msg=Lacking permissions to access screen`)
    }
})

app.post('/:ManagerName/:stationID/delivery', async(req,res)=>{
    let superFuel = parseInt(req.body.superFuel);
    let premiumFuel = parseInt(req.body.premiumFuel);
    await business.addFuel(req.params.stationID, superFuel, premiumFuel)
    res.redirect(`/Manager/${req.params.ManagerName}?msg=Fuel Delivery recorded`)
})


//making admin homePage
app.get('/admin/:adminName', (req, res)=>{
    res.render('adminPage')
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
    user=sd.username
    userDetails = await business.getUser(user)
    res.render('AccountInfo',{details: userDetails})
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
})
app.get("/ResetPassword/:id", async (req,res)=>{
    res.render("ResetPassword")
})
app.post("/ResetPassword/:id", async (req,res)=>{
    id= parseInt(req.params.id)
    user = await business.getUserById(parseInt(id))
    user.Password = req.body.Password
    await business.updateUser(id,user)
    res.redirect("/AccountInfo")
})
app.get("/ContactUs", async (req,res)=>{
    res.render("ContactUs")
})



app.listen(8000, () => {console.log("App running at port 8000")})