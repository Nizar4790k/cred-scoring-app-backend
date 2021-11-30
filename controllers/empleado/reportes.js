const { MongoClient } = require('mongodb');

const getReports= async ()=>{

    

    const client = await new MongoClient(process.env.MONGODB_SERVER);

    try {
        const dbName = process.env.DATABASE_NAME;
        await client.connect();
        console.log('Connected successfully to the database');
        const db = await client.db(dbName);
        const clientes = await db.collection("clientes");


        const top3Clientes =  await clientes.find({Status:"Enabled"},{_id:0,"FirstName":1,"MiddleName":1,"LastName":1,"CreditScore":1}).sort({ CreditScore:-1 }).limit(3).toArray();
    
        

        top3Clientes.forEach((cliente)=>{
            console.log(cliente.FirstName,cliente.CreditScore);
        
        })

        const countClientes = await clientes.aggregate([
            { "$facet": {
              "Malo": [
                { "$match" :  {$and:[{CreditScore:{$gt:0,$lt:333}}]}},
                { "$count": "Malo" },
              ],
              "Regular": [
                { "$match" : {$and:[{CreditScore:{$gt:332,$lt:667}}]}},
                { "$count": "Regular" }
              ],
              "Bueno": [
                { "$match" :  {$and:[{CreditScore:{$gt:666,$lt:1001}}]}},
                { "$count": "Bueno" }
              ]
            }},
            { "$project": {
              "malo": { "$arrayElemAt": ["$Malo.Malo", 0] },
              "regular": { "$arrayElemAt": ["$Regular.Regular", 0] },
              "bueno": { "$arrayElemAt": ["$Bueno.Bueno", 0] }
            }}

          ]).toArray();

        console.log(countClientes[0]);

        const average = await clientes.aggregate([{$match:{Status:"Enabled"}},{$group:{ _id: "_id",average_cred_score: { $avg: "$CreditScore" }}}]).toArray();
        
        return {averageCredScoring:average[0].average_cred_score};

    } catch (err) {
        console.log(err);
    } finally {
        client.close();
    }





}

module.exports = {
    getReports:getReports
}