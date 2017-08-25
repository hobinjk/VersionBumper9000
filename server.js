const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const performBumps = require('./transform');

const app = express();

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

app.post('/issue-comment-hook', function(req, res) {
  res.sendStatus(200);

  if (!req.body.issue.pull_request) {
    return;
  }

  let comment = req.body.comment.body;
  let vbRegex = /!vb\s+(\S+)\s+(\S+)/g;
  let bumps = [];
  while (true) {
    let matches = vbRegex.exec(comment);
    if (!matches) {
      break;
    }
    let fileName = matches[1];
    if (fileName[0] == '"') {
      // Trim enclosing quotes
      fileName = fileName.substr(1, fileName.length - 2);
    }
    let newVersion = matches[2];

    bumps.push({
      fileName: fileName,
      newVersion: newVersion
    });
  }

  if (!bumps) {
    return;
  }

  let prUrl = req.body.issue.pull_request.url;

  performBumps(prUrl, bumps);
});

const server = http.createServer(app);
server.listen(8080, function() {
  console.log('Listening on port', server.address().port);
});

