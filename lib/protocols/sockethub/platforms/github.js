var https = require('https'),
  fs = require('fs'),
  promising = require('promising'),
  repos = [];

function get(path, githubToken, cb) {
  var req = https.request({
    host: 'api.github.com',
    path: path+'?access_token='+githubToken,
    method: 'GET'
  }, function (res) {
    res.setEncoding('utf8');
    var str = '';
    res.on('data', function(chunk) {
      str += chunk;
    });
    res.on('end', function() {
      var obj;
      try {
        obj = JSON.parse(str);
      } catch(e) {
      }
      cb(obj);
    });
  });
  req.on('error', function(err) {
    console.log(err);
  });
  req.end();
}
function post(path, payload, githubToken, cb) {
  var req = https.request({
    host: 'api.github.com',
    path: path+'?access_token='+githubToken,
    method: 'POST'
  }, function (res) {
    res.setEncoding('utf8');
    var str = '';
    res.on('data', function(chunk) {
      str += chunk;
    });
    res.on('end', function() {
      var obj = {};
      try {
        obj = JSON.parse(str);
      } catch(e) {
      }
      console.log('completed request with statusCode', res.statusCode);
      obj.statusCode = res.statusCode;
      cb(obj);
    });
  });
  req.on('error', function(err) {
    console.log(err);
  });
  req.end(JSON.stringify(payload));
  console.log('posting', path, payload, githubToken);
}
function addRepos(reposUrl, token) {
  get(reposUrl, token, function(list) {
    for(var i=0; i<list.length; i++) {
      console.log(list[i].full_name);
    }
  });
}
function getAllRepos(userName, token) {
  get('/users/'+userName+'/orgs', function(orgs) {
    if(orgs) {
      for(var i=0; i<orgs.length; i++) {
        addRepos(orgs[i].repos_url, token);
      }
    }
  });
  addRepos('/users/'+userName+'/repos', token);
}
//getAllRepos('michielbdejong', 'asdf');
module.exports = {
  retrieve: function(job, session) {
    var promise = promising();
    get('/issues', job.credentials.token, function(list) {
      var issues = {};
      for(var i=0; i<list.length; i++) {
        var repo = list[i].repository.full_name;
        if(!issues[repo]) {
          issues[repo] = {};
        }
        issues[repo][list[i].number]=list[i];
      }
      promise.fulfill(null, issues);
    });
    return promise;
  },
  create: function(job, session) {
    var promise = promising();
    if(job.object.type=='project') {
      post('/user/repos', {
        name: job.object.name
      }, job.credentials.token, function(err, result) {
        promise.fulfill(err, result);
      });
    } else {
      promise.reject('cannot create objects of type '+job.object.type);
    }
    return promise;
  }
};
