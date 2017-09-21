const fetch = require('node-fetch');
const fs = require('fs');
const token = require('./secret').token;
const util = require('util');

const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);

const mainRepo = 'new-xkit/XKit';

function execInTmp(command) {
  return exec(command, {cwd: 'tmp'});
}

function performBumps(prUrl, bumps) {
  let pr;
  return fetch(prUrl).then(function(res) {
    return res.json();
  }).then(function(prObj) {
    pr = prObj;
    return clonePR(pr);
  }).then(function() {
    for (let bump of bumps) {
      bumpVersion('tmp/' + bump.fileName, bump.newVersion);
    }
    return pushBump();
  }).then(function() {
    console.log('success!', prUrl, bumps);
  }).catch(function(err) {
    console.log('failed!', prUrl, bumps, err);
    const comment = {
      body: 'Something went wrong. Are you sure there are no ' +
            'merge conflicts?'
    };

    let commentsUrl =
      `https://api.github.com/repos/${mainRepo}/issues/${pr.number}/comments`;

    fetch(commentsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'token ' + token
      },
      body: JSON.stringify(comment)
    }).then(function() {
      console.log('Succesfully reported error!');
    }).catch(function(err) {
      console.error('Unable to report error', err);
    });
  });
}

function clonePR(pr) {
  let sshUrl = pr.head.repo.ssh_url;
  return exec(`git clone ${sshUrl} tmp`).then(function() {
    return execInTmp(`git checkout ${pr.head.ref}`);
  }).then(function() {
    return execInTmp(
      `git remote add main git@github.com:${mainRepo}.git`);
  }).then(function() {
    return execInTmp(`git fetch main`);
  }).then(function() {
    return execInTmp(`git rebase main/master`);
  });
}

function pushBump() {
  return execInTmp('git add .').then(function() {
    return execInTmp('git commit -m "Version bump!"');
  }).then(function() {
    return execInTmp('git push -f');
  }).then(function() {
    return exec('rm -fr tmp');
  });
}

function bumpVersion(fileName, newVersion) {
  // Look for //* VERSION
  const versionRegex = /^\/\/\*\s*VERSION/;

  const fileContents = fs.readFileSync(fileName, {encoding: 'utf8'});
  const lines = fileContents.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(versionRegex)) {
      lines[i] = `//* VERSION ${newVersion} **//`;
      break;
    }
  }

  fs.writeFileSync(fileName, lines.join('\n'));
}

module.exports = performBumps;
