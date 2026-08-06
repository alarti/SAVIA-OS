/// Definiciones de los Traits públicos del sistema compatibles con POSIX/Unix

use std::path::Path;

// Tipos POSIX estándar
pub type Fd = u32;
pub type Inode = u64;
pub type Pid = u32;
pub type Uid = u32;
pub type Gid = u32;

/// Constantes POSIX de FDs estándar
pub const STDIN_FILENO: Fd = 0;
pub const STDOUT_FILENO: Fd = 1;
pub const STDERR_FILENO: Fd = 2;

#[derive(Debug)]
pub enum VfsError {
    NotFound,
    PermissionDenied,
    IoError(String),
    InvalidPath,
    BadFileDescriptor,
    IsADirectory,
}

/// Flags tipo `fcntl.h` para sys_open
#[derive(Debug, Clone, Copy)]
pub enum OpenFlags {
    O_RDONLY,
    O_WRONLY,
    O_RDWR,
    O_CREAT,
    O_TRUNC,
}

/// Equivalente a la estructura `stat` de POSIX
pub struct Stat {
    pub st_ino: Inode,
    pub st_mode: u32,
    pub st_size: u64,
    pub st_uid: Uid,
    pub st_gid: Gid,
}

/// Capa de abstracción del Sistema de Ficheros (Virtual File System) compatible con Unix
pub trait Vfs {
    /// syscall equivalente a `open(path, flags)`
    fn open(&self, path: &Path, flags: OpenFlags, mode: u32) -> Result<Fd, VfsError>;
    /// syscall equivalente a `read(fd, buf)`
    fn read(&self, fd: Fd, buf: &mut [u8]) -> Result<usize, VfsError>;
    /// syscall equivalente a `write(fd, buf)`
    fn write(&self, fd: Fd, buf: &[u8]) -> Result<usize, VfsError>;
    /// syscall equivalente a `stat(path, &statbuf)`
    fn stat(&self, path: &Path) -> Result<Stat, VfsError>;
    /// syscall equivalente a `close(fd)`
    fn close(&self, fd: Fd) -> Result<(), VfsError>;
}

/// Token criptográfico o estructurado que representa un permiso concedido.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct CapabilityToken(pub String);

impl CapabilityToken {
    pub fn id(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum Action {
    Read,
    Write,
    Execute,
}

pub struct Resource(pub String);

#[derive(Debug)]
pub enum SecurityError {
    Unauthorized,
    TokenExpired,
    InvalidResource,
}

/// Sistema de verificación de capacidades y permisos.
pub trait CapabilityChecker {
    fn check_permission(
        &self,
        token: &CapabilityToken,
        resource: &Resource,
        action: Action,
    ) -> Result<(), SecurityError>;
}

/// Mensaje de Inter-Process Communication
pub struct Message {
    pub process_id: Pid,
    pub payload: Vec<u8>,
}

#[derive(Debug)]
pub enum IpcError {
    ChannelClosed,
    SerializationFailed,
}

/// Canal de mensajería entre el microkernel y los procesos (workers).
pub trait IpcChannel {
    fn send(&self, msg: Message) -> Result<(), IpcError>;
    fn receive(&self) -> Result<Message, IpcError>;
}
