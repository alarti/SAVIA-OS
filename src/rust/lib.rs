// ============================================================================
// SAVIA OS - RUST CORE KERNEL & WEB ASSEMBLY ENGINE
// ============================================================================
// This Rust module compiles to WebAssembly (wasm32-unknown-unknown).
// It handles high-performance, memory-safe system operations for Savia OS:
// - Security Canonicalization & Vulnerability Auditing
// - Cryptographic Checksums (CRC32, Fast Hashes)
// - Pixel Manipulation & Image Filters
// - Mathematical Benchmarking & Memory Heap Management
// ============================================================================

pub struct SecurityAuditResult {
    pub is_safe: bool,
    pub risk_score: u32,
    pub sanitized_path: String,
    pub violation_reason: String,
}

/// Validates path strings with Rust's strict memory and bounds safety
pub fn rust_canonicalize_path(input_path: &str) -> SecurityAuditResult {
    if input_path.contains('\0') {
        return SecurityAuditResult {
            is_safe: false,
            risk_score: 95,
            sanitized_path: String::new(),
            violation_reason: String::from("Rust Security Guard: Null byte injection detected."),
        };
    }

    let normalized = input_path.replace('\\', "/");

    if normalized.contains("../") || normalized.contains("/..") || normalized == ".." {
        return SecurityAuditResult {
            is_safe: false,
            risk_score: 90,
            sanitized_path: String::new(),
            violation_reason: String::from("Rust Security Guard: VFS Path Traversal attempt blocked."),
        };
    }

    if normalized.starts_with("/etc/shadow") || normalized.starts_with("/proc/") {
        return SecurityAuditResult {
            is_safe: false,
            risk_score: 100,
            sanitized_path: String::new(),
            violation_reason: String::from("Rust Security Guard: Critical kernel descriptor access blocked."),
        };
    }

    SecurityAuditResult {
        is_safe: true,
        risk_score: 0,
        sanitized_path: normalized,
        violation_reason: String::from("OK"),
    }
}

/// Computes CRC32 checksum in Rust
pub fn rust_crc32(data: &[u8]) -> u32 {
    let mut crc = 0xFFFFFFFFu32;
    for &byte in data {
        crc ^= byte as u32;
        for _ in 0..8 {
            if (crc & 1) != 0 {
                crc = (crc >> 1) ^ 0xEDB88320;
            } else {
                crc >>= 1;
            }
        }
    }
    !crc
}

/// High-speed image filter algorithm written in Rust for browser WASM execution
pub fn rust_apply_grayscale_filter(pixels: &mut [u8]) {
    for chunk in pixels.chunks_exact_mut(4) {
        let r = chunk[0] as f32;
        let g = chunk[1] as f32;
        let b = chunk[2] as f32;
        let gray = (r * 0.299 + g * 0.587 + b * 0.114) as u8;
        chunk[0] = gray;
        chunk[1] = gray;
        chunk[2] = gray;
    }
}

/// High-speed sepia filter algorithm in Rust
pub fn rust_apply_sepia_filter(pixels: &mut [u8]) {
    for chunk in pixels.chunks_exact_mut(4) {
        let r = chunk[0] as f32;
        let g = chunk[1] as f32;
        let b = chunk[2] as f32;

        let tr = (r * 0.393 + g * 0.769 + b * 0.189).min(255.0) as u8;
        let tg = (r * 0.349 + g * 0.686 + b * 0.168).min(255.0) as u8;
        let tb = (r * 0.272 + g * 0.534 + b * 0.131).min(255.0) as u8;

        chunk[0] = tr;
        chunk[1] = tg;
        chunk[2] = tb;
    }
}

/// Mathematical benchmark computation in Rust
pub fn rust_compute_prime_count(limit: u32) -> u32 {
    let mut count = 0;
    for n in 2..=limit {
        let mut is_prime = true;
        let max = (n as f64).sqrt() as u32;
        for i in 2..=max {
            if n % i == 0 {
                is_prime = false;
                break;
            }
        }
        if is_prime {
            count += 1;
        }
    }
    count
}
