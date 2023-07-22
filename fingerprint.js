const {createHash} = require('crypto');

var userAgent = navigator.userAgent;
var screen_height = window.screen.height;
var screen_width = window.screen.width;
var timeZone = new Date().getTimezoneOffset();
var userInformation = String(userAgent) + "|" + String(screen_width) + "|" + String(screen_height) + "|" + String(timeZone);
var userHash = createHash('sha256').update(userInformation).digest('hex');
console.log(userInformation);
console.log(userHash);