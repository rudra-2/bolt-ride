
import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';

function App() {
  const [info, setInfo] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/info/')
      .then(res => res.json())
      .then(data => setInfo(data.message))
      .catch(() => setInfo('Could not fetch backend info'));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Welcome to Bolt Ride Partner</h1>
        <p style={{ marginTop: 20 }}>{info}</p>
      </header>
    </div>
  );
}

export default App;
