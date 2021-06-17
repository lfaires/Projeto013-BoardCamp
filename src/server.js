import express from 'express'
import cors from 'cors'
import pg from 'pg'
import Joi from 'joi'

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

//Categories Route

app.get('/categories', async (req,res) => {
    try {
        const result = await connection.query('SELECT * FROM categories')
        res.send(result.rows)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

app.post('/categories', async (req,res) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(20)});

    const { name } = req.body;  
    const { error } = schema.validate({name: name});
    if (error !== undefined){
        res.sendStatus(400)
        return
    }

    try {
        const result = await connection.query('SELECT * FROM categories WHERE name = $1', [name])
        if(result.rows.length !== 0){
            res.sendStatus(409)
            return
        }
        await connection.query('INSERT INTO categories (name) VALUES ($1)',[name])
        res.sendStatus(201)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

//Games route

app.get('/games', async (req,res) => {
    const { name } = req.query
    const queryString = name ? ` WHERE name ILIKE '${name}%'` : ""
    
    try {
        const result = await connection.query('SELECT * FROM games'+ queryString)
        res.send(result.rows)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

app.post('/games', async (req,res) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(30),
        stockTotal: Joi.number().greater(0),  
        pricePerDay: Joi.number().greater(0),
    });

    const { name, image, stockTotal, categoryId, pricePerDay } = req.body;
    const { error } = schema.validate({name: name, stockTotal: stockTotal, pricePerDay: pricePerDay}); 
    console.log(error) 
    if (error !== undefined){
        res.sendStatus(400)
        return
    }

    try{
        const result = await connection.query('SELECT * FROM categories WHERE id = $1', [categoryId])
        console.log(result)
        if(result.rows.length === 0){
            res.sendStatus(409)
            return
        }
        await connection.query('INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)',[name, image, stockTotal, categoryId, pricePerDay])
        res.sendStatus(201)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

app.listen(4000, () => {
    console.log("Server running on port 4000")
});