let socket = io('http://localhost:5050', { path: '/real-time' });

// Identificar la página actual
const currentPage = window.location.pathname;

// Código para `indexclient.html`, solo el login
if (currentPage.includes('indexclient.html')) {
	document.getElementById('loginBtn').addEventListener('click', () => {
		console.log('click');
		const passengerName = document.getElementById('passengerName').value;
		localStorage.setItem('passengerName', passengerName);
		window.location.href = 'conductoresdisponibles.html';
	});
}

// Código para `conductores disponibles`
if (currentPage.includes('conductoresdisponibles.html')) {
	const requestBtn = document.getElementById('requestBtn');
	requestBtn.style.display = 'none';

	//para que aparezcan los carros desde que se carga la pagina
	socket.on('carlist', (availableCars) => {
		if (availableCars.length == 0 || availableCars == null) {
			requestBtn.style.display = 'none';
		} else {
			requestBtn.style.display = 'block';
		}
		const driverList = document.getElementById('driverList');
		driverList.innerHTML = ''; // Limpia la lista antes de actualizar
		availableCars.forEach((car) => {
			const listItem = document.createElement('li');

			const vehicleImage = document.createElement('img');
			vehicleImage.src = car.image;
			vehicleImage.alt = `Imagen de ${car.vehicle}`;
			vehicleImage.style.width = '100px';
			vehicleImage.style.height = 'auto';

			const driverInfo = document.createElement('p');
			driverInfo.textContent = `${car.driverName} - ${car.vehicle}`;

			listItem.appendChild(vehicleImage);
			listItem.appendChild(driverInfo);
			driverList.appendChild(listItem);
		});
	});
	//escucha los carros que los conductores marcan como activos, si no hay ninguno en la lista, no muestra el boton para solicitar viaje
	socket.on('updateCarList', (availableCars) => {
		if (availableCars.length == 0 || availableCars == null) {
			requestBtn.style.display = 'none';
		} else {
			requestBtn.style.display = 'block';
		}
		const driverList = document.getElementById('driverList');
		driverList.innerHTML = ''; // Limpia la lista antes de actualizar
		availableCars.forEach((car) => {
			const listItem = document.createElement('li');

			const vehicleImage = document.createElement('img');
			vehicleImage.src = car.image;
			vehicleImage.alt = `Imagen de ${car.vehicle}`;
			vehicleImage.style.width = '100px';
			vehicleImage.style.height = 'auto';

			const driverInfo = document.createElement('p');
			driverInfo.textContent = `${car.driverName} - ${car.vehicle}`;

			listItem.appendChild(vehicleImage);
			listItem.appendChild(driverInfo);
			driverList.appendChild(listItem);
		});
	});

	document.getElementById('requestBtn').addEventListener('click', () => {
		const origin = document.getElementById('origin').value;
		const destination = document.getElementById('destination').value;
		const passengerName = localStorage.getItem('passengerName');

		const rideRequest = {
			passengerName: passengerName,
			origin: origin,
			destination: destination,
		};
		//manda el origen, el destino y nombre del pasajero
		socket.emit('passengerRequest', rideRequest);

		// Oculta el formulario y muestra que esta esperando a que un conductor lo acepte
		document.getElementById('origin').style.display = 'none';
		document.getElementById('destination').style.display = 'none';
		document.getElementById('requestBtn').style.display = 'none';
		const searchingMessage = document.createElement('p');
		searchingMessage.textContent = 'Buscando viaje...';
		document.body.appendChild(searchingMessage);
	});

	socket.on('rideAssigned', (rideData) => {
		localStorage.setItem('rideInProgress', JSON.stringify(rideData));

		window.location.href = 'viajeenprogresopasajero.html';
	});
}

if (currentPage.includes('viajeenprogresopasajero.html')) {
	// Escucha cuando el viaje es iniciado y cambia el estatus en la pantalla
	socket.on('rideUpdated', (updatedRide) => {
		const rideData = JSON.parse(localStorage.getItem('rideInProgress'));
		if (updatedRide.id === rideData.id && updatedRide.status === 'iniciado') {
			// Actualizamos la interfaz del pasajero cuando el viaje ha comenzado
			document.getElementById('statusInfo').textContent = 'Viaje en curso';
		}
	});

	// Escucha cuando el viaje ha terminado
	socket.on('rideEnded', (rideId) => {
		const rideData = JSON.parse(localStorage.getItem('rideInProgress'));
		if (rideId === rideData.id) {
			window.location.href = 'conductoresdisponibles.html';
		}
	});
}
