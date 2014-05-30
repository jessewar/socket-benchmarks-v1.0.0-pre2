var server = require('http').Server();
var Benchmark = require('benchmark');
var ioc = require('socket.io-client');
var io = require('socket.io')(server, {
  transports: ['polling', process.argv[2]] // need polling for initial transport
});
var version = "1.0.0";

// creates a socket.io client for the given server
function client(srv, nsp, opts) {
  if ('object' == typeof nsp) {
    opts = nsp;
    nsp = null;
  }
  var addr = srv.address();
  if (!addr) addr = srv.listen().address();
  var url = 'ws://' + addr.address + ':' + addr.port + (nsp || '');
  return ioc.connect(url, opts);
}


io.sockets.on('connection', function (socket) {
  function jsonRoundtrip(deferred) {
    socket.emit('server-message', {
      name: "Server"
    });
    socket.on('client-message', function (data) {
      deferred.resolve();
      socket.removeAllListeners('client-message');
    });
  }

  var options = {
    onStart: function () {
      console.log("Testing SocketIO v" + version + " using " + process.argv[2] + "...");
    },
    onComplete: function () {
      console.log("Mean time for JSON message from server to client back to server: " + this.stats.mean + "\n" +
                  "Number of trips per second: " + this.hz);
      process.exit();
    },
    defer: true,
    async: true
  };
  var bench = new Benchmark('roundtrip', jsonRoundtrip, options);
  bench.run();
});

function run() {
  // connect to server triggering benchmark to start
  var clientSocket = client(server);
  clientSocket.on('server-message', function (data) {
    clientSocket.emit('client-message', data);
  })
}

exports.run = run;
