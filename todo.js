const http = require('http');
const url = require('url');
const jsonBody = require('body/json');
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
    jsonBody(req, res, (err, requestBody) => {
      if (err) {
        controller.writeResponse(400);
        return;
      }
      controller.postHandler(res, requestBody);
    });
    break;

  case 'PATCH':
    jsonBody(req, res, (err, requestBody) => {
      if (err) {
        controller.writeResponse(400);
        return;
      }
      controller.patchHandler(res, requestBody);
    });
    break;

  case 'DELETE':
    controller.deleteHandler(res, parseInt(endPoint[1]));
    break;

  default:
    controller.writeResponse(405);
    break;
  }
});

try {
  model.initDatabase('test.db');
  server.listen(8080);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
