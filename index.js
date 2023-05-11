const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const UserSchema = require("./User");

app.use(cors());

app.use(express.json());

dotenv.config();

const server = app.listen(4000, console.log("Server running on PORT 4000..."));

mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGO_URL)
  .then(console.log("Mongodb connected"))
  .catch((err) => {
    console.log(err);
  });

app.post("/register", async (req, res) => {
  try {
    const newUser = new UserSchema({
      username: req.body.username,
      uuid: req.body.uuid,
    });
    const user = await newUser.save();
    console.log(user);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "https://code-bros.netlify.app/",
    // credentials: true,
  },
});

const userSocketMap = {};
function getAllConnectedClients(roomId) {
  // Map
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        name: userSocketMap[socketId],
      };
    }
  );
}

io.on("connection", (socket) => {
  console.log("user connected");

  socket.on("join room", (room) => {
    userSocketMap[socket.id] = room.name;
    socket.join(room?.uuid);
    const clients = getAllConnectedClients(room?.uuid);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit("joined", {
        clients,
        name: socket?.name,
        socketId: socket?.id,
      });
    });
  });

  socket.on("new input", (data) => {
    socket.in(data?.uuid).emit("input recieved", data?.code);
  });

  socket.off("setup", (userData) => {
    console.log("USER DISCONNECTED");
    socket.leave(userData?.uuid);
  });
});
