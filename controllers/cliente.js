const axios = require('axios');
const { MongoClient } = require('mongodb');


const login = async (req,res)=>{

   const  {username,password} = req.body;
   

    try{
    
        const clientExist = await checkClient(username,password);

        if(!clientExist){
            return res.status(404).json({message:"Cliente no registrado"});
        }

        const access_token = await getAcessToken();
        const auth_token = await getAuthorizationToken(username,password,access_token)   

  
    return res.status(200).json({
        auth_token:auth_token,
        access_token:access_token
    });
    
     
        
    }catch(err){
        return res.status(err.response.status)
    }
    finally{
        
    }

}

const checkClient = async (username,password)=>{
    
    const client = await new MongoClient(process.env.MONGODB_SERVER);
    const dbName = process.env.DATABASE_NAME;
    
    try {
        client.connect();
        const db = client.db(dbName);
        
        const clientesCollection = await db.collection("clientes")
    
        const clientes = await clientesCollection.find({ProfileCredentials:{Username:username,Password:password}}).toArray()
        
        if(clientes[0]){
            return true;
        }else{
            return false;
        }
    }catch(err){
        console.log(err)
    }finally{
        client.close();
    }

    

}

const getAcessToken = async ()=>{
    
    var headers = {
        Authorization: process.env.TOKEN_BEARER,
        "Content-Type":"application/x-www-form-urlencoded" 
        }

    
    const body = "grant_type=client_credentials"; 

    const response = await axios.post("https://api.uat.4wrd.tech:8243/token",body,{headers});
    

    const access_token = await response.data.access_token;

    return access_token;

}

const getAuthorizationToken= async (username,password,access_token)=>{
    
    const headers = {
        Authorization:`Bearer ${access_token}`
    }
    
    const body = `grant_type=password&username=${username}&password=${password}`

    const response = await axios.post("https://api.uat.4wrd.tech:8243/authorize/2.0/token?provider=AB4WRD",body,{headers});
    
    
    
    const auth_token = await response.data.access_token;

    return auth_token;
    
}




module.exports = {
    login: login,
    
  };