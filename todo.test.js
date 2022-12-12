const axios = require('axios');

let task1 = {title : 'clean the room', completed : 0};

let task2 = {title : 'do the homework', completed : 0};

let modTask = {id : 1, title : 'clean the room', completed : 1};

let url = 'http://localhost:8080/todo';

beforeAll(async () => {
  await axios.post(url, task1);
  await axios.post(url, task2);
  task1.id = 1;
  task2.id = 2;
});

test('get request and post request handlers', async () => {
  let res1 = await axios.get(url)
  let res2 = await axios.get(url + '/1')
  let res3 = await axios.get(url + '/2')
  expect(res1.data).toStrictEqual([ task1, task2 ]);
  expect(res2.data).toStrictEqual(task1);
  expect(res3.data).toStrictEqual(task2);
});

test('patch request handler', async () => {
  let res = await axios.patch(url, modTask);
  expect(res.data).toStrictEqual(modTask);
});

test('test delete request handler', async () => {
  await axios.delete(url + '/1');
  await axios.delete(url + '/2');
  let res = await axios.get(url);
  expect(res.data).toStrictEqual([]);
});
