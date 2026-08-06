use core_api::{Action, CapabilityChecker, CapabilityToken, Resource, SecurityError};
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, RwLock};

#[derive(Debug, Clone, Hash, Eq, PartialEq)]
pub struct Capability {
    pub resource: String,
    pub action: Action,
}

pub struct SecurityContext {
    // Mapa de Token -> Conjunto de Capacidades asociadas
    token_store: Arc<RwLock<HashMap<String, HashSet<Capability>>>>,
}

impl SecurityContext {
    pub fn new() -> Self {
        Self {
            token_store: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Otorga una nueva capacidad a un token existente o lo crea.
    pub fn grant(&self, token_id: String, cap: Capability) {
        let mut store = self.token_store.write().unwrap();
        store.entry(token_id).or_insert_with(HashSet::new).insert(cap);
    }
}

impl CapabilityChecker for SecurityContext {
    fn check_permission(
        &self,
        token: &CapabilityToken,
        resource: &Resource,
        action: Action,
    ) -> Result<(), SecurityError> {
        let store = self.token_store.read().unwrap();
        
        let token_id = token.id();
        
        if let Some(caps) = store.get(token_id) {
            let target_cap = Capability {
                resource: resource.0.clone(),
                action,
            };
            
            if caps.contains(&target_cap) {
                return Ok(());
            }
            return Err(SecurityError::Unauthorized);
        }
        
        Err(SecurityError::InvalidResource)
    }
}

