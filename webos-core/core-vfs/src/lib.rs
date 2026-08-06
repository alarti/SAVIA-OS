/// Implementación del VFS (Virtual File System) compatible con Unix
/// 
/// Interfaz con File System Access API nativa del navegador.

use core_api::{Fd, VfsError, OpenFlags, Stat, Inode, STDIN_FILENO, STDOUT_FILENO, STDERR_FILENO};
use std::collections::HashMap;
use std::path::Path;
use std::sync::RwLock;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{FileSystemDirectoryHandle, FileSystemFileHandle};

/// Backend basado en File System Access API emulando POSIX FDs
pub struct WebAccessFs {
    root_handle: FileSystemDirectoryHandle,
    // Tabla de File Descriptors abierta.
    fd_table: RwLock<HashMap<Fd, FileSystemFileHandle>>,
    next_fd: RwLock<Fd>,
}

impl WebAccessFs {
    /// Crea una nueva instancia proporcionando el handle raíz.
    /// Inicializa los FDs estándar 0, 1 y 2.
    pub fn new(root_handle: FileSystemDirectoryHandle) -> Self {
        Self { 
            root_handle,
            fd_table: RwLock::new(HashMap::new()),
            next_fd: RwLock::new(3), // FDs 0, 1, 2 reservados
        }
    }

    /// Asigna un nuevo File Descriptor para un handle web
    fn allocate_fd(&self, handle: FileSystemFileHandle) -> Fd {
        let mut next = self.next_fd.write().unwrap();
        let fd = *next;
        *next += 1;
        self.fd_table.write().unwrap().insert(fd, handle);
        fd
    }

    /// Operación equivalente a open() de POSIX.
    pub async fn async_open(&self, path: &Path, _flags: OpenFlags) -> Result<Fd, VfsError> {
        let safe_filename = path.to_str().ok_or(VfsError::InvalidPath)?;
        
        // Prevención estricta de Path Traversal
        if safe_filename.contains("/") || safe_filename.contains("\\") || safe_filename == ".." {
            return Err(VfsError::InvalidPath);
        }

        let mut options = web_sys::FileSystemGetFileOptions::new();
        options.create(false);

        let promise = self.root_handle.get_file_handle_with_options(safe_filename, &options);
        let result = JsFuture::from(promise).await.map_err(|_| VfsError::NotFound)?;
        
        let handle: FileSystemFileHandle = result.into();
        
        Ok(self.allocate_fd(handle))
    }

    /// Operación equivalente a read() de POSIX.
    pub async fn async_read(&self, fd: Fd, buf: &mut [u8]) -> Result<usize, VfsError> {
        let handle = {
            let table = self.fd_table.read().unwrap();
            table.get(&fd).cloned().ok_or(VfsError::BadFileDescriptor)?
        };

        let file_promise = handle.get_file();
        let file_obj = JsFuture::from(file_promise).await.map_err(|_| VfsError::IoError("Failed to get JS file".into()))?;
        let file: web_sys::File = file_obj.into();

        let array_buf_promise = file.array_buffer();
        let array_buf_val = JsFuture::from(array_buf_promise).await.map_err(|_| VfsError::IoError("Failed to read array buffer".into()))?;
        
        let uint8_array = js_sys::Uint8Array::new(&array_buf_val);
        
        let length = std::cmp::min(buf.len(), uint8_array.length() as usize);
        let mut temp = vec![0; length];
        
        // Copiamos el bloque truncado
        let sliced = uint8_array.subarray(0, length as u32);
        sliced.copy_to(&mut temp);
        
        buf[..length].copy_from_slice(&temp);

        Ok(length)
    }
    
    pub fn close_fd(&self, fd: Fd) -> Result<(), VfsError> {
        if fd == STDIN_FILENO || fd == STDOUT_FILENO || fd == STDERR_FILENO {
            return Ok(()); // Silenciosamente ignoramos cerrar stdio
        }
        
        let mut table = self.fd_table.write().unwrap();
        if table.remove(&fd).is_some() {
            Ok(())
        } else {
            Err(VfsError::BadFileDescriptor)
        }
    }
}
