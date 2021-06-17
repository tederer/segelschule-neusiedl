/* global assertNamespace, segelschule */

require('../NamespaceUtils.js');
require('./Logger.js');

assertNamespace('segelschule.logging');

/**
 * ConsoleLogger writes the log output to the console.
 */
segelschule.logging.ConsoleLogger = function ConsoleLogger(name, minLogLevel) {
   
   var MESSAGE_SEPARATOR = ';';
   var logLevel = minLogLevel;

   var formatNumber = function formatNumber(expectedLength, number) {
      var result = number.toString();
      while(result.length < expectedLength) {
         result = '0' + result;
      }
      return result;
   };

   var log = function log(level, messageOrSupplier) {
      if (level.value >= logLevel.value) {
         var timestamp = (new Date()).toISOString();
         var message = typeof messageOrSupplier === 'function' ? messageOrSupplier() : messageOrSupplier;
         console.log([timestamp, name, level.description, message].join(MESSAGE_SEPARATOR));
      }
   };

   this.setMinLogLevel = function setMinLogLevel(minLogLevel) {
      logLevel = minLogLevel;
   };

   this.logDebug = function logDebug(messageOrSupplier) {
      log(segelschule.logging.Level.DEBUG, messageOrSupplier);
   };
	
	this.logInfo = function logInfo(messageOrSupplier) {
      log(segelschule.logging.Level.INFO, messageOrSupplier);
   };
	
	this.logWarning = function logWarning(messageOrSupplier) {
      log(segelschule.logging.Level.WARNING, messageOrSupplier);
   };
	
	this.logError = function logError(messageOrSupplier) {
      log(segelschule.logging.Level.ERROR, messageOrSupplier);
   };
};

segelschule.logging.ConsoleLogger.prototype = new segelschule.logging.Logger();