// Requiring module
const assert = require('assert');
const qualitativeScoring = require('../controllers/creditscoring/qualitativeScoring');

const quantitativeValues = require('../controllers/creditscoring/quantitativeValues');

describe("CredScoringAppTest", () => {
    before(() => {
      console.log( "Empezando pruebas de CredScoringApp" );
    });
    
    after(() => {
      console.log( "Finalizando pruebas de CredScoringApp" );
    });
        
    // We can add nested blocks for different tests
    describe( "qualitativeScoringTest", () => {
     
      
      it("Esta retornando 34 cuando su fecha de nacimiento es 1981-06-26",()=>{
        assert.equal(34,qualitativeScoring.getAge('1987-06-26'));
      });

      it("Esta retornando 41 cuando su fecha de nacimiento es 1981-12-01",()=>{
        assert.equal(40,qualitativeScoring.getAge('1981-12-01'));
      });

      it("Esta retornando 60pts cuando la  edad es igual a 80",()=>{
          assert.equal(60,qualitativeScoring.getAgePoints(80));
      })

      it("Esta retornando 65pts cuando el estado civil es casado y el genero es Masculino", () => {
        assert.equal(65,qualitativeScoring.getMaritalStatusPoints("Married","M"));
      });
    
      it("Esta retornando 30pts cuando el cliente NO es dominicano", () => {
        assert.equal(38,qualitativeScoring.getNationalityPoints("Venezolano"));
      });


      it("Esta retornando 40pts cuando el cliente tiene una profesion de Informal", () => {
        assert.equal(40,qualitativeScoring.getProfessionPoints("Informal"));
      });
    });

    
    describe( "quantitativeScoringTest", () => {

      before(() => {
        console.log( "Empezando pruebas del modulo cuantitativo" );
      });
      
      after(() => {
        console.log( "Finalizando pruebas de cuantativo" );
      });
     
      it("Deberia retornar el 85% de los puntos totales asignados a los certificados",()=>{
        
        const basePoints = 175

        const investmentAccountPoints = quantitativeValues.getInvesmentAccountsPoints(1500000);
       
        assert.equal(basePoints*0.85,investmentAccountPoints);
      });

      it("Deberia retornar un ratio 6% como ratio de debitoCredito",()=>{
        
        const accountTransactions = [
          {CreditDebitIndicator:"Credit",Amount:{Amount:100}},
          {CreditDebitIndicator:"Debit",Amount:{Amount:6}}
          
        ]
       
        assert.equal(0.06,quantitativeValues.getDebitCreditRatio(accountTransactions));
      });

      it("Esta retornando 3 pagos correctos",()=>{
        
        

        const accountTransactions = [
          {TransactionInformation:"Correcto"},
          {TransactionInformation:"Correcto"},
          {TransactionInformation:"Correcto"},
          {TransactionInformation:"Incorrecto"}
          
        ];
        
        assert.equal(3,quantitativeValues.getGoodPayments(accountTransactions));
      });

      it("Esta retornando 2 pagos incorrectos",()=>{
        
        

        const accountTransactions = [
          {TransactionInformation:"Incorrecto"},
          {TransactionInformation:"Correcto"},
          {TransactionInformation:"Correcto"},
          {TransactionInformation:"Incorrecto"}
          
        ];
        
        assert.equal(2,quantitativeValues.getBadPayments(accountTransactions));
      });


      it("Esta retornando 70pts en la cuenta de ahorros",()=>{

        const amount = 2000000;

        const accountTransactions = [
          {CreditDebitIndicator:"Credit",Amount:{Amount:2500000}},
          {CreditDebitIndicator:"Debit",Amount:{Amount:500000}}
          
        ]

        assert(70,quantitativeValues.getSavingAccountPoints(amount,accountTransactions));

      })

      it("Esta retornando 30pts en la cuenta corriente",()=>{

        const amount = 750;

        const accountTransactions = [
          {CreditDebitIndicator:"Credit",Amount:{Amount:1000}},
          {CreditDebitIndicator:"Debit",Amount:{Amount:250}}
          
        ]

        assert(30,quantitativeValues.getSavingAccountPoints(amount,accountTransactions));

      })

     
    });

    

    /*
    describe("Test2", () => {
      beforeEach(() => {
        console.log( "executes before every test" );
      });
        
      it("Is returning 4 when adding 2 + 3", () => {
        assert.equal(2 + 3, 4);
      });
    
      it("Is returning 8 when multiplying 2 * 4", () => {
        assert.equal(2*4, 8);
      });
    });

    */
  });