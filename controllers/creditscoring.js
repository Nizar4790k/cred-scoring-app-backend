const axios = require('axios');
const calculateCreditScoring= (req,res)=>{

    const profileId = req.body.profileId;
    
    
    const response = axios.get(`https://api.4wrd.tech:8243/manage-profile/api/2.0/profile/${profileId}`,{headers:{
        Authorization: 'authorize',
        "token-id":'token-id'

      }})
      
    



    return 0;
}

module.exports = {
  calculateCreditScoring: calculateCreditScoring,
  
};