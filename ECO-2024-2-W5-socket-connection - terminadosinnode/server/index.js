const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.json());
app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
	path: '/real-time',
	cors: {
		origin: '*',
	},
});

const db = {
	availableCars: [],
	ongoingRides: [],
};

io.on('connection', (socket) => {
	console.log('A user connected');

	//manda los carros disponibles cuando el usuario esta conectado
	io.emit('carlist', db.availableCars);

	socket.on('activateVehicle', (car) => {
		const vehicleAlreadyActivated = db.availableCars.some((availableCar) => availableCar.driverName === car.driverName);

		if (vehicleAlreadyActivated) {
			socket.emit('vehicleAlreadyActivated', { message: 'El vehículo ya está activado.' });
			console.log('El vehículo ya está activado:', car.driverName);
		} else {
			const carWithSocket = { ...car, driverSocketId: socket.id };
			db.availableCars.push(carWithSocket);
			io.emit('updateCarList', db.availableCars);
			console.log('Vehículo activado:', db.availableCars);
		}
	});

	socket.on('deactivateVehicle', (driverName) => {
		db.availableCars = db.availableCars.filter((car) => car.driverName !== driverName);
		io.emit('updateCarList', db.availableCars);
		console.log(db.availableCars);
	});

	socket.on('passengerRequest', (requestData) => {
		console.log(
			`Ride requested by ${requestData.passengerName} from ${requestData.origin} to ${requestData.destination}`
		);

		const rideData = {
			id: Math.random().toString(36).substr(2, 9), // Genera un ID aleatorio para el viaje
			...requestData,
			driverName: '',
			selectedVehicle: '',
			status: 'pendiente',
		};

		db.ongoingRides.push(rideData);

		io.emit('newRideRequest', rideData);
	});

	socket.on('rideAccepted', (acceptedRide) => {
		const rideIndex = db.ongoingRides.findIndex((ride) => ride.id === acceptedRide.id);
		if (rideIndex > -1) {
			db.ongoingRides[rideIndex].status = 'aceptado';
			db.ongoingRides[rideIndex].driverName = acceptedRide.driverName;
			db.ongoingRides[rideIndex].selectedVehicle = acceptedRide.selectedVehicle;
			io.emit('rideAssigned', db.ongoingRides[rideIndex]);
		}
		console.log(db.ongoingRides);
	});

	socket.on('rideStarted', (rideData) => {
		const rideIndex = db.ongoingRides.findIndex((ride) => ride.id === rideData.id);
		if (rideIndex > -1) {
			db.ongoingRides[rideIndex].status = 'iniciado';
			io.emit('rideUpdated', db.ongoingRides[rideIndex]);
		}
	});

	socket.on('rideEnded', (rideId) => {
		db.ongoingRides = db.ongoingRides.filter((ride) => ride.id !== rideId);
		io.emit('rideEnded', rideId);
	});

	socket.on('disconnect', () => {
		console.log('A user disconnected');
	});
});

httpServer.listen(5050, () => {
	console.log(`Server is running on http://localhost:5050`);
});
