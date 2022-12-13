const http = require('http');
const url = require('url');
const controller = require('./controller');
const model = require('./model')

let server = http.createServer((req, res) => {
  let endPoint = url.parse(req.url).path.slice(1).split('/');

  if (endPoint[0] !== 'todo') {
    controller.writeResponse(400);
    return;
  }

  switch (req.method) {
    case 'GET':
      controller.getHandler(res, endPoint);
      break;

    case 'POST':
      controller.postHandler(req, res);
      break;

    case 'PATCH':
      controller.patchHandler(req, res);
      break;

    case 'DELETE':
      controller.deleteHandler(res, parseInt(endPoint[1]));
      break;

    default:
      controller.methodNotAllowedHandler(res);
      break;
  }
});

let port = '8080';
let dbfile = 'dbfile.db';

if (process.env.PORT) {
  port = process.env.PORT;
}

if (process.env.DB_FILE) {
  dbfile = process.env.DB_FILE;
}

try {
  model.initDatabase(dbfile);
  server.listen(port);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
