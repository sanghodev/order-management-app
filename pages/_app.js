import { useEffect } from 'react';
import { io } from 'socket.io-client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import '../styles/globals.css';

let socket;

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    socket = io();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return (
    <div>
      <nav>
        <ul>
          <li className={router.pathname === '/' ? 'active' : ''}>
            <Link href="/">Home</Link>
          </li>
          <li className={router.pathname === '/status' ? 'active' : ''}>
            <Link href="/status">Status</Link>
          </li>
          <li className={router.pathname === '/sales' ? 'active' : ''}>
            <Link href="/sales">Sales</Link>
          </li>
          <li className={router.pathname === '/design' ? 'active' : ''}>
            <Link href="/design">Design</Link>
          </li>
          
          <li className={router.pathname === '/print1' ? 'active' : ''}>
            <Link href="/print1">Print1</Link>
          </li>
          <li className={router.pathname === '/print2' ? 'active' : ''}>
            <Link href="/print2">Print2</Link>
          </li>
          <li className={router.pathname === '/press' ? 'active' : ''}>
            <Link href="/press">Press</Link>
          </li>
          <li className={router.pathname === '/complete' ? 'active' : ''}>
            <Link href="/complete">Complete</Link>
          </li>
        </ul>
      </nav>
      <Component {...pageProps} socket={socket} />
    </div>
  );
}

export default MyApp;
