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




app.get("/Manager", async (req, res)=>{
    let stationData = await business.getStation(1001)
    console.log(stationData)
    res.render('ManagerPage',{
        station: stationData
    })
})

app.get("/logout", async (req,res)=>{
    await business.deleteSession(req.cookies.session)
    res.clearCookie("session");
    res.redirect('/');
})

app.listen(8000, () => {console.log("App running at port 8000")})