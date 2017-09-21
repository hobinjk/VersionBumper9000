const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');

const app = express();

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

app.get('/issue-comment-hook', function(req, res) {
  console.log(req.body);
  // broken broken broken no merge for you
  res.sendStatus(200);
});

const server = http.createServer(app);
server.listen(8080, function() {
  console.log('Listening on port', server.address().port);
});

