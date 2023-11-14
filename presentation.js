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
app.use(express.static('static'));

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
        res.redirect('/HomePage')
    }
    else {
        res.redirect('/?message=Invalid Credentials')
    }
})




app.listen(8000, () => {})