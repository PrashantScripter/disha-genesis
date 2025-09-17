import "dotenv/config";
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser';
import counselorRoutes from './routes/counselorRoutes.js' 

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('created the server')
})

app.use('/api/chat', counselorRoutes);

app.listen(PORT, () => {
    console.log(`SERVER IS RUNNING AT ${PORT}`)
})