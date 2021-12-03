
const calculateQualitativeScoring= (profile)=>{

    let qualitativeScoring=166.66; // Gender and LegalEntityType are equals to 83.33 each one.
    
    let age = getAge(profile.DateOfBirth);
    
    qualitativeScoring +=getAgePoints(age)
  
  
    qualitativeScoring +=getMaritalStatusPoints(profile.MaritalStatus,profile.Gender);
  
  
    qualitativeScoring +=getNationalityPoints(profile.Nationality);
    
  
    qualitativeScoring +=getProfessionPoints(profile.WorkDetails[0].ProfessionName);
    
  
    return qualitativeScoring;
  
  
  }
  
  const getAge = (dateOfBirth)=>{
    return Math.floor(Math.abs((new Date()-new Date(dateOfBirth))/31557600000)); 
  }

  const getAgePoints =(age)=>{
  
    if(age<25){
      return 25;
    }else if(age>=25 && age<=30){
      return 50;
    }else if(age>30 && age<=50){
      return 83.33;
    }else if(age>50 && age<=80){
      return 60;
    }else if(age>80){
      return 30;
    }
  
  
  }
  
  const getMaritalStatusPoints = (maritalStatus,gender)=>{
  
  
    switch(maritalStatus){
      case "Single":
        return 50;
      
      case "Divorced":
        
        switch(gender){
          case "F":
            return 83.33;
          case "M":
            return 20;
        }
      
        case "Widowed":
          switch(gender){
            case "F":
              return 60;
            case "M":
              return 40;
        }
  
        case "Partner":
          return 45;
        
        case "Married":
          return 65;
        
        default:
          return 15;
    }
  
  
  }
  
  const getNationalityPoints = (nationality)=>{
  
    if(nationality==="Dominicano"){
      return 83.33
    }else{
      return 38
    }
  
  }
  
  const getProfessionPoints = (profesionName)=>{
  
    switch(profesionName){
      case "Contador":
        return 65
      case "Profesor":
        return 75
      case "Doctor":
        return 83.33
      case "Policia":
        return 10;
      case "Militar":
        return 20;
      case "Ingeniero":
        return 70;
      case "Arquitecto":
        return 80;
      case "Funcionario Publico":
        return 50;
      case "Administrador":
        return 55
      case "Informal":
        return 40;
      case "Ninguna":
        return 0;
      default:
        return 35
      
    }
  
  }


module.exports = {
  calculateQualitativeScoring:calculateQualitativeScoring,
  getAgePoints:getAgePoints,
  getMaritalStatusPoints:getMaritalStatusPoints,
  getNationalityPoints:getNationalityPoints,
  getProfessionPoints:getProfessionPoints,
  getAge:getAge
  
};
