import validator from 'validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import patientModel from '../models/patientModel.js'

const registerPatient = async (req,res) => {

    try {
        
        const {name, email, password, phone, date, gender} = req.body
        
        if (!name || !password || !email || !phone || !date){
            return res.json({success: false, message:"Missing details"})
        }

        if (!validator.isEmail(email)){
            return res.json({success: false, message: 'Enter a valid email'})
        }
        
        if (!validator.isMobilePhone(phone)){
            return res.json({success:false, message: 'Enter a valid phone number'})
        }

        if (password.length < 8){
            return res.json({success:false, message:"Enter a strong email"})
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        const patientData = {
            name,
            email,
            password: hashedPassword,
            phone,
            dob: date,
            gender

        }

        const newPatient = new patientModel(patientData)
        const patient = await newPatient.save()

        const token = jwt.sign({id:patient._id}, process.env.JWT_SECRET)

        res.json({ success: true, token, patientId: patient._id });

    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

const loginPatient = async (req, res) => {

    try {
        const {email, password} = req.body
        const patient = await patientModel.findOne({email})

        if (!patient) {
            return res.json({success: false, message: 'User does not exist'})

        }

        const isMatch = await bcrypt.compare(password, patient.password)

        if (isMatch){
            const token = jwt.sign({id: patient._id}, process.env.JWT_SECRET)
            res.json({ success: true, token, patientId: patient._id });
        } else {
            res.json({success:false, message: "Invalid Credentials"})
        }
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

const getUserDetails = async (req, res) => {

    try {
        const user = await patientModel.findOne({_id: req.body.patientId})
        if (!user) {
            return res.json({success: false, message: 'User does not exist'})
        }else {
            res.json({success:true, user})
        }

    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}


export {registerPatient, loginPatient, getUserDetails}