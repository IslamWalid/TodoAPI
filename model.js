const util = require('util');
const sqlite = require('sqlite3');

let nextID = 1;
let db = null;

async function initDatabase(dbfile) {
  db = new sqlite.Database(dbfile);

  let run = util.promisify(db.run).bind(db);
  await run(
      'CREATE TABLE IF NOT EXISTS Tasks(id INT PRIMARY KEY, title VARCHAR NOT NULL, completed BOOLEAN NOT NULL)');

  let get = util.promisify(db.get).bind(db);
  let row = await get('SELECT max(id) AS maxID FROM Tasks');

  if (row.maxID) {
    nextID = row.maxID + 1;
  }
}

async function getTaskByID(id) {
  let get = util.promisify(db.get).bind(db);
  let task = await get('SELECT * FROM Tasks WHERE id = ?', id);
  if (!task) {
    throw new Error('task not found');
  }

  return task;
}

async function getAllTasks() {
  let all = util.promisify(db.all).bind(db);

  return await all('SELECT * FROM Tasks');
}

async function addTask(task) {
  let run = util.promisify(db.run).bind(db);
  await run('INSERT INTO Tasks VALUES($id, $title, $completed)', {
    $id : nextID,
    $title : task.title,
    $completed : task.completed,
  });

  return {
    id : nextID++,
    title : task.title,
    completed : task.completed,
  };
}

async function modifyTask(task) {
  await this.getTaskByID(task.id);
  let run = util.promisify(db.run).bind(db);
  await run(
      'UPDATE Tasks SET title = $title, completed = $completed WHERE id = $id',
      {
        $id : task.id,
        $title : task.title,
        $completed : task.completed,
      });

  return task;
}

async function deleteTask(id) {
  await this.getTaskByID(id);
  let run = util.promisify(db.run).bind(db);
  await run('DELETE FROM Tasks WHERE id = ?', id);
}

module.exports = {
  initDatabase,
  getTaskByID,
  getAllTasks,
  addTask,
  modifyTask,
  deleteTask,
};
