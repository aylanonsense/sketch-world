//configure requirejs
requirejs.config({ baseUrl: '/' });

//execute the main class
requirejs([ 'client/Main' ], function(Main) {
	Main();
});