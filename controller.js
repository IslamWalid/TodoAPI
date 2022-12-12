const todoDatabase = require('./model');

async function getHandler(res, endPoint) {
  let id = parseInt(endPoint[1]);

  if (!endPoint[1]) {
    let data = await todoDatabase.getAllTasks();
    writeResponse(res, 200, JSON.stringify(data));
  } else if (!isNaN(id)) {
    try {
      let data = await todoDatabase.getTaskByID(id);
      writeResponse(res, 200, JSON.stringify(data));
    } catch (err) {
      writeResponse(res, 404);
    }
  } else {
    writeResponse(res, 400);
  }
}

async function postHandler(res, task) {
  if (task.title.length === 0) {
    writeResponse(res, 400);
    return;
  }

  try {
    let addedTask = await todoDatabase.addTask(task);
    writeResponse(res, 201, JSON.stringify(addedTask));
  } catch (err) {
    writeResponse(res, 500);
  }
}

async function patchHandler(res, task) {
  try {
    let modifiedTask = await todoDatabase.modifyTask(task);
    writeResponse(res, 200, JSON.stringify(modifiedTask));
  } catch (err) {
    if (err.message === 'task not found') {
      writeResponse(res, 404);
    } else {
      writeResponse(res, 500);
    }
  }
}

async function deleteHandler(res, id) {
  try {
    if (isNaN(id)) {
      writeResponse(res, 400);
    } else {
      await todoDatabase.deleteTask(id);
      writeResponse(res, 202);
    }
  } catch (err) {
    if (err.message === 'task not found') {
      writeResponse(res, 404);
    } else {
      writeResponse(res, 500);
    }
  }
}

function writeResponse(res, statusCode, body) {
  res.statusCode = statusCode;
  if (body) {
    res.setHeader('Content-Type', 'application/json');
    res.write(body);
  }
  res.end();
}

module.exports = {
  getHandler,
  postHandler,
  patchHandler,
  deleteHandler,
  writeResponse,
};
