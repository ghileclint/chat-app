import { useState } from "react";
import "./App.css";
import { useEffect } from "react";

function App() {
  const [socket, setSocket] = useState(null); // connection for each user
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState(
    sessionStorage.getItem("chatUsername") || "",
  );
  
  const [joined, setJoined] = useState(
    !!sessionStorage.getItem("chatUsername"),
  );
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userId, setUserId] = useState(
    sessionStorage.getItem("chatUserId") || null,
  );

  useEffect(() => {
    if (!joined) return;

    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
      console.log("Connected to server");

      setSocket(ws);

      ws.send(
        JSON.stringify({
          type: "join",
          username: username,
          userId: sessionStorage.getItem("chatUserId"),
        }),
      );
    };

    ws.onmessage = (event) => {
      console.log("Message Received:", event.data);

      const receivedMessage = JSON.parse(event.data);

      // current user's info
      if (receivedMessage.type === "user-info") {
        setUserId(receivedMessage.userId);

        sessionStorage.setItem("chatUserId", receivedMessage.userId);
        return;
      }

      // chat history
      if (receivedMessage.type === "history") {
        setMessages(receivedMessage.messages);
        return;
      }

      // online users
      if (receivedMessage.type === "users") {
        setOnlineUsers(receivedMessage.users);
        return;
      }

      setMessages((prevMessages) => [...prevMessages, receivedMessage]);
    };

    ws.onclose = () => {
      console.log("Disconnected from server");
    };

    return () => {
      ws.close();
    };
  }, [joined]);

  const joinChat = () => {
    if (username.trim() === "") return;

    sessionStorage.setItem("chatUsername", username);

    setJoined(true);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    if (message.trim() === "") return;

    // if (username.trim() === "" || message.trim() === "") {
    //   return;
    // }

    const messageData = {
      type: "message",
      username: username,
      message: message,
    };

    socket.send(JSON.stringify(messageData));

    setMessage("");
  };

  const leaveChat = () => {
    if (socket) {
      socket.close();
    }

    sessionStorage.removeItem("chatUsername");
    sessionStorage.removeItem("chatUserId");

    setSocket(null);
    setJoined(false);
    setMessages([]);
    setOnlineUsers([]);
    setUserId(null);
  };

  if (!joined) {
    return (
      <div className="usernameContainer">
        <h1 className="heading">Join Group Chat</h1>

        <form>
          <input
            className="input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />

          <button className="joinBtn" onClick={joinChat}>
            Join Chat
          </button>
        </form>

        <form>
          <input
            className="input"
            type="text"
            // value={username}
            // onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter Group Code"
          />

          <button className="joinBtn" onClick={joinChat}>
            Join Chat
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="chatContainer">
      <h1 className="chatHeading">My Chat App</h1>

      <input
        className="usernameInput"
        type="text"
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
        }}
        placeholder="Enter your username"
      />

      <button className="leaveBtn" onClick={leaveChat}>
        Leave Chat
      </button>

      <div className="chatContent">
        <div className="chatBox">
          {messages.map((message, index) => {
            if (message.type === "system") {
              return (
                <div key={index} className="joinedChat">
                  {message.message}
                </div>
              );
            }

            const isOnline = onlineUsers.some(
              (user) => user.username === message.username,
            );

            const isOwnMessage = message.username === username;

            return (
              <p
                key={index}
                style={{
                  textAlign: isOwnMessage ? "right" : "left",
                  marginBottom: "10px",
                }}
              >
                <strong className="username">
                  <span
                    className={`online-dot ${isOnline ? "online" : "offline"}`}
                  ></span>
                  {message.username}
                </strong>{" "}
                <span className="chat">{message.message}</span>
              </p>
            );
          })}
        </div>

        <form onSubmit={sendMessage}>
          <input
            id="enterMessage"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;
