import { useEffect } from 'react';
import { io } from 'socket.io-client';
import '../styles/globals.css';

let socket;

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    socket = io();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return <Component {...pageProps} socket={socket} />;
}

export default MyApp;
