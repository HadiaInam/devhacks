import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongo.js'
import connectCloudinary from './config/cloudinary.js'
import patientRouter from './routes/patientRoute.js'
import logRouter from './routes/logRoute.js'



const app = express()
const port = process.env.PORT || 4000



connectDB()
connectCloudinary()

app.use(express.json());
app.use(cors())


app.use('/api/patient', patientRouter)
app.use('/api/logs', logRouter)

app.get('/', (req,res) => {
    res.send('API Working')
})

app.listen(port, () => console.log('Server Started: ', port))