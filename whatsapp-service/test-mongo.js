const mongoose = require('mongoose');
const uri = "mongodb://admin_ilham:qwerty123@ac-uesu54p-shard-00-00.j1gqtqs.mongodb.net:27017,ac-uesu54p-shard-00-01.j1gqtqs.mongodb.net:27017,ac-uesu54p-shard-00-02.j1gqtqs.mongodb.net:27017/?ssl=true&replicaSet=atlas-uesu54-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(uri)
  .then(() => {
    console.log("Connected successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection failed", err);
    process.exit(1);
  });
