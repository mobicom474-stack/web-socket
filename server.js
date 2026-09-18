const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});


// ==========================================
// TEST ROUTE
// ==========================================

app.get("/", (req, res) => {
    res.send("WebSocket server is running");
});


// ==========================================
// SOCKET.IO CONNECTION
// ==========================================

io.on("connection", (socket) => {

    console.log("Owner connected:", socket.id);


    // Owner joins its company room
    socket.on("join_company", (companyId) => {

        const cmpId = parseInt(companyId);

        if (!cmpId || cmpId <= 0) {
            console.log("Invalid company ID:", companyId);
            return;
        }

        const room = `company:${cmpId}`;

        socket.join(room);

        console.log(
            `Socket ${socket.id} joined ${room}`
        );
    });


    // Owner disconnected
    socket.on("disconnect", (reason) => {

        console.log(
            "Owner disconnected:",
            socket.id,
            reason
        );

    });

});


// ==========================================
// PHP → RENDER
// NEW ORDER
// ==========================================

app.post("/order-created", (req, res) => {

    const order = req.body;

    console.log("New order received from PHP:");
    console.log(order);


    const cmpId = parseInt(order.company_id);

    if (!cmpId || cmpId <= 0) {

        return res.status(400).json({
            status: "error",
            message: "Invalid company_id"
        });

    }


    const room = `company:${cmpId}`;


    // Send order only to this company's owners
    io.to(room).emit("order.created", order);


    console.log(
        `Order ${order.order_no} sent to ${room}`
    );


    res.json({
        status: "success",
        message: "Order notification sent"
    });

});


// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 4000;

server.listen(PORT, "0.0.0.0", () => {

    console.log(
        `WebSocket server running on port ${PORT}`
    );

});
