const { Server } = require("socket.io");

const io = new Server(8000, {
    cors: true,
});

io.on("connection", (socket) => {
    console.log(`Socket Connected`, socket.id);

    socket.on("call", ({ to, userName }) => {
        const from = socket.id;
        io.to(to).emit("call:me", from, userName);
    });

    socket.on("call:answer", ({ to, answer }) => {
        const from = socket.id;
        io.to(to).emit("call:result", from, answer);
    });


    socket.on("send:offer", ({ to, offer }) => {
        const from = socket.id;
        io.to(to).emit("offer:received", from, offer);
    });

    socket.on("send:answer", ({ to, answer }) => {
        const from = socket.id;
        io.to(to).emit("answer:received", from, answer);
    });

    socket.on("send_back:offer", ({ to, offer }) => {
        const from = socket.id;
        io.to(to).emit("offer_back:received", from, offer);
    });

    socket.on("send_back:answer", ({ to, answer }) => {
        const from = socket.id;
        io.to(to).emit("answer_back:received", from, answer);
    });
});