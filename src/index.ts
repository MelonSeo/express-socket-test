import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
app.use(express.static("public"));
const httpServer = createServer(app);

// Socket.io 이벤트 인터페이스 정의
interface ServerToClientEvents { // 서버에서 클라이언트로 이벤트 전송
    noArg: () => void;
    basicEmit: (a: number, b: string, c: Buffer) => void;
    withAck: (d: string, callback: (e: number) => void) => void;
}
  
  interface ClientToServerEvents { // 클라이언트에서 서버로 이벤트 전송
    hello: () => void;
}
  
  interface InterServerEvents { // 서버 간 이벤트 전송
    ping: () => void;
}
  
  interface SocketData { // 소켓 데이터
    name: string;
}


const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

const PORT = process.env.PORT || 8081;

io.on("connection", (socket) => {
    socket.data.name = "Test";

    console.log("a user connected", socket.data.name);
    socket.emit("noArg");
    socket.emit("basicEmit", 1, "2", Buffer.from([3]));
    socket.emit("withAck", "4", (e) => {
      // e is inferred as number
    });
    io.emit("noArg");

    socket.on("hello", () => {
        console.log("클라이언트로부터 hello 이벤트 수신!");
        socket.emit("noArg");
    });
      // works when broadcasting to a room
    io.to("room1").emit("basicEmit", 1, "2", Buffer.from([3]));

    const heartbeat = setInterval(() => {
        socket.emit("noArg");
        console.log(`[${socket.id}] 하트비트 전송 - 연결 유지 중`);
    }, 5000); // 5초마다

    socket.on("disconnect", () => {
        clearInterval(heartbeat);
        console.log(`[${socket.id}] 연결 끊김`);
    });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// 모든 연결 강제 종료 (서버 종료 시)
process.on("SIGTERM", () => {
    console.log("서버 종료 중... 모든 연결 종료");
    io.disconnectSockets(true);
    httpServer.close();
});