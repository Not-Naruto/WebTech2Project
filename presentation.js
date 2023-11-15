const express=require('express')
const business = require('./business.js')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const handlebars = require('express-handlebars')
const e = require('express')

let app = express()

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
        res.cookie('session', session.key, {expires: session.expiry})
        res.redirect(`/HomePage/${username}`)
    }
    else {
        res.redirect('/?message=Invalid Credentials')
    }
})
app.get("/HomePage/:username", async(req,res)=>{
    let userdetail =await business.getUser(req.params.username)
    if(userdetail.UserType== "Manager"){
        res.redirect("/Manager")
    }else if (userdetail.UserType== "Admin"){
        res.redirect("/Admin")
    }else{
        res.redirect("/Guest")
    }
})




app.get("/Manager/:ManagerName", async (req, res)=>{
    let stationData = await business.getStation(1001)
    let ManagerName = req.params.ManagerName
    res.render('ManagerPage',{
        station: stationData,
        ManagerName: ManagerName
    })
})





app.listen(8000, () => {console.log("App running at port 8000")})