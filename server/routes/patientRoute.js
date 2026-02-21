import express from 'express'
import {getUserDetails, loginPatient, registerPatient} from '../controllers/patientController.js'
import authUser from '../middleware/authUser.js'


const userRouter = express.Router()

userRouter.post('/register', registerPatient)
userRouter.post('/login', loginPatient)
userRouter.get('/get-user-details', authUser, getUserDetails)

export default userRouter