const mongoose = require("mongoose");
const Document = require("./Document");

mongoose.connect("mongodb://example:27017/test", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.once("open", function () {
  console.log("Connected to MongoDB!");
});
const io = require("socket.io")(3001, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

const defaultValue = "";

io.on("connection", (socket) => {
  console.log(socket.id + " connected");

  socket.on("get-document", async (documentId) => {
    const document = await getOrCreateDoc(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);
    socket.on("send-changes", (delta) => {
      console.log(delta);
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-changes", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

async function getOrCreateDoc(id) {
  if (id == null) return;
  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: defaultValue });
}
