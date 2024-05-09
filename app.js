const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')
app.use(express.json())

const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')
const isValid = require('date-fns/isValid')

let db = null

const initDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('The Server is running at http://localhost:3000/'),
    )
  } catch (err) {
    console.log(`Db error ${err.message}`)
    process.exit(1)
  }
}
initDbAndServer()
const convertDataToResp = dbObj => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    category: dbObj.category,
    priority: dbObj.priority,
    status: dbObj.status,
    dueDate: dbObj.due_date,
  }
}
const hasPriorAndStatusProp = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const hasPriorProp = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasStatusProp = requestQuery => {
  return requestQuery.status !== undefined
}
const hasCategoryProp = requestQuery => {
  return requestQuery.category !== undefined
}
const hasCategoryAndPriorProp = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}
const hasCategoryAndStatusProp = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}
const hasSearchProp = requestQuery => {
  return requestQuery.search_q !== undefined
}

//API 1
app.get('/todos/', async (request, response) => {
  const {search_q = '', priority, status, category} = request.query
  let data = null
  let getTodo = ''

  switch (true) {
    //1 only status
    case hasStatusProp(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodo = `SELECT * FROM todo WHERE status = '${status}';`
        data = await db.all(getTodo)
        response.send(data.map(each => convertDataToResp(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    //2 only priority
    case hasPriorProp(request.query):
      if (priority === 'LOW' || priority === 'MEDIUM' || priority === 'HIGH') {
        getTodo = `SELECT * FROM todo WHERE priority = '${priority}';`
        data = await db.all(getTodo)
        response.send(data.map(each => convertDataToResp(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    //3 priority & status
    case hasPriorAndStatusProp(request.query):
      if (priority === 'LOW' || priority === 'MEDIUM' || priority === 'HIGH') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodo = `SELECT * FROM todo WHERE 
                    priority = '${priority}' AND status = '${status}';`
          data = await db.all(getTodo)
          response.send(data.map(each => convertDataToResp(each)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    //4 only search_q
    case hasSearchProp(request.query):
      getTodo = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`
      data = await db.all(getTodo)
      response.send(data.map(each => convertDataToResp(each)))
      break
    //5 category & status
    case hasCategoryAndStatusProp(request.query):
      if (
        category === 'HOME' ||
        category === 'WORK' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodo = `SELECT * FROM todo WHERE 
                    category = '${category}' AND status = '${status}';`
          data = await db.all(getTodo)
          response.send(data.map(each => convertDataToResp(each)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    //6 only category
    case hasCategoryProp(request.query):
      if (
        category === 'HOME' ||
        category === 'WORK' ||
        category === 'LEARNING'
      ) {
        getTodo = `SELECT * FROM todo WHERE category = '${category}';`
        data = await db.all(getTodo)
        response.send(data.map(each => convertDataToResp(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    //7 category & priority
    case hasCategoryAndPriorProp(request.query):
      if (
        category === 'HOME' ||
        category === 'WORK' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'LOW' ||
          priority === 'MEDIUM' ||
          priority === 'HIGH'
        ) {
          getTodo = `SELECT * FROM todo WHERE 
                    category = '${category}' AND priority = '${priority}';`
          data = await db.all(getTodo)
          response.send(data.map(each => convertDataToResp(each)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    default:
      getTodo = `SELECT * FROM todo;`
      data = await db.all(getTodo)
      response.send(data.map(each => convertDataToResp(each)))
  }
})

//API 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getSpecTodo = `SELECT * FROM todo WHERE id =${todoId};`
  const todo = await db.get(getSpecTodo)
  response.send(convertDataToResp(todo))
})

//API 3
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (isMatch(date, 'yyyy-MM-dd')) {
    const givenDate = format(new Date(date), 'yyyy-MM-dd')
    const getDate = `SELECT * FROM todo WHERE due_date= '${givenDate}';`
    const data = await db.all(getDate)
    response.send(data.map(each => convertDataToResp(each)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

//API 4
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (priority === 'LOW' || priority === 'MEDIUM' || priority === 'HIGH') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const givenDate = format(new Date(dueDate), 'yyyy-MM-dd')
          const postTodo = `INSERT INTO todo VALUES 
                    (${id},'${todo}','${priority}','${status}','${category}','${givenDate}');`
          await db.run(postTodo)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

//API 5
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const updateCol = ''
  const reqBody = request.body

  const prevTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`
  const prevTodo = await db.get(prevTodoQuery)
  const {
    todo = prevTodo.todo,
    priority = prevTodo.priority,
    status = prevTodo.status,
    category = prevTodo.category,
    dueDate = prevTodo.dueDate,
  } = request.body
  let updateTodo

  switch (true) {
    case reqBody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        updateTodo = `UPDATE todo SET 
                todo = '${todo}',priority = '${priority}',status = '${status}',
                category = '${category}',due_date = '${dueDate}'
                WHERE id=${todoId};`
        await db.run(updateTodo)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case reqBody.priority !== undefined:
      if (priority === 'LOW' || priority === 'MEDIUM' || priority === 'HIGH') {
        updateTodo = `UPDATE todo SET 
                todo = '${todo}',priority = '${priority}',status = '${status}',
                category = '${category}',due_date = '${dueDate}'
                WHERE id=${todoId};`
        await db.run(updateTodo)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case reqBody.todo !== undefined:
      updateTodo = `UPDATE todo SET 
                todo = '${todo}',priority = '${priority}',status = '${status}',
                category = '${category}',due_date = '${dueDate}'
                WHERE id=${todoId};`
      await db.run(updateTodo)
      response.send('Todo Updated')
      break
    case reqBody.category !== undefined:
      if (
        category === 'HOME' ||
        category === 'WORK' ||
        category === 'LEARNING'
      ) {
        updateTodo = `UPDATE todo SET 
                todo = '${todo}',priority = '${priority}',status = '${status}',
                category = '${category}',due_date = '${dueDate}'
                WHERE id=${todoId};`
        await db.run(updateTodo)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case reqBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
        updateTodo = `UPDATE todo SET 
                todo = '${todo}',priority = '${priority}',status = '${status}',
                category = '${category}',due_date = '${newDueDate}'
                WHERE id=${todoId};`
        await db.run(updateTodo)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})

//API 6
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodo = `DELETE FROM todo WHERE id=${todoId};`
  await db.run(deleteTodo)
  response.send('Todo Deleted')
})
module.exports = app
