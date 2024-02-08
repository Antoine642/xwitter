import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const response = await axios.get('http://localhost:5000/messages');
    setMessages(response.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:5000/messages', { name, message });
    setName('');
    setMessage('');
    fetchMessages();
  };

  return (
    <div className="App">
      <h1>Xwitter</h1>
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
    </div>
  );
}

export default App;
