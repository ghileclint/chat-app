console.log("Chat app");

const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

const chatHistory = [];

const { randomUUID } = require("crypto");
const { json } = require("stream/consumers");

console.log("WebSocket server running on port 8080");

wss.on("connection", (socket) => {
  console.log("A client connected");

  // Store the username for this connection
  socket.username = null;
  socket.userId = randomUUID();

  socket.on("message", (message) => {
    const receivedData = JSON.parse(message.toString());

    // User joining the chat
    if (receivedData.type === "join") {
      socket.userId = receivedData.userId || randomUUID();
      socket.username = receivedData.username;

      socket.send(
        JSON.stringify({
          type: "user-info",
          userId: socket.userId,
          username: socket.username,
        }),
      );

      // send previous messages to the new user
      socket.send(
        JSON.stringify({
          type: "history",
          messages: chatHistory,
        }),
      );

      // tell everyone that this user joins
      broadcast({
        type: "system",
        message: `${socket.username} joined the chat`,
      });

      // send updated online-users
      broadcastUsers();
      return;
    }

    // Normal chat message
    if (receivedData.type === "message") {
      const messageData = {
        type: "message",
        userId: socket.userId,
        username: socket.username,
        message: receivedData.message,
      };
      chatHistory.push(messageData);

      broadcast(receivedData);
    }
  });

  socket.on("close", () => {
    console.log(`${socket.username} disconnected`);

    if (socket.username) {
      broadcast({
        type: "system",
        message: `${socket.username} left the chat`,
      });

      // send updated users after they leave
      broadcastUsers();
    }
  });
});

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function broadcastUsers() {
  const users = [];

  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.username &&
      client.userId
    ) {
      users.push({ id: client.userId, username: client.username });
    }
  });

  broadcast({
    type: "users",
    users: users,
  });
}
