const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()

app.use(express.json())

const customers = []

function verifyIfExistsAccountCPF(request, response, next){
    const { cpf } = request.headers

    const findCustomers = customers.find(( customer ) => {
        return customer.cpf === cpf
    })

    if(!findCustomers){
        return response.status(400).json({
            error: 'customer not found'
        })
    }

    request.customer = findCustomers
    
    return next()
}

function getBalance(statement){
    const balance = statement.reduce((accumulator, operation) => {
        if(operation.type === 'credit'){
            return accumulator + Number(operation.amount)
        }else {
            return accumulator - Number(operation.amount)
        }
    }, 0)

    return balance
}

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {

    const { customer } = request
    
    return response.status(200).json(customer.statement)
   
})

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
    const { amount, description } = request.body

    const { customer } = request

    const statementOperation = {
        amount,
        description,
        createdAt: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation)

    return response.status(201).send()
})

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body

    const { customer } = request

    const balance = getBalance(customer.statement)

    if(amount <= 0)
        return response.status(401).json({ error: "Value incorrect !" })

    if(amount > balance)
        return response.status(401).json({ error: "Insufficient funds!" })

    const statementOperation = {
        amount,
        createdAt: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation)

    return response.status(201).send()
})

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {

    const { date } = request.query

    const { customer } = request

    const dateFormat = new Date(date + " 00:00")


    const statements = customer.statement.filter((statement) => {
        return statement.createdAt.toDateString() === new Date(dateFormat).toDateString()
    })
    
    return response.status(200).json(statements)
   
})

app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request

    return response.status(200).json(customer)
})

app.post('/account', (request, response) => {
    const { name, cpf } = request.body

    const customerAlreadyExists = customers.some(( customer ) => {
        return customer.cpf === cpf
    })

    if(customerAlreadyExists){
        return response.status(400).json({
            error: 'Customer already exists ! 🧐'
        })
    }  

    customers.push({
        id: uuidv4(),
        name,
        cpf,
        statement: []
    })

    return response.status(201).send()
})

app.put("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { name } = request.body

    const { customer } = request

    customer.name = name

    return response.status(201).send()
})

app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request

    customers.splice(customer, 1)

    return response.status(200).json(customers)
})

app.get("/balance", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request

    const balance = getBalance(customer.statement)

    return response.status(200).json({ total: balance })
})

app.listen(3333, () => {
    console.log('Server success run 🚀')
})