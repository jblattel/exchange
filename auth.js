var qs = require('querystring');
var url = require('url');
var rewriteModule = require('http-rewrite-middleware');
var request = require('request');

module.exports = {
  init: function (options) {
    options = options || {}
    this.clientId = options.clientId || 'predix-seed';
    this.serverUrl = options.serverUrl || 'https://etc.predix-uaa-staging.grc-apps.svc.ice.ge.com';
    this.accessToken = null;
    this.defaultClientRoute = options.defaultClientRoute || '/about';
    this.base64ClientCredential = options.base64ClientCredential || 'cHJlZGl4LXNlZWQ6TTBhVzdrTmZRRndyTTZ3ZHJpV2h3bVc2ck1HQ045Q0x1cnI5VnI3elc0cz0=';
    this.user = null;
    return this.getMiddlewares();
  },
  getAccessTokenFromCode: function (authCode, successCallback, errorCallback) {
    var request = require('request');
    var self = this;
    var options = {
      method: 'POST',
      url: this.serverUrl + '/oauth/token',
      form: {
        'grant_type': 'client_credentials',
        'redirect_uri': 'http://localhost:9000/index.html',
        'state': this.defautClientRoute
      },
      headers: {
        'Authorization': 'Basic ' + this.base64ClientCredential
      }
    };

    request(options, function (err, response, body) {
      if (!err && response.statusCode == 200) {
        var res = JSON.parse(body);
        self.accessToken = res.token_type + ' ' + res.access_token;
        //get user info
        request({
          method: 'post',
          url: self.serverUrl + '/check_token',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + self.base64ClientCredential
          },
          form: {
            'token': res.access_token
          }
        }, function (error, response, body) {
          self.user = JSON.parse(body);
          successCallback(self.accessToken);
        });
      }
      else {
          errorCallback(err, response, body);
      }
    });
  },
  getMiddlewares: function () {
    //get access token here
    var middlewares = [];
    var uaa = this;
    var rewriteMiddleware = rewriteModule.getMiddleware([
        {
          from: '^/login(.*)$',
          to: '/index.html',
          redirect: 'permanent'
        }
      ]
    );

//    middlewares.push(function (req, res, next) {
//        var params = url.parse(req.url, true).query;
//        console.log(params, "params");
//        uaa.getAccessTokenFromCode(params.code, function (token) {
//          console.log('uaa access token: ', token);
//          params.state = params.state || '/about';
//          console.log(req._parsedUrl,"req._parsedUrl");
//          console.log(params.state,"params.state");
//          var url = req._parsedUrl.pathname.replace("/login", "");
//          res.statusCode = 301;
//          res.setHeader('Location', url);
//          res.end();
//        }, function (err) {
//          console.error('error getting access token: ', err);
//          next(err);
//        });
//    });

    middlewares.push(rewriteMiddleware);

    return middlewares;
  },
  hasValidSession: function () {
    return !!this.accessToken;
  },
  deleteSession: function () {
    this.accessToken = null;
  }
}
