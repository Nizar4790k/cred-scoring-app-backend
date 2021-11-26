const axios = require('axios');
const calculateQuantitativeScoring = async (access_token, auth_token) => {

    const accounts = await getClientAccounts(access_token, auth_token);
    
    const savings = { counter: 0,totalPoints: 0 };
    const current = { counter: 0,  totalPoints: 0 };
    const invesment = { counter: 0, totalPoints: 0 };



    let loans = { counter: 0, type: [], completed: 0 };


    

    for(var i=0;i<accounts.length;i++){

        //"Savings" "CreditCard" "CurrentAccount" "EMoney" "Loan" "Mortgage" "PrePaidCard" "Investments"

        const accountId = accounts[i].Account[0].Identification;

        
        let amount = accounts[i].Balance[0].Amount.Amount * 58;
        const accountTransactions = await getAccountsTransaction(accountId, access_token, auth_token);
        const accountType =accounts[i].AccountSubType;

        switch (accountType) {
            case "Savings":

                savings.totalPoints += getSavingAccountPoints(amount,accountTransactions);
                savings.counter++;

                break;

            case "CurrentAccount":
            
                current.totalPoints += getCurrentAccountPoints(amount,accountTransactions);
                current.counter++;
                
                break;

            case "Loan":

                loans.counter++;
                 break;

            case "Invesments":

                invesment.totalPoints +=getInvesmentAccountsPoints(amount)
                invesment.counter++;

                break;

            default:
                break;
        }


    }

    

    if(savings.totalPoints!=0){
     savings.totalPoints = savings.totalPoints / savings.counter;
    }
    
    if(current.totalPoints!=0){
        current.totalPoints = current.totalPoints / current.counter;
    }


    if(invesment.totalPoints!=0){
        invesment.totalPoints = invesment.totalPoints/invesment.counter;
    }
    
    

    const quantitativeScoring = savings.totalPoints+ current.totalPoints+invesment.totalPoints;
    
    

    return quantitativeScoring;




}


const getClientAccounts = async (access_token, auth_token) => {
    try {
        const response = await axios.get("https://api.uat.4wrd.tech:8243/manage-accounts/api/2.0/accounts/?provider=AB4WRD", {
            headers: {
                Authorization: `Bearer ${access_token}`,
                "token-id": auth_token
            }
        });
        return response.data.Data.Account;
    } catch (err) {

        console.log(err);
    }

}

const getSavingAccountPoints = (amount,accountTransactions)=>{
    
    const basePoints = 100;
    let points = 0;

    if (amount <= 500000) {
        points = basePoints * 0.50;
    } else if (amount > 500000 && amount <= 1000000) {
        points = basePoints * 0.75;
    } else {
        points = basePoints;
    }

    if (accountTransactions.length === 0) {
        points = points * (1 - 0.50);

    } else 
    {

        let debitCreditRatio = getDebitCreditRatio(accountTransactions);



        if (debitCreditRatio <= 0.75) {
            points = points;
        } else if (debitCreditRatio > 0.75 && debitCreditRatio <= 1) {
            points = points * (1 - 0.30);
        } else if (debitCreditRatio > 1) {
            points = points * (1 - 0.60);
        } else if (debitCreditRatio === "Infinity") {
            points = points * (1 - 0.75);
        }
           

    }


    return points;
}



const getCurrentAccountPoints= (amount,accountTransactions) =>{
 
    const basePoints = 100;
    let points = 0;
    
    if (amount <= 1500) {
        points = basePoints * 0.30;
    } else if (amount > 1500 && amount <= 5000) {
        points = basePoints * 0.75;
    } else {
        points = basePoints;
    }

    if (accountTransactions.length === 0) {
        points = points * (1 - 0.50);

    } else {

        let debitCreditRatio = getDebitCreditRatio(accountTransactions);

        if (debitCreditRatio <= 0.75) {
            points = points;
        } else if (debitCreditRatio > 0.75 && debitCreditRatio <= 1) {
            points = points * (1 - 0.30);
        } else if (debitCreditRatio > 1) {
            points = points * (1 - 0.60);
        } else if (debitCreditRatio === "Infinity") {
            points = points * (1 - 0.75);
        }

    }

    return points;

}




const getLoansAccountPoints = ()=>{

}

const getInvesmentAccountsPoints = (amount)=>{
    const basePoints = 175;
    let points = 0;

    if (amount <= 100000) {
        points = invesment.basePoints * 0.35
    } else if (amount > 100000 && amount <= 500000) {
        points = basePoints * 0.50;
    } else if (amount > 500000 && amount <= 1000000) {
        points = basePoints * 0.65;
    } else if (amount > 1000000 && amount <= 300000) {
        points = basePoints * 0.85;
    } else {
        points = basePoints;
    }

    return points;

}

const getAccountsTransaction = async (accountId, access_token, auth_token) => {

    let accountTransactions = await axios.get(`https://api.uat.4wrd.tech:8243/manage-accounts/api/2.0/accounts/${accountId}/transactions?provider=AB4WRD`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
            "token-id": auth_token
        }
    });

    return accountTransactions.data.Data.Transaction;
}



const getDebitCreditRatio = (accountTransactions) => {
    let totalCredit = 0;
    let totalDebit = 0;

    accountTransactions.forEach(transaction => {

        if (transaction.CreditDebitIndicator === 'Credit') {
            totalCredit += transaction.Amount.Amount;
        } else {
            totalDebit += transaction.Amount.Amount
        }


    });

    let debitCreditRatio = totalDebit / totalCredit;

    return debitCreditRatio;
}



module.exports = {
    calculateQuantitativeScoring: calculateQuantitativeScoring
}