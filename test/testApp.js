const request = require('supertest');
const sinon = require('sinon');
const session = require('../lib/sessions');
const {TodoList} = require('../lib/todoList');

const app = require('../lib/app.js');

describe('handlers', function(){
  this.beforeAll(function(){
    const isValidSIdStub = sinon.stub();
    isValidSIdStub.withArgs('testId').returns(true);
    const getSessionAttributeStub = sinon.stub();
    getSessionAttributeStub.withArgs('testId', 'userName').returns('testUserName');
    sinon.replace(session, 'addSession', sinon.stub().returns('testSId'));
    sinon.replace(session, 'isValidSId', isValidSIdStub);
    sinon.replace(session, 'getSessionAttribute', getSessionAttributeStub);
    sinon.replace(session, 'clearSession', () => {});
  });
  
  this.beforeEach(function(){
    app.locals.allTodoLists = {testUserName: TodoList.load([
      {
        'title': 'fruits',
        'id': '0',
        'tasks': [{ 'name': 'apple', 'id': '0_0', 'status': true }]
      }
    ])};
    app.locals.usersData = {userName: {password: 'password'}};
    app.locals.saveAllTodoLists = () => {};
    app.locals.saveUsersData = () => {};
  });

  after(function(){
    sinon.restore();
  });

  describe('GET', function() {
    it('/<staticFilePath> should serve the static file', function(done) {
      request(app)
        .get('/login.html')
        .expect(/Login/)
        .expect('content-type', 'text/html; charset=UTF-8')
        .expect('content-length', '753')
        .expect('date', /./)
        .expect(200, done);
    });

    it('/ should redirect to index.html', function(done) {
      request(app)
        .get('/')
        .set('cookie', '_SID=testId')
        .expect('Found. Redirecting to /index.html')
        .expect('location', '/index.html')
        .expect('content-type', 'text/plain; charset=utf-8')
        .expect('content-length', '33')
        .expect('date', /./)
        .expect(302, done);
    });

    it('/index.html should redirect to login page when not logged in', function(done) {
      request(app)
        .get('/index.html')
        .expect('Found. Redirecting to login.html')
        .expect('location', 'login.html')
        .expect('date', /./)
        .expect(302, done);
    });

    it('/index.html should give main page if user logged in', function(done) {
      request(app)
        .get('/index.html')
        .set('cookie', '_SID=testId')
        .expect(/TODO/)
        .expect('date', /./)
        .expect('content-type', 'text/html; charset=UTF-8')
        .expect('content-length', '1173')
        .expect(200, done);
    });

    it('/user/todoList should serve saved todo list as JSON', function(done) {
      request(app)
        .get('/user/todoList')
        .set('cookie', '_SID=testId')
        .expect('[{"title":"fruits","id":"0","tasks":[{"name":"apple","id":"0_0","status":true}]}]')
        .expect('content-type', 'application/json; charset=utf-8')
        .expect('content-length', '81')
        .expect('date', /./)
        .expect(200, done);
    });

    it('/user/userName should serve userName when logged in', function(done) {
      request(app)
        .get('/user/userName')
        .set('cookie', '_SID=testId')
        .expect(JSON.stringify({userName: 'testUserName'}))
        .expect('content-type', 'application/json; charset=utf-8')
        .expect('content-length', '27')
        .expect('date', /./)
        .expect(200, done);
    });

    it('/user/userName should serve unauthorized when not logged in', function(done) {
      request(app)
        .get('/user/userName')
        .expect('')
        .expect('content-length', '0')
        .expect('date', /./)
        .expect(401, done);
    });

    it('/<invalidPath> should give 404 and not found message', function(done) {
      request(app)
        .get('/invalidPath')
        .expect(/Cannot GET/)
        .expect('content-type', 'text/html; charset=utf-8')
        .expect('content-length', '150')
        .expect('date', /./)
        .expect(404, done);
    });
  });

  describe('POST', function() {

    describe('addTodo', function() {
      it('should add the specified todo when required fields are given', function(done) {
        request(app)
          .post('/user/addTodo')
          .set('cookie', '_SID=testId')
          .send({todoTitle: 'newTodo'})
          .expect('[{"title":"newTodo","id":"1","tasks":[]},{"title":"fruits","id":"0","tasks":[{"name":"apple","id":"0_0","status":true}]}]')
          .expect('content-type', 'application/json; charset=utf-8')
          .expect('content-length', '121')
          .expect('date', /./)
          .expect(200, done);
      });

      it('should response "bad request" when required fields are not given', function(done) {
        request(app)
          .post('/user/addTodo')
          .set('cookie', '_SID=testId')
          .send({})
          .expect('')
          .expect('content-length', '0')
          .expect('date', /./)
          .expect(400, done);
      });
    });

    describe('renameTodo', function() {
      it('should rename the todo title of the given id when required fields are given', function(done) {
        request(app)
          .post('/user/renameTodo')
          .set('cookie', '_SID=testId')
          .send({todoTitle: 'newName', todoId: '0'})
          .expect('[{"title":"newName","id":"0","tasks":[{"name":"apple","id":"0_0","status":true}]}]')
          .expect('content-type', 'application/json; charset=utf-8')
          .expect('content-length', '82')
          .expect('date', /./)
          .expect(200, done);
      });

      it('should response "bad request" when required fields are not given', function(done) {
        request(app)
          .post('/user/renameTodo')
          .set('cookie', '_SID=testId')
          .send({})
          .expect('')
          .expect('content-length', '0')
          .expect('date', /./)
          .expect(400, done);
      });

      it('should response "Not Acceptable(406)" when invalid todoId is given', function(done) {
        request(app)
          .post('/user/renameTodo')
          .set('cookie', '_SID=testId')
          .send({todoId: 'invalidId', todoTitle: 'name'})
          .expect('Not Acceptable')
          .expect('content-type', 'text/plain; charset=utf-8')
          .expect('content-length', '14')
          .expect('date', /./)
          .expect(406, done);
      });
    });

    describe('deleteTodo', function() {
      it('should delete the todo of the given id when required fields are given', function(done) {
        request(app)
          .post('/user/deleteTodo')
          .set('cookie', '_SID=testId')
          .send({ todoId: '0'})
          .expect('[]')
          .expect('content-type', 'application/json; charset=utf-8')
          .expect('content-length', '2')
          .expect('date', /./)
          .expect(200, done);
      });

      it('should response "bad request" when required fields are not given', function(done) {
        request(app)
          .post('/user/deleteTodo')
          .set('cookie', '_SID=testId')
          .send({})
          .expect('')
          .expect('content-length', '0')
          .expect('date', /./)
          .expect(400, done);
      });

      it('should response "Not Acceptable(406)" when invalid todoId is given', function(done) {
        request(app)
          .post('/user/deleteTodo')
          .set('cookie', '_SID=testId')
          .send({todoId: 'invalidId'})
          .expect('Not Acceptable')
          .expect('content-type', 'text/plain; charset=utf-8')
          .expect('content-length', '14')
          .expect('date', /./)
          .expect(406, done);
      });
    });

    describe('addTask', function() {
      it('should add task to the specified todo when required fields are given', function(done) {
        request(app)
          .post('/user/addTask')
          .set('cookie', '_SID=testId')
          .send({taskName: 'newTask', todoId: '0'})
          .expect('[{"title":"fruits","id":"0","tasks":[{"name":"apple","id":"0_0","status":true},{"name":"newTask","id":"0_1","status":false}]}]')
          .expect('content-type', 'application/json; charset=utf-8')
          .expect('content-length', '126')
          .expect('date', /./)
          .expect(200, done);
      });

      it('should response "bad request" when required fields are not given', function(done) {
        request(app)
          .post('/user/addTask')
          .set('cookie', '_SID=testId')
          .send({})
          .expect('')
          .expect('content-length', '0')
          .expect('date', /./)
          .expect(400, done);
      });

      it('should response "Not Acceptable(406)" when invalid todoId is given', function(done) {
        request(app)
          .post('/user/addTask')
          .set('cookie', '_SID=testId')
          .send({taskName: 'newTask', todoId: 'invalidId'})
          .expect('Not Acceptable')
          .expect('content-type', 'text/plain; charset=utf-8')
          .expect('content-length', '14')
          .expect('date', /./)
          .expect(406, done);
      });
    });

    describe('renameTask', function() {
      it('should add task to the specified todo when required fields are given', function(done) {
        request(app)
          .post('/user/renameTask')
          .set('cookie', '_SID=testId')
          .send({newName: 'mango', taskId: '0_0', todoId: '0'})
          .expect('[{"title":"fruits","id":"0","tasks":[{"name":"mango","id":"0_0","status":true}]}]')
          .expect('content-type', 'application/json; charset=utf-8')
          .expect('content-length', '81')
          .expect('date', /./)
          .expect(200, done);
      });

      it('should response "bad request" when required fields are not given', function(done) {
        request(app)
          .post('/user/renameTask')
          .set('cookie', '_SID=testId')
          .send({})
          .expect('')
          .expect('content-length', '0')
          .expect('date', /./)
          .expect(400, done);
      });

      it('should response "Not Acceptable(406)" when invalid todoId is given', function(done) {
        request(app)
          .post('/user/renameTask')
          .set('cookie', '_SID=testId')
          .send({taskId: '0_0', todoId: 'invalidId', newName: 'name'})
          .expect('Not Acceptable')
          .expect('content-type', 'text/plain; charset=utf-8')
          .expect('content-length', '14')
          .expect('date', /./)
          .expect(406, done);
      });

      it('should response "Not Acceptable(406)" when invalid taskId is given', function(done) {
        request(app)
          .post('/user/renameTask')
          .set('cookie', '_SID=testId')
          .send({taskId: 'invalidId', todoId: '0', newName: 'name'})
          .expect('Not Acceptable')
          .expect('content-type', 'text/plain; charset=utf-8')
          .expect('content-length', '14')
          .expect('date', /./)
          .expect(406, done);
      });
    });

    describe('toggleTaskStatus', function() {
      it('should add task to the specified todo when required fields are given', function(done) {
        request(app)
          .post('/user/toggleTaskStatus')
          .set('cookie', '_SID=testId')
          .send({taskId: '0_0', todoId: '0'})
          .expect('[{"title":"fruits","id":"0","tasks":[{"name":"apple","id":"0_0","status":false}]}]')
          .expect('content-type', 'application/json; charset=utf-8')
          .expect('content-length', '82')
          .expect('date', /./)
          .expect(200, done);
      });

      it('should response "bad request" when required fields are not given', function(done) {
        request(app)
          .post('/user/toggleTaskStatus')
          .set('cookie', '_SID=testId')
          .send({})
          .expect('')
          .expect('content-length', '0')
          .expect('date', /./)
          .expect(400, done);
      });

      it('should response "Not Acceptable(406)" when invalid todoId is given', function(done) {
        request(app)
          .post('/user/toggleTaskStatus')
          .set('cookie', '_SID=testId')
          .send({taskId: '0_0', todoId: 'invalidId'})
          .expect('Not Acceptable')
          .expect('content-type', 'text/plain; charset=utf-8')
          .expect('content-length', '14')
          .expect('date', /./)
          .expect(406, done);
      });

      it('should response "Not Acceptable(406)" when invalid taskId is given', function(done) {
        request(app)
          .post('/user/toggleTaskStatus')
          .set('cookie', '_SID=testId')
          .send({taskId: 'invalidId', todoId: '0'})
          .expect('Not Acceptable')
          .expect('content-type', 'text/plain; charset=utf-8')
          .expect('content-length', '14')
          .expect('date', /./)
          .expect(406, done);
      });
    });

    describe('deleteTask', function() {
      it('should delete specified task of the specified todo when required fields are given', function(done) {
        request(app)
          .post('/user/deleteTask')
          .set('cookie', '_SID=testId')
          .send({taskId: '0_0', todoId: '0'})
          .expect('[{"title":"fruits","id":"0","tasks":[]}]')
          .expect('content-type', 'application/json; charset=utf-8')
          .expect('content-length', '40')
          .expect('date', /./)
          .expect(200, done);
      });

      it('should response "bad request" when required fields are not given', function(done) {
        request(app)
          .post('/user/deleteTask')
          .set('cookie', '_SID=testId')
          .send({})
          .expect('')
          .expect('content-length', '0')
          .expect('date', /./)
          .expect(400, done);
      });

      it('should response "Not Acceptable(406)" when invalid todoId is given', function(done) {
        request(app)
          .post('/user/deleteTask')
          .set('cookie', '_SID=testId')
          .send({taskId: '0_0', todoId: 'invalidId'})
          .expect('Not Acceptable')
          .expect('content-type', 'text/plain; charset=utf-8')
          .expect('content-length', '14')
          .expect('date', /./)
          .expect(406, done);
      });

      it('should response "Not Acceptable(406)" when invalid taskId is given', function(done) {
        request(app)
          .post('/user/deleteTask')
          .set('cookie', '_SID=testId')
          .send({taskId: 'invalidId', todoId: '0'})
          .expect('Not Acceptable')
          .expect('content-type', 'text/plain; charset=utf-8')
          .expect('content-length', '14')
          .expect('date', /./)
          .expect(406, done);
      });
    });

    describe('userNameAvailability', function() {
      it('should response with uniq if uniq userName is entered', function(done) {
        request(app)
          .post('/userNameAvailability')
          .send({entered: 'uniq'})
          .expect('date', /./)
          .expect(JSON.stringify({isUniq: true}))
          .expect(200, done);
      });
      it('should response with not uniq if uniq userName is entered', function(done) {
        request(app)
          .post('/userNameAvailability')
          .send({entered: 'userName'})
          .expect('date', /./)
          .expect(JSON.stringify({isUniq: false}))
          .expect(200, done);
      });
    });

    describe('signup', function() {
      it('should register new user and log in the user and redirect to index.html', function(done) {
        request(app)
          .post('/signUp')
          .send('userName=userName2&password=password')
          .expect('date', /./)
          .expect('Set-Cookie', '_SID=testSId; Path=/')
          .expect('location', 'index.html')
          .expect(302, done);
      });

      it('should response "Not Acceptable" if given userName is already taken', function(done) {
        request(app)
          .post('/signUp')
          .send('userName=userName&password=password')
          .expect('date', /./)
          .expect('Not Acceptable')
          .expect(406, done);
      });

      it('should response "Not Acceptable" if given userName is not a valid one', function(done) {
        request(app)
          .post('/signUp')
          .send('userName=as&password=password')
          .expect('date', /./)
          .expect('Not Acceptable')
          .expect(406, done);
      });

      it('should response "Not Acceptable" if given password length is less than 4', function(done) {
        request(app)
          .post('/signUp')
          .send('userName=asas&password=pas')
          .expect('date', /./)
          .expect('Not Acceptable')
          .expect(406, done);
      });
    });

    describe('login', function() {
      it('should response with success flag true', function(done) {
        request(app)
          .post('/login')
          .send({userName: 'userName', password: 'password'})
          .expect('Set-Cookie', '_SID=testSId; Path=/')
          .expect('date', /./)
          .expect('{"isSuccessful":true}')
          .expect(200, done);
      });

      it('should redirect to login.html if invalid password is given', function(done) {
        request(app)
          .post('/login')
          .send({userName: 'userName', password: 'invalid'})
          .expect('date', /./)
          .expect('{"isSuccessful":false}')
          .expect(200, done);
      });

      it('should redirect to login.html if invalid username is given', function(done) {
        request(app)
          .post('/login')
          .send({userName: 'invalid', password: 'password'})
          .expect('date', /./)
          .expect('{"isSuccessful":false}')
          .expect(200, done);
      });
    });

    describe('logout', function() {
      it('should response with status ok', function(done) {
        request(app)
          .post('/logout')
          .set('cookie', '_SID=testId')
          .expect('date', /./)
          .expect('')
          .expect(200, done);
      });
    });

    describe('General', function(){
      it('/<invalidAction> should give 404 and not found message', function(done) {
        request(app)
          .post('/invalidAction')
          .expect(/Cannot POST/)
          .expect('content-type', 'text/html; charset=utf-8')
          .expect('content-length', '153')
          .expect('date', /./)
          .expect(404, done);
      });

      it('should response "unauthorized" for unauthorized resource access', function(done) {
        request(app)
          .get('/user/todoList')
          .expect('')
          .expect('date', /./)
          .expect(401, done);
      });
    });
  });

  describe('<not-allowedMethod>', function() {
    it('should response "cannot <methodName>" when other than valid methods is used', function(done) {
      request(app)
        .put('/path')
        .send({todoTitle: 'newTodo'})
        .expect(/Cannot PUT/)
        .expect('content-type', 'text/html; charset=utf-8')
        .expect('content-length', '143')
        .expect('date', /./)
        .expect(404, done);
    });
  });
});
