import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import { openDB } from 'idb';
import NotificationManager from './components/NotificationManager';

function App() {
  const displayNotificationManager = 'Notification' in window
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await axios.get('http://localhost:5000/messages');
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/messages', { name, message });
      setName('');
      setMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      setShowPopup(true);
      saveLater({ name, message });
    }
  };

  const saveLater = async (body) => {
      const database = await openDB('xwitter-messages', 1, {
        upgrade(db) {
          db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
        }
      });
      await database.add('messages', body);

      const serviceWorker = await navigator.serviceWorker.ready;
      serviceWorker.sync.register('sync-new-messages');
  }

  return (
    <div className="App">
      <h1>Xwitter</h1>
      {displayNotificationManager && <NotificationManager />}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <br />
        <textarea
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        ></textarea>
        <br />
        <button type="submit">Submit</button>
      </form>
      <div className="messages">
        <h2>Messages</h2>
        {messages.map((msg) => (
          <div key={msg._id} className="message">
            <div><strong>{msg.name}</strong>: {msg.message}</div>
            <div className="date">Posted on: {new Date(msg.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
      {showPopup && (
        <div className="popup">
          <p>Message will be sent when online</p>
          <button onClick={() => setShowPopup(false)}>OK</button>
        </div>
      )}
    </div>
  );
}

export default App;
