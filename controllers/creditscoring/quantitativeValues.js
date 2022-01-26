const axios = require('axios');

const calculateQuantitativeValues = async (access_token, auth_token) => {

    const accounts = await getClientAccounts(access_token, auth_token);
    
    const savings = { counter: 0,totalPoints: 0 };
    const current = { counter: 0,  totalPoints: 0 };
    const invesment = { counter: 0, totalPoints: 0 };
    
    const loan = { counter: 0, totalPoints: 0 ,
        payments:{goodPayments:0,badPayments:0},
        statusCount:{completed:0,inProgress:0},
        currentLoans:{totalAmount:0,totalCurrentAmount:0,totalPayments:0,payments:{goodPayments:0,badPayments:0}}
    };
    
    var nextCredit=0

    for(var i=0;i<accounts.length;i++){

        //"Savings" "CreditCard" "CurrentAccount" "EMoney" "Loan" "Mortgage" "PrePaidCard" "Investments"

        const accountId = accounts[i].Account[0].Identification;

        let amount = accounts[i].Balance[0].Amount.Amount * Number(process.env.DOLLAR_EXCHANGE_RATE);
        const accountTransactions = await getAccountsTransaction(accountId, access_token, auth_token);
        const accountType =accounts[i].AccountSubType;

        switch (accountType) {
            case "Savings":
                 
                savings.totalPoints += getSavingAccountPoints(amount,accountTransactions);
                nextCredit +=amount;
                savings.counter++;

                break;

            case "CurrentAccount":
            
                current.totalPoints += getCurrentAccountPoints(amount,accountTransactions);
                nextCredit +=amount;
                current.counter++;
                
                break;

            case "Loan":
                const options = accounts[i].Nickname; // In this line, we get the loan details.
                const status = options.split("-")[2];
                const paymentsQuatity = options.split("-")[1];

                switch(status){
                    case"completo":
                    loan.statusCount.completed++;
                    break;

                    case "actual":
                    loan.currentLoans.totalAmount += options.split("-")[3] *Number(process.env.DOLLAR_EXCHANGE_RATE);
                    loan.statusCount.inProgress++;
                    loan.currentLoans.totalCurrentAmount +=amount; 
                    loan.currentLoans.payments.goodPayments+=getGoodPayments(accountTransactions);
                    loan.currentLoans.payments.badPayments+=getBadPayments(accountTransactions);
                    loan.currentLoans.totalPayments+= parseInt(paymentsQuatity);
                    
                    break;

                }

                const service = options.split("-")[0];
         
                amount = options.split("-")[3] * Number(process.env.DOLLAR_EXCHANGE_RATE);
                loan.totalPoints += getLoansAccountPoints(amount, accountTransactions, paymentsQuatity);
                
                loan.payments.goodPayments += getGoodPayments(accountTransactions);
            

                loan.payments.badPayments += getBadPayments(accountTransactions);

                loan.counter++;

                break;

            case "Investments":

                invesment.totalPoints +=getInvesmentAccountsPoints(amount)
                nextCredit +=amount;
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
    
    if(loan.totalPoints!=0){
        loan.totalPoints = loan.totalPoints/loan.counter;
    }

    const quantitativeScoring = savings.totalPoints+ current.totalPoints+invesment.totalPoints+loan.totalPoints;
    const unPaymentProbability = (loan.payments.badPayments/(loan.payments.goodPayments+loan.payments.badPayments));

    return {
        points:quantitativeScoring,
        unPaymentProbability:unPaymentProbability,
        payments:loan.payments,
        loansQuantity:loan.counter,
        loanStatusCount: loan.statusCount,
        currentLoans:loan.currentLoans,
        nextCredit:nextCredit
    };
}

const getClientAccounts = async (access_token, auth_token) => {
    try {

        const response = await axios.get(`${process.env.FIHOGAR_ENVIRONMENT}/manage-accounts/api/2.0/accounts/?provider=${process.env.FIHOGAR_PROVIDER}`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
                "token-id": auth_token
            }
        });
        return response.data.Data.Account;

    } catch (err) {
        throw err
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

const getLoansAccountPoints = (amount,accountTransactions,paymentsQuatity)=>{
    const basePoints = 175;
    let points = 0;

    if (amount <= 100000) {
        points = basePoints * 0.35;
    } else if (amount > 100000 && amount <= 500000) {
        points = basePoints * 0.50;
    } else if (amount > 500000 && amount <= 1000000) {
        points = basePoints * 0.65;
    } else if (amount > 1000000 && amount <= 3000000) {
        points = basePoints * 0.85;
    } else {
        points = basePoints;
    }

    if (accountTransactions.length === 0) {
        points = points;

    } 
    else{
        const percentToRemove = (100 / paymentsQuatity) / 100
        
        accountTransactions.forEach(transaction => {

            if(transaction.TransactionInformation === "Incorrecto"){
                points = points * (1 - percentToRemove); 
            }
            
        });
    }

    return points;
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
    } else if (amount > 1000000 && amount <= 3000000) {
        points = basePoints * 0.85;
    } else {
        points = basePoints;
    }

    return points;
}

const getAccountsTransaction = async (accountId, access_token, auth_token) => {

    try{

        let accountTransactions = await axios.get(`${process.env.FIHOGAR_ENVIRONMENT}/manage-accounts/api/2.0/accounts/${accountId}/transactions?provider=${process.env.FIHOGAR_PROVIDER}`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
                "token-id": auth_token
            }
        });

        return accountTransactions.data.Data.Transaction;

    }catch(err){
        throw err
    }
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

const getGoodPayments= (accountTransactions)=>{
    
    let goodPayments = 0;

    accountTransactions.forEach(transaction => {

        if(transaction.TransactionInformation === "Correcto"){
            goodPayments++;
        }
    });

   return goodPayments;
}

const getBadPayments= (accountTransactions)=>{
    
    let badPayments = 0;

    accountTransactions.forEach(transaction => {

        if(transaction.TransactionInformation === "Incorrecto"){
            badPayments++;
        }
    });

   return badPayments;
}

module.exports = {
    calculateQuantitativeValues: calculateQuantitativeValues
}