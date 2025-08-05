import { io } from 'socket.io-client';
const socket = io('https://istokvelapp.onrender.com'); // Use your backend URL if different
export default socket;
