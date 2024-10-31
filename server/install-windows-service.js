var Service = require('node-windows').Service;

var svc = new Service({
  name: 'RIS Attendance Pro',
  description: 'Biomax attendance',
  script: 'E:\\RIS-DMCC\\timetrack\\server\\server.js'
});

// Add more event listeners for better visibility
svc.on('install', function() {
  console.log('Service install complete.');
  svc.start();
});

svc.on('alreadyinstalled', function() {
  console.log('This service is already installed.');
});

svc.on('start', function() {
  console.log('Service started successfully.');
});

svc.on('error', function(error) {
  console.error('An error occurred:', error);
});

svc.install();