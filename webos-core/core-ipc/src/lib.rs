use core_api::{IpcChannel, IpcError, Message};
use std::sync::mpsc::{self, Receiver, Sender};
use std::sync::{Arc, Mutex};

/// Implementación básica de IPC Channel usando mpsc.
/// En un entorno web real con Workers, esto wrappearía `postMessage`.
pub struct LocalIpcChannel {
    sender: Sender<Message>,
    receiver: Arc<Mutex<Receiver<Message>>>,
}

impl LocalIpcChannel {
    pub fn new() -> (Self, Self) {
        let (tx1, rx1) = mpsc::channel();
        let (tx2, rx2) = mpsc::channel();
        
        let channel1 = Self {
            sender: tx1,
            receiver: Arc::new(Mutex::new(rx2)),
        };
        
        let channel2 = Self {
            sender: tx2,
            receiver: Arc::new(Mutex::new(rx1)),
        };
        
        (channel1, channel2)
    }
}

impl IpcChannel for LocalIpcChannel {
    fn send(&self, msg: Message) -> Result<(), IpcError> {
        self.sender.send(msg).map_err(|_| IpcError::ChannelClosed)
    }

    fn receive(&self) -> Result<Message, IpcError> {
        let rx = self.receiver.lock().unwrap();
        rx.recv().map_err(|_| IpcError::ChannelClosed)
    }
}

