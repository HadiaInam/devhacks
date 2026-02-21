import jwt from 'jsonwebtoken'

const authUser = async (req, res, next) => {
    try {
        
        const {token} = req.headers
        if (!token) {
            return res.json({success:false, message:'Not Authorized'})
        }
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        if (!req.body){
            req.body = {}
            req.body.patientId = token_decode.id
        } else {
            req.body.patientId = token_decode.id
        }

        next()
    } catch (error) {
        console.log(error)
        res.json({success:false, message: error.message})
    }
}
export default authUser