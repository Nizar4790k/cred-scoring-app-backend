const axios = require('axios');
const { MongoClient } = require('mongodb');
const qualitativeScoringModule = require('./qualitativeScoring.js');
const quantitativeScoringModule = require('./quantitativeScoring');

const { getAuthorizationToken,getAcessToken } = require('../cliente/cliente');

const calculateCreditScoring= async (req,res)=>{

  
    var {profileId,auth_token,access_token} = req.body;

    const profile = await findClientOnDataBase(profileId);

    if(auth_token==="" && access_token===""){
      

      if(profile){
        
        try{
          
          access_token = await getAcessToken();
          auth_token =  await getAuthorizationToken(profile.ProfileCredentials.Username,profile.ProfileCredentials.Password,access_token);
          
        }catch(err){
          return res.status(401).json({message:"No autorizado"});
        }


      }else{
        
        return res.status(404).json({message:"Cliente no registrado"});
      }
      
    }

  

    const qualitativeScore= qualitativeScoringModule.calculateQualitativeScoring(profile);

    const quantitativeScore =  await quantitativeScoringModule.calculateQuantitativeScoring(access_token,auth_token);

    

    return res.status(200).json({creditScoring:(qualitativeScore+quantitativeScore)});
}


const findClientOnDataBase= async (profileId)=>{
  
  const client = await new MongoClient(process.env.MONGODB_SERVER);
  const dbName = process.env.DATABASE_NAME;
  
  try {
      client.connect();
      const db = client.db(dbName);
      
      const clientesCollection = await db.collection("clientes")
  
      const clientes = await clientesCollection.find({Codigo:profileId}).toArray()
      
      return clientes[0];

  }catch(err){
      console.log(err)
  }finally{
      client.close();
  }

  
}

module.exports = {
  calculateCreditScoring: calculateCreditScoring,
  
};