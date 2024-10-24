const jwt = require('jsonwebtoken');
require('dotenv').config()

module.exports=async(req,res,next)=>{
    
    try{
        const jwtToken = req.header("token");
        console.log("jWttoken",jwtToken);
        
        if(!jwtToken){
            return res.status(403).json("Not Authorized - token missing");
        }

        const payload = jwt.verify(jwtToken,process.env.JWT_SECRET);


        req.user = payload.user;
    }
    catch(error)
    {
        return res.status(403).json("Not Authorized");
    }
    next()

};