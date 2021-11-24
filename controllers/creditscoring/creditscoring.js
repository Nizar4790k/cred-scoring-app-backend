const axios = require('axios');
const { MongoClient } = require('mongodb');
const qualitativeScoringModule = require('./qualitativeScoring.js');

const calculateCreditScoring= async (req,res)=>{

  

    const profileId = req.body.profileId;
    
    const profile = await findClientOnDataBase(profileId);
    
    const qualitativeScore= qualitativeScoringModule.calculateQualitativeScoring(profile);

    return res.status(200).json({creditScoring:qualitativeScore});
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