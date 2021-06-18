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
    const queryString = name ? ` WHERE games.name ILIKE '${name}%'` : ""
    
    try{
        const result = await connection.query(`
            SELECT games.*, categories.name AS categoryName
            FROM games JOIN categories
            ON games."categoryId" = categories.id
            ${queryString}
        `)
        res.send(result.rows)
    } catch (error){
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


//Customers route

app.get('/customers', async (req,res) => {
    const { cpf } = req.query
    const queryString = cpf ? ` WHERE name ILIKE '${cpf}%'` : ""

    try {
        const result = await connection.query('SELECT * FROM customers'+ queryString)
        res.send(result.rows)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

app.get('/customers/:id', async (req,res) => {
    const { id } = req.params

    try {
        const result = await connection.query('SELECT * FROM customers WHERE id = $1',[id])
        if(result.rows.length ===0){
            res.sendStatus(404)
            return
        }
        res.send(result.rows)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

app.post('/customers', async (req,res) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(50).required(),
        cpf: Joi.string().pattern(new RegExp('^[0-9]{11}$')).required(),
        phone: Joi.string().pattern(new RegExp('^[0-9]{10,11}$')).required(),
        birthday: Joi.date().min('01-01-1900').max('now').required()
    })

    const { name, phone, cpf, birthday } = req.body
    const { error } = schema.validate({name: name, phone: phone, cpf: cpf, birthday: birthday})
    if (error !== undefined){
        res.sendStatus(400)
        return
    }

    try{
        const result = await connection.query('SELECT * FROM customers WHERE cpf = $1',[cpf])
        if(result.rows.length !==0){
            res.sendStatus(409)
            return
        }

        await connection.query('INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)', [name, phone, cpf, birthday])

        res.send("INSERIU!!")
    } catch (error){
        console.log(error)
    }
})

app.put('/customers/:id', async (req,res) => {
    const { id } = req.params
    const schema = Joi.object({
        name: Joi.string().min(3).max(50).required(),
        cpf: Joi.string().pattern(new RegExp('^[0-9]{11}$')).required(),
        phone: Joi.string().pattern(new RegExp('^[0-9]{10,11}$')).required(),
        birthday: Joi.date().min('1-1-1900').max('now').required()
    })

    const { name, phone, cpf, birthday } = req.body
    const { error } = schema.validate({name: name, phone: phone, cpf: cpf, birthday: birthday})
    if (error !== undefined){
        res.sendStatus(400)
        return
    }

    try{
        const result = await connection.query(`
            UPDATE customers 
            SET name=$1, phone=$2, cpf=$3, birthday=$4 
            WHERE id = $5`, 
            [name, phone, cpf, birthday, id])
            
        res.sendStatus(200)    
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
});


//Rentals route

app.get('/rentals', async (req,res) => {

})

app.post('/rentals', async (req,res) => {
    const { customerId, gameId, daysRented } = req.body;
    const returnDate = null;
    const rentDate = Date.now();
    const delayFee = null;

    try {
    const price = await connection.query(`
        SELECT "pricePerDay" 
        FROM games
        WHERE id = $1
    `,[gameId])
    
    const originalPrice = price.rows[0].pricePerDay * daysRented; 
    
    const customer = await connection.query(`
        SELECT * FROM customers
        WHERE id = $1`,
        [customerId]);
    
    if(customer.rows.length !== 0){
        res.sendStatus(400)
        return
    }

    const game = await connection.query(`
        SELECT * FROM games
        WHERE id = $1`,
        [gameId]);
    
    if(game.rows.length !== 0){
        res.sendStatus(400)
        return
    }

    const result = await connection.query(`
        INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [customerId, gameId, rentDate, daysRented, returnDate, originalPrice, delayFee])

    } catch (error){
        console.log(error)
        res.sendStatus(500)
    }
})

app.post('/rentals/:id/return', async (req,res) => {
    const { id } = req.params;

    const rental = await connection.query(`
        SELECT * FROM rentals
        WHERE id = $1`,
        [id])
    
    const returnDate = Date.now()

    res.send("DEU NADA")
})

app.listen(4000, () => {
    console.log("Server running on port 4000")
});