/* global assertNamespace, segelschule */

require('../NamespaceUtils.js');
require('./ConsoleLogger.js');

assertNamespace('segelschule.logging');

segelschule.logging.Level = {
   DEBUG:   {value:1, description:'DEBUG'},
   INFO:    {value:2, description:'INFO'},
   WARNING: {value:3, description:'WARNING'},
   ERROR:   {value:4, description:'ERROR'},
   OFF:     {value:5, description:'OFF'}
};

var LoggingSystemImpl = function LoggingSystemImpl() {

   var logLevel = segelschule.logging.Level.WARNING;
   var loggers = [];

   this.setMinLogLevel = function setMinLogLevel(level) {
      this.logLevel = level;
      loggers.forEach(logger => logger.setMinLogLevel(level));
   };

   this.createLogger = function createLogger(name) {
      var logger = new segelschule.logging.ConsoleLogger(name, this.logLevel);
      loggers.push(logger);
      return logger;
   };
};

segelschule.logging.LoggingSystem = new LoggingSystemImpl();