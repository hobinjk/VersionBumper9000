const fetch = require('node-fetch');
const fs = require('fs');
const util = require('util');

const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);

function execInTmp(command) {
  return exec(command, {cwd: 'tmp'});
}

function performBumps(prUrl, bumps) {
  clonePR(prUrl).then(function() {
    for (let bump of bumps) {
      bumpVersion('tmp/' + bump.fileName, bump.newVersion);
    }
    return pushBump();
  }).then(function() {
    console.log('success!', prUrl, bumps);
  }).catch(function(err) {
    console.log('failed!', prUrl, bumps, err);
  });
}

function clonePR(prUrl) {
  let pr = null;
  return fetch(prUrl).then(function(res) {
    return res.json();
  }).then(function(prObj) {
    pr = prObj;
    let sshUrl = pr.head.repo.ssh_url;
    return exec(`git clone ${sshUrl} tmp`);
  }).then(function() {
    return execInTmp(`git checkout ${pr.head.ref}`);
  }).then(function() {
    return execInTmp(`git remote add new-xkit git@github.com:new-xkit/XKit.git`);
  }).then(function() {
    return execInTmp(`git fetch new-xkit`);
  }).then(function() {
    return execInTmp(`git rebase new-xkit master`);
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
