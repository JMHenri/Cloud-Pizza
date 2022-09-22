var querystring = require('querystring');
var http = require('http');

exports.handler = function (pizza: any, context:any, callback: any) {
var post_data = querystring.stringify(pizza);
  var post_options = {
      host: "sampleplace.com",
      port: '80',
      path: "/pizza/delivery",
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(post_data)
      }
  };

  // Set up the request, callback would for now so library imports can be avoided.
  var post_req = http.request(post_options, function(res: any) {
      res.setEncoding('utf8');
      res.on('data', function (chunk: any) {
          console.log('Response: ' + chunk);
          callback(null, true);
      });
      res.on('error', function (e: any) {
        console.log("Got error: " + e.message);
        callback(e, false);
      });
  });

  // post the data (not really)
  // post_req.write(post_data);
  // post_req.end();
  return true;
}