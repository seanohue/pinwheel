'use strict';

const Telnet = require('ranvier-telnet');
const TelnetStream = require('../lib/TelnetStream');

module.exports = srcPath => {
  const Data = require(srcPath + 'Data');
  const Logger = require(srcPath + 'Logger');

  return {
    listeners: {
      startup: state => function (commander) {
        /**
        * Effectively the 'main' game loop but not really because it's a REPL
        */
        let server = new Telnet.TelnetServer(rawSocket => {
          let telnetSocket = new Telnet.TelnetSocket();
          telnetSocket.attach(rawSocket);
          telnetSocket.telnetCommand(Telnet.Sequences.WILL, Telnet.Options.OPT_EOR);

          const banned = Data.parseFile(srcPath + '/../data/banned.json');
          if (banned.includes(telnetSocket.address().address)) {
            return telnetSocket.destroy();
          }

          const stream = new TelnetStream();
          stream.attach(telnetSocket);

          stream.on('interrupt', () => {
            stream.write("\n*interrupt*\n");
          });

          stream.on('error', err => {
            if (err.errno === 'EPIPE') {
              return Logger.error('EPIPE on write. A websocket client probably connected to the telnet port.');
            }

            Logger.error(err);
          });

          // Register all of the input events (login, etc.)
          state.InputEventManager.attach(stream);

          stream.write("Establishing telnet connection...\n");
          Logger.log("New telnet client connected...");

          // @see: bundles/ranvier-events/events/login.js
          stream.emit('intro', stream);
        }).netServer;

        // Start the server and setup error handlers.
        server.listen(commander.port).on('error', err => {
          if (err.code === 'EADDRINUSE') {
            Logger.error(`Cannot start server on port ${commander.port}, address is already in use.`);
            Logger.error("Do you have a MUD server already running?");
          } else if (err.code === 'EACCES') {
            Logger.error(`Cannot start server on port ${commander.port}: permission denied.`);
            Logger.error("Are you trying to start it on a priviledged port without being root?");
          } else {
            Logger.error("Failed to start MUD server:");
            Logger.error(err);
          }
          process.exit(1);
        });

        Logger.log(`Telnet server started on port: ${commander.port}...`);
      },

      shutdown: state => function () {
      },
    }
  };
};
