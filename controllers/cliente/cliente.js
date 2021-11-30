const axios = require('axios');
const { MongoClient } = require('mongodb');
const qualitativeScoringModule = require('../creditscoring/qualitativeScoring');
const quantitativeScoringModule = require('../creditscoring/quantitativeValues');

const login = async (req,res)=>{

   const  {username,password} = req.body;
   

    try{
    
        const codigoCliente = await checkClient(username,password);
        

        if(!codigoCliente){
            return res.status(404).json({message:"Cliente no registrado"});
        }

        const access_token = await getAcessToken();
        const auth_token = await getAuthorizationToken(username,password,access_token)   
    
  
    return res.status(200).json({
        auth_token:auth_token,
        access_token:access_token,
        codigoCliente:codigoCliente
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
        await client.connect();
        const db = client.db(dbName);
        
        const clientesCollection = await db.collection("clientes")
    
        const clientes = await clientesCollection.find({ProfileCredentials:{Username:username,Password:password}}).toArray()
        

        if(clientes[0]){
            return clientes[0].Codigo;
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

const getClientDetail = async (req,res)=>{

  

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

    

    const qualitativeScore= await qualitativeScoringModule.calculateQualitativeScoring(profile);

    const quantitativeValues =  await quantitativeScoringModule.calculateQuantitativeValues(access_token,auth_token);

    const creditScore = qualitativeScore + quantitativeValues.points;
    
    /*

    profile.CreditValues = {
        points:creditScore,
        dateGenerated:Date.now(),
        unPaymentProbability:quantitativeValues.unPaymentProbability,
        payments:quantitativeValues.payments,
        loansQuantity: quantitativeValues.loansQuantity,
        loanStatusCount:quantitativeValues.loanStatusCount,
        currentLoans: quantitativeValues.currentLoans,
        nextCredit:quantitativeValues.nextCredit

    };
    */


   const response =  {profile:profile,
    scoring:{
        creditScore:creditScore,
        unPaymentProbability:quantitativeValues.unPaymentProbability,
        dateCreated:profile.DateCreated
    },
    creditInProgress:{
        loans:{
            loansQuantity: quantitativeValues.loansQuantity,
            loanStatusCount:quantitativeValues.loanStatusCount,

        },
        payments:quantitativeValues.payments,
        currentLoans:quantitativeValues.currentLoans
    },
        nextCredit:quantitativeValues.nextCredit
    };

    delete profile.ProfileCredentials;
    delete profile.FamilyName;
    delete profile.MarriedName;
    delete profile.Title;
    delete profile.SupplementaryData;
    delete profile.CreditScoring;
    delete profile.CreditScore;
    delete profile.DateCreated;
    

    await updateCreditScore(profileId,creditScore);


    console.log(response);
    

    return res.status(200).json(response);
}

const updateCreditScore = async (profileId,creditScore)=>{

    
    const client = await new MongoClient(process.env.MONGODB_SERVER);
    const dbName = process.env.DATABASE_NAME;
    
    await client.connect();

    

    try {
        
        const db = await client.db(dbName);
        const clientesCollection = await db.collection("clientes");
        
        
        await clientesCollection.updateOne({Codigo:profileId}, {$set: {"CreditScore": creditScore}});

        console.log("Client's credit score updated");


    }catch(err){
        console.log(err);
    }finally{
        client.close();
    }

}


const findClientOnDataBase= async (profileId)=>{
  
  const client = await new MongoClient(process.env.MONGODB_SERVER);
  const dbName = process.env.DATABASE_NAME;
  
  try {
      await client.connect();
      const db = client.db(dbName);
      
      const clientesCollection = await db.collection("clientes")
  
      const clientes = await clientesCollection.find({Codigo:profileId}).toArray()
      
      return clientes[0];

  }catch(err){
      console.log(err)
  }

  
}





module.exports = {
    login: login,
    getAcessToken:getAcessToken,
    getAuthorizationToken:getAuthorizationToken,
    getClientDetail:getClientDetail

  };