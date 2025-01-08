require('dotenv').config()
const express = require('express');
const cors = require('cors');
const jwt =  require('jsonwebtoken')
const app = express();
const port = process.env.PORT || 5000
//midle ware
app.use(cors())
app.use(express.json())

//db conection string
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASSWORAD}@cluster0.u5q3a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;




// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const menuCollection = client.db('resturant').collection('menu')
    const reviewCollection = client.db('resturant').collection('review')
    const cartCollection = client.db('resturant').collection('cart')
    const userCollection = client.db('resturant').collection('user')


    // jwt post related
    app.post('/jwt',async(req,res)=>{
      const user = req.body
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})

      res.send({token})
    
    })
    //verify token
    const verifyToken = (req, res, next) => {
      // console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }
     // use verify admin after verifyToken
     const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      
      if(!user)   return res.status(403).send({ message: 'forbidden access' });
      
      
      next();
    }
    //menu post api
    app.post('/menus', async(req,res)=>{
      const menuItem = req.body;
      const result = await menuCollection.insertOne(menuItem);
      res.send(result)
    })
    //menu get api
    app.get('/menus', async(req,res)=>{
        const result =  await menuCollection.find().toArray()
        res.send(result)
    })
    //menu get by id
    app.get('/menus/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id:id }
      const result = await menuCollection.findOne(query);
      res.send(result);
    })
    //review get api
    app.get('/reviews', async(req,res)=>{
        const result = await reviewCollection.find().toArray();
        res.send(result)
    })
   //post cart
   app.post('/carts',verifyToken, async(req,res)=>{
    const query = req.body
    const result = await cartCollection.insertOne(query)
    res.send(result)
    console.log(query)
   })

   // get cart by query email
   app.get('/carts',async(req,res)=>{
    const email = req.query.email;
    const query ={email:email};
    const result = await cartCollection.find(query).toArray()
    res.send(result)
   })
    
   //delete cart by id
   app.delete('/carts/:id',async(req,res)=>{
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)};
    const result =  await cartCollection.deleteOne(filter);
    res.send(result)
   })

   // post users  api
   app.post('/users', async(req,res)=>{
    const user = req.body;
    const query = {email: user.email}
    const existingUser  = await userCollection.findOne(query);
    if(existingUser){
      return res.send({message:'user already exists',insertedId:null})
    }
    const result = await userCollection.insertOne(user)
    res.send(result)
  })

  app.get('/users/admin/:email', verifyToken, async (req, res) => {
    const email = req.params.email;

    if (email !== req.decoded.email) {
      return res.status(403).send({ message: 'forbidden access' })
    }

    const query = { email: email };
    const user = await userCollection.findOne(query);
    let admin = false;
    if (user) {
      admin = user?.role === 'admin';
    }
    res.send({ admin });
  })
    // get users api
    app.get('/users', verifyToken,verifyAdmin, async(req,res)=>{
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    //patch user admin role in users
   
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id)};
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    //delete users api
    app.delete('/users/:id', async(req,res)=>{
      const id = req.params.id;
      const query = { _id: new ObjectId(id)};
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })
   
  }



  
   finally {
   
  }
}
run().catch(console.dir);

app.get('/', (req,res)=>{
    res.send('is running.........................')
})
app.listen(port,()=>{
    console.log(`this is run is ${port}`)
})

