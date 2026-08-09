/// Orquestador y supervisor de runtimes del sistema operativo (WASM, .NET, copy.sh/v86)
/// Controla cuotas de recursos, tiempo máximo de CPU y contención de fallos.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceQuota {
    pub max_memory_bytes: u64,
    pub max_cpu_time_ms: u64,
    pub max_open_files: u32,
    pub allow_network: bool,
}

impl Default for ResourceQuota {
    fn default() -> Self {
        Self {
            max_memory_bytes: 256 * 1024 * 1024, // 256 MB
            max_cpu_time_ms: 300_000,           // 5 min
            max_open_files: 32,
            allow_network: false,
        }
    }
}

pub struct RuntimeSupervisor {
    pub quota: ResourceQuota,
}

impl RuntimeSupervisor {
    pub fn new(quota: ResourceQuota) -> Self {
        Self { quota }
    }

    pub fn validate_execution_budget(&self, requested_memory_mb: u32) -> bool {
        (requested_memory_mb as u64 * 1024 * 1024) <= self.quota.max_memory_bytes
    }
}
