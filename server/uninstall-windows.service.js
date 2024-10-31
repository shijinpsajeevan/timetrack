var Service = require('node-windows').Service;

// Create a new service object with the same configuration
var svc = new Service({
  name: 'RIS Attendance Pro',
  description: 'Biomax attendance',
  script: 'E:\\RIS-DMCC\\timetrack\\server\\server.js'
});

// Listen for the "uninstall" event
svc.on('uninstall', function() {
  console.log('Uninstall complete.');
  console.log('The service exists: ', svc.exists);
});

// Catch errors
svc.on('error', function(error) {
  console.error('An error occurred:', error);
});

// Uninstall the service
svc.uninstall();