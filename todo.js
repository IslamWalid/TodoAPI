const sqlite = require('sqlite3');
const http = require('http');
const url = require('url');
const util = require('util');
const jsonBody = require('body/json');

class TodoDatabase {
  #nextID = 1;
  #dbfile = null;
  #db = null;

  constructor(dbfile) {
    this.#nextID = 1;
    this.#dbfile = dbfile;
    this.#db = null;
  }

  async initDatabase() {
    let db = new sqlite.Database(this.#dbfile);

    let run = util.promisify(db.run).bind(db);
    await run(
        'CREATE TABLE IF NOT EXISTS Tasks( id INT PRIMARY KEY, title VARCHAR NOT NULL, completed BOOLEAN NOT NULL)');

    let get = util.promisify(db.get).bind(db);
    let row = await get('SELECT max(id) AS maxID FROM Tasks');

    this.#db = db;
    if (row.maxID) {
      this.#nextID = row.maxID + 1;
    }
  }

  async getTaskByID(id) {
    let get = util.promisify(this.#db.get).bind(this.#db);
    let task = await get('SELECT * FROM Tasks WHERE id = ?', id);
    if (!task) {
      throw new Error('task not found');
    }

    return task;
  }

  async getAllTasks() {
    let all = util.promisify(this.#db.all).bind(this.#db);

    return await all('SELECT * FROM Tasks');
  }

  async addTask(task) {
    let run = util.promisify(this.#db.run).bind(this.#db);
    await run('INSERT INTO Tasks VALUES($id, $title, $completed)', {
      $id : this.#nextID,
      $title : task.title,
      $completed : task.completed,
    });

    return {
      id : this.#nextID++,
      title : task.title,
      completed : task.completed,
    };
  }

  async modifyTask(task) {
    await this.getTaskByID(task.id);
    let run = util.promisify(this.#db.run).bind(this.#db);
    await run(
        'UPDATE Tasks SET title = $title, completed = $completed WHERE id = $id',
        {
          $id : task.id,
          $title : task.title,
          $completed : task.completed,
        });

    return task;
  }

  async deleteTask(id) {
    await this.getTaskByID(id);
    let run = util.promisify(this.#db.run).bind(this.#db);
    await run('DELETE FROM Tasks WHERE id = ?', id);
  }
}

class Controller {
  #todoDatabase = null;
  #responseWriter = null;

  constructor(todoDatabase, responseWriter) {
    this.#todoDatabase = todoDatabase;
    this.#responseWriter = responseWriter;
  }

  async getHandler(id) {
    let data = null;
    try {
      if (id === undefined) {
        data = await this.#todoDatabase.getAllTasks();
      } else if (!isNaN(id)) {
        data = await this.#todoDatabase.getTaskByID(id);
      } else {
        this.#writerResponse(400);
        return;
      }
      this.#writerResponse(200, JSON.stringify(data));
    } catch (err) {
      this.#writerResponse(404);
    }
  }

  async postHandler(task) {
    if (task.title.length === 0) {
      this.#writerResponse(400);
      return;
    }

    try {
      let addedTask = await this.#todoDatabase.addTask(task);
      this.#writerResponse(201, JSON.stringify(addedTask));
    } catch (err) {
      this.#writerResponse(500);
    }
  }

  async patchHandler(task) {
    try {
      let modifiedTask = await this.#todoDatabase.modifyTask(task);
      this.#writerResponse(200, JSON.stringify(modifiedTask));
    } catch (err) {
      if (err.message === 'task not found') {
        this.#writerResponse(404);
      } else {
        this.#writerResponse(500);
      }
    }
  }

  async deleteHandler(id) {
    try {
      if (isNaN(id)) {
        this.#writerResponse(400);
      } else {
        await this.#todoDatabase.deleteTask(id);
        this.#writerResponse(200);
      }
    } catch (err) {
      if (err.message === 'task not found') {
        this.#writerResponse(404);
      } else {
        this.#writerResponse(500);
      }
    }
  }

  #writerResponse(statusCode, body) {
    this.#responseWriter.statusCode = statusCode;
    if (body) {
      this.#responseWriter.setHeader('Content-Type', 'application/json');
      this.#responseWriter.write(body);
    }
    this.#responseWriter.end();
  }
}

async function start(port, dbfile) {
  let todo = new TodoDatabase(dbfile);
  try {
    await todo.initDatabase();
  } catch (err) {
    throw err;
  }

  let server = http.createServer((request, response) => {
    let controller = new Controller(todo, response);
    let endPoint = url.parse(request.url).path.slice(1).split('/');

    if (endPoint[0] !== 'todo') {
      response.statusCode = 400;
      response.end();
      return;
    }

    switch (request.method) {
    case 'GET':
      if (endPoint[1]) {
        controller.getHandler(parseInt(endPoint[1]));
      } else {
        controller.getHandler();
      }
      break;

    case 'POST':
      jsonBody(request, response, (err, requestBody) => {
        if (err) {
          response.statusCode = 400;
          response.end();
          return;
        }
        controller.postHandler(requestBody);
      });
      break;

    case 'PATCH':
      jsonBody(request, response, (err, requestBody) => {
        if (err) {
          response.statusCode = 400;
          response.end();
          return;
        }
        controller.patchHandler(requestBody);
      });
      break;

    case 'DELETE':
      controller.deleteHandler(parseInt(endPoint[1]));
      break;

    default:
      response.statusCode = 405;
      response.end();
      break;
    }
  });

  server.listen(port);
}

try {
  start(8080, './test.db');
} catch (err) {
  console.error(err.message);
}
