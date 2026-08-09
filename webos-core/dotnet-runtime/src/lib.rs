/// Host de ejecución .NET en WebAssembly / Server / Proxy
/// Gestiona la carga de ensamblados CIL/MSIL y la resolución de referencias de la BCL (Base Class Library).

use serde::{Deserialize, Serialize};
use windows-compat::{BinaryMetadata, CompatibilityError};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DotNetExecutionEngine {
    MonoWasmRuntime,
    CoreClrServerAgent,
    NativeAotWasm,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssemblyMetadata {
    pub name: String,
    pub version: String,
    pub target_framework: String,
    pub referenced_assemblies: Vec<String>,
}

pub struct DotNetHost {
    pub engine: DotNetExecutionEngine,
}

impl DotNetHost {
    pub fn new(engine: DotNetExecutionEngine) -> Self {
        Self { engine }
    }

    pub fn inspect_assembly(&self, binary: &[u8]) -> Result<AssemblyMetadata, CompatibilityError> {
        let meta = windows-compat::PeHeaderAnalyzer::parse(binary)?;
        if !meta.is_dotnet {
            return Err(CompatibilityError::UnsupportedArchitecture(
                "El ejecutable no contiene metadatos CLI .NET válidos".into(),
            ));
        }

        Ok(AssemblyMetadata {
            name: "ManagedAssembly.exe".into(),
            version: "1.0.0.0".into(),
            target_framework: ".NETFramework,Version=v4.8".into(),
            referenced_assemblies: vec![
                "mscorlib".into(),
                "System".into(),
                "System.Windows.Forms".into(),
            ],
        })
    }
}
