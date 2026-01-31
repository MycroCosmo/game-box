import io, { Socket } from "socket.io-client";

let socket: Socket | null = null;
let connecting: Promise<Socket> | null = null;

export const connectSocket = (url: string): Promise<Socket> => {
  // 이미 연결되어 있으면 그대로 반환
  if (socket?.connected) return Promise.resolve(socket);

  // 연결 중이면 같은 Promise 재사용 (중복 연결 방지)
  if (connecting) return connecting;

  connecting = new Promise((resolve, reject) => {
    const s = io(url, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      // transports를 강제하지 않습니다. 기본 설정(polling -> upgrade to websocket)을 사용하면
      // 네트워크/프록시 환경에서 안정적으로 연결됩니다.
    });

    const cleanup = () => {
      s.off("connect");
      s.off("connect_error");
      s.off("disconnect");
      s.off("error");
    };

    s.on("connect", () => {
      socket = s;
      connecting = null;
      console.log("✓ Socket connected:", socket.id);
      cleanup();
      resolve(socket);
    });

    s.on("connect_error", (error) => {
      connecting = null;
      console.error("✗ Socket connection error:", error);
      cleanup();
      // 연결 실패 시 소켓 정리
      s.disconnect();
      reject(error);
    });

    // 참고: disconnect/error 로그는 연결 이후에도 필요하면 socket에 다시 달아도 되지만
    // 여기서는 최소 변경만.
  });

  return connecting;
};

export const getSocket = (): Socket => {
  if (!socket) throw new Error("Socket is not connected yet. Call connectSocket() first.");
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    connecting = null;
  }
};
