const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { validateFields, verifyPageAccess, serveSavedTodoList, serveStaticPage, notFound, registerNewUser, login, addTodo, renameTodo, deleteTodo, addTask, renameTask, toggleTaskStatus, deleteTask, methodNotAllowed } = require('./lib/handlers');

const app = express();

app.use(morgan('tiny'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.get('/', verifyPageAccess);
app.get('/index.html', verifyPageAccess);
app.get('/todoList', serveSavedTodoList);
app.get('/*', serveStaticPage);
app.get('/*', notFound);
app.post('/signUp', validateFields('userName', 'password'), registerNewUser);
app.post('/login', validateFields('userName', 'password'), login);
app.post('/addTodo', validateFields('todoTitle'), addTodo);
app.post('/renameTodo', validateFields('todoId', 'todoTitle'), renameTodo);
app.post('/deleteTodo', validateFields('todoId'), deleteTodo);
app.post('/addTask', validateFields('todoId', 'taskName'), addTask);
app.post('/renameTask', validateFields('todoId', 'taskId', 'newName'), renameTask);
app.post('/toggleTaskStatus', validateFields('todoId', 'taskId'), toggleTaskStatus);
app.post('/deleteTask', validateFields('todoId', 'taskId'), deleteTask);
app.post('/*', notFound);
app.use(methodNotAllowed);

const server = app.listen(8000);

module.exports = {server, app};
