/// Definiciones de los Traits y Protocolo IPC público de SAVIA-OS (v1.0.0)

use serde::{Deserialize, Serialize};
use std::path::Path;

pub const IPC_PROTOCOL_VERSION: &str = "1.0.0";

// Tipos POSIX estándar
pub type Fd = u32;
pub type Inode = u64;
pub type Pid = u32;
pub type Uid = u32;
pub type Gid = u32;

pub const STDIN_FILENO: Fd = 0;
pub const STDOUT_FILENO: Fd = 1;
pub const STDERR_FILENO: Fd = 2;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VfsError {
    NotFound,
    PermissionDenied,
    IoError(String),
    InvalidPath,
    BadFileDescriptor,
    IsADirectory,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum OpenFlags {
    O_RDONLY,
    O_WRONLY,
    O_RDWR,
    O_CREAT,
    O_TRUNC,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Stat {
    pub st_ino: Inode,
    pub st_mode: u32,
    pub st_size: u64,
    pub st_uid: Uid,
    pub st_gid: Gid,
}

pub trait Vfs {
    fn open(&self, path: &Path, flags: OpenFlags, mode: u32) -> Result<Fd, VfsError>;
    fn read(&self, fd: Fd, buf: &mut [u8]) -> Result<usize, VfsError>;
    fn write(&self, fd: Fd, buf: &[u8]) -> Result<usize, VfsError>;
    fn stat(&self, path: &Path) -> Result<Stat, VfsError>;
    fn close(&self, fd: Fd) -> Result<(), VfsError>;
}

/// Token criptográfico que representa un permiso concedido.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct CapabilityToken(pub String);

impl CapabilityToken {
    pub fn id(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Action {
    Read,
    Write,
    Execute,
    NetworkConnect,
    HardwareAccess,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resource(pub String);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SecurityError {
    Unauthorized,
    TokenExpired,
    InvalidResource,
    InsufficientCapability,
}

pub trait CapabilityChecker {
    fn check_permission(
        &self,
        token: &CapabilityToken,
        resource: &Resource,
        action: Action,
    ) -> Result<(), SecurityError>;
}

/// Mensaje IPC versionado y tipado entre Gateway WebOS y Microkernel Rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewayRequest {
    pub request_id: String,
    pub protocol_version: String,
    pub process_id: Pid,
    pub capability_token: CapabilityToken,
    pub payload: IPCMessagePayload,
    pub timeout_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewayResponse {
    pub request_id: String,
    pub success: bool,
    pub result: Option<IPCResponseResult>,
    pub error: Option<StructuredError>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StructuredError {
    pub code: String,
    pub message: String,
    pub details: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IPCMessagePayload {
    ProcessCreate { binary_path: String, args: Vec<String> },
    ProcessTerminate { target_pid: Pid },
    ProcessList,
    FileOpen { path: String, flags: OpenFlags },
    FileRead { fd: Fd, count: usize },
    FileWrite { fd: Fd, bytes: Vec<u8> },
    PermissionRequest { resource: String, action: Action },
    RuntimeInstall { runtime_id: String },
    WindowsBinaryAnalyze { filename: String, raw_bytes: Vec<u8> },
    WindowsBinaryRun { filename: String, profile: String },
    WindowsBinaryStop { process_id: Pid },
    ConsoleInput { input: String },
    ConsoleOutput,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IPCResponseResult {
    ProcessCreated { pid: Pid },
    ProcessTerminated { pid: Pid },
    ProcessListResult { pids: Vec<Pid> },
    FileOpened { fd: Fd },
    FileReadResult { bytes: Vec<u8> },
    FileWrittenResult { bytes_written: usize },
    PermissionGranted { token: CapabilityToken },
    WindowsAnalysisResult { is_dotnet: bool, arch: String, level: u32 },
    ConsoleOutputResult { output: String },
    GenericSuccess { message: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub process_id: Pid,
    pub payload: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IpcError {
    ChannelClosed,
    SerializationFailed,
    Timeout,
}

pub trait IpcChannel {
    fn send(&self, msg: Message) -> Result<(), IpcError>;
    fn receive(&self) -> Result<Message, IpcError>;
}
