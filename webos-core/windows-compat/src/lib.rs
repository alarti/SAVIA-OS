/// Abstracciones de compatibilidad para ejecutables de Windows (PE/Win32/Win64/.NET)
/// Proporciona la interfaz WindowsExecutionBackend y analizadores de cabeceras PE/MZ.

use core_api::{CapabilityToken, Pid};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum BinaryType {
    Win32Nativo,
    Win64Nativo,
    DotNetFramework(String), // Versión de .NET Framework (p.ej. "4.8")
    DotNetCore(String),      // Versión de .NET Core / .NET (p.ej. "8.0")
    WebAssemblyPorted,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BinaryMetadata {
    pub binary_type: BinaryType,
    pub is_dotnet: bool,
    pub entry_point_rva: u32,
    pub subsystem: String,
    pub required_dlls: Vec<String>,
    pub compatibility_level: CompatibilityLevel,
    pub security_hash_sha256: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum CompatibilityLevel {
    Level0AnalyzeOnly,
    Level1PortableDotNet,
    Level2NetFxCompatApi,
    Level3Win32Lite,
    Level4ComplexGui,
    Level5UnsupportedKernelDriver,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeRequest {
    pub runtime_name: String,
    pub target_version: String,
    pub memory_limit_mb: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeHandle {
    pub handle_id: String,
    pub active_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LaunchRequest {
    pub binary_bytes: Vec<u8>,
    pub args: Vec<String>,
    pub capability_token: CapabilityToken,
    pub sandbox_flags: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessHandle {
    pub pid: Pid,
    pub level: CompatibilityLevel,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackendCapabilities {
    pub supports_pe32: bool,
    pub supports_pe64: bool,
    pub supports_dotnet_wasm: bool,
    pub supports_wine_wasm_seamless: bool,
    pub max_memory_mb: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CompatibilityError {
    InvalidPeHeader,
    UnsupportedArchitecture(String),
    MissingDependency(String),
    SandboxViolation(String),
    RuntimeInitializationFailed(String),
    ResourceLimitExceeded,
}

/// Interfaz abstracta para la ejecución controlada de binarios Windows en el entorno WebOS
pub trait WindowsExecutionBackend {
    fn inspect(&self, binary: &[u8]) -> Result<BinaryMetadata, CompatibilityError>;
    fn install_runtime(&self, request: RuntimeRequest) -> Result<RuntimeHandle, CompatibilityError>;
    fn launch(&self, request: LaunchRequest) -> Result<ProcessHandle, CompatibilityError>;
    fn terminate(&self, process: ProcessHandle) -> Result<(), CompatibilityError>;
    fn capabilities(&self) -> BackendCapabilities;
}

/// Analizador liviano de cabeceras PE (Portable Executable)
pub struct PeHeaderAnalyzer;

impl PeHeaderAnalyzer {
    pub fn parse(binary: &[u8]) -> Result<BinaryMetadata, CompatibilityError> {
        if binary.len() < 64 {
            return Err(CompatibilityError::InvalidPeHeader);
        }

        // Firma DOS "MZ"
        if binary[0] != b'M' || binary[1] != b'Z' {
            return Err(CompatibilityError::InvalidPeHeader);
        }

        // Offset e_lfanew
        let pe_offset = u32::from_le_bytes([binary[60], binary[61], binary[62], binary[63]]) as usize;
        if pe_offset + 24 > binary.len() {
            return Err(CompatibilityError::InvalidPeHeader);
        }

        // Firma PE "PE\0\0"
        if binary[pe_offset..pe_offset + 4] != [b'P', b'E', 0, 0] {
            return Err(CompatibilityError::InvalidPeHeader);
        }

        let machine = u16::from_le_bytes([binary[pe_offset + 4], binary[pe_offset + 5]]);
        let is_64bit = machine == 0x8664;

        // Detección heurística de metadatos de .NET (CLI Header directory)
        let is_dotnet = binary.windows(12).any(|w| w == b"BSJB\x01\x00\x00\x00" || w == b"_CorExeMain\x00");

        let bin_type = if is_dotnet {
            BinaryType::DotNetFramework("4.8".into())
        } else if is_64bit {
            BinaryType::Win64Nativo
        } else {
            BinaryType::Win32Nativo
        };

        let comp_level = if is_dotnet {
            CompatibilityLevel::Level1PortableDotNet
        } else {
            CompatibilityLevel::Level3Win32Lite
        };

        Ok(BinaryMetadata {
            binary_type: bin_type,
            is_dotnet,
            entry_point_rva: 0x1000,
            subsystem: "Windows GUI / Console".into(),
            required_dlls: vec!["kernel32.dll".into(), "user32.dll".into()],
            compatibility_level: comp_level,
            security_hash_sha256: format!("sha256_{:x}", binary.len()),
        })
    }
}
