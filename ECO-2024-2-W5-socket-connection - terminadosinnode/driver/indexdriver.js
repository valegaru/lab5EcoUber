let socket = io('http://localhost:5050', { path: '/real-time' });

const currentPage = window.location.pathname;
console.log(currentPage);

// Código para `index.html` para hacer login y guardar el nombre del conductor
if (currentPage.includes('indexdriver.html')) {
	document.getElementById('loginBtndriver').addEventListener('click', () => {
		const driverName = document.getElementById('driverName').value;
		localStorage.setItem('driverName', driverName);
		console.log(driverName);

		window.location.href = 'seleccionarvehiculo.html';
	});
}

// Código para seleccionar el vehículo y guardar la imagen en localStorage
if (currentPage.includes('seleccionarvehiculo.html')) {
	document.getElementById('nextBtn').addEventListener('click', () => {
			const selectedVehicle = document.querySelector('input[name="vehicle"]:checked');
			if (selectedVehicle) {
					const vehicleInfo = selectedVehicle.value;
					const vehicleImage = selectedVehicle.getAttribute('data-img');

					// Guardar en el localStorage el vehículo seleccionado y su imagen
					localStorage.setItem('selectedVehicle', vehicleInfo);
					localStorage.setItem('vehicleImage', vehicleImage);

					window.location.href = 'estadovehiculo.html';
			} else {
					alert('Por favor selecciona un vehículo.');
			}
	});
}

// Código para mostrar el vehículo seleccionado en la página de estado del vehículo
if (currentPage.includes('estadovehiculo.html')) {
	const selectedVehicle = localStorage.getItem('selectedVehicle');
	const vehicleImage = localStorage.getItem('vehicleImage');
	const driverName = localStorage.getItem('driverName');

	if (selectedVehicle && vehicleImage) {
			// Mostrar la información del vehículo y su imagen
			document.getElementById('vehicleInfo').textContent = selectedVehicle;
			document.getElementById('vehicleImage').src = vehicleImage; // Añadir la imagen del vehículo
	}

	// Activar el vehículo
	document.getElementById('activateBtn').addEventListener('click', () => {
			const vehicleData = {
					driverName: driverName,
					vehicle: selectedVehicle,
					image: vehicleImage 
			};
			socket.emit('activateVehicle', vehicleData);
	});

	document.getElementById('deactivateBtn').addEventListener('click', () => {
			socket.emit('deactivateVehicle', driverName);
	});

	//recibe la solicitud de viaje del pasajero desde el servidor
	socket.on('newRideRequest', (rideData) => {
		console.log('New ride request received:', rideData);

		// Guarda la información del viaje en el almacenamiento local para usarla en la siguiente pantalla
		localStorage.setItem('rideData', JSON.stringify(rideData));

		window.location.href = 'infoviaje.html';
	});
}

// Código para `infoviaje.html`
if (currentPage.includes('infoviaje.html')) {
	//obtiene la informacion de rideData del localStorage y la pinta en la pantalla
	const rideData = JSON.parse(localStorage.getItem('rideData'));
	document.getElementById('originInfo').textContent = rideData.origin;
	document.getElementById('destinationInfo').textContent = rideData.destination;
	document.getElementById('passengerNameInfo').textContent = rideData.passengerName;

	//crea un ride aceptado
	document.getElementById('acceptBtn').addEventListener('click', () => {
		const driverName = localStorage.getItem('driverName');
		const selectedVehicle = localStorage.getItem('selectedVehicle');
		console.log(driverName);
		const acceptedRide = {
			id: rideData.id,
			origin: rideData.origin,
			destination: rideData.destination,
			driverName: driverName,
			passengerName: rideData.passengerName,
			vehicle: selectedVehicle,
			status: 'aceptado',
		};
		socket.emit('rideAccepted', acceptedRide);
		window.location.href = 'viajeenprogreso.html';
	});
}

// Código para `viajeenprogreso.html`
if (currentPage.includes('viajeenprogreso.html')) {
	//obtiene la informacion de rideData del localStorage y la pinta en la pantalla
	const rideData = JSON.parse(localStorage.getItem('rideData'));
	document.getElementById('originInfo').textContent = rideData.origin;
	document.getElementById('destinationInfo').textContent = rideData.destination;
	document.getElementById('passengerNameInfo').textContent = rideData.passengerName;

	//cambia el status del ride a iniciado, lo manda el servidor y cmabia el boton por finalizar viaje
	document.getElementById('startRideBtn').addEventListener('click', () => {
		rideData.status = 'iniciado';
		socket.emit('rideStarted', rideData);
		document.getElementById('startRideBtn').style.display = 'none';
		document.getElementById('endRideBtn').style.display = 'block';
	});

	//elimina el ride al hundir el boton de finalizar y redirije a otra pagina
	document.getElementById('endRideBtn').addEventListener('click', () => {
		socket.emit('rideEnded', rideData.id);
		localStorage.removeItem('rideData');
		window.location.href = 'estadovehiculo.html';
	});
}
