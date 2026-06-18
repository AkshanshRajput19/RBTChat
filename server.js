const express=require('express')
const app=express()
const demorouter=require('./routers/Demo2')


app.use('/',demorouter)
app.listen(5000,()=>{console.log('Server is running on port 5000')})    