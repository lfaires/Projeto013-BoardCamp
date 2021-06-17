import express from 'express'
import cors from 'cors'
import pg from 'pg'

const app = express();

app.use(express.json());
app.use(cors());

const { Pool } = pg;

const connection = new Pool({
    user: 'bootcamp_role',
    password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
    host: 'localhost',
    port: 5432,
    database: 'boardcamp'
});

app.listen(4000, () => {
    console.log("Server running on port 4000")
});