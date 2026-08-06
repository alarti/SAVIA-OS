use core_api::{CapabilityToken, Message};

pub enum ProcessState {
    Ready,
    Running,
    Blocked,
    Terminated,
}

pub struct Process {
    pub pid: u32,
    pub state: ProcessState,
    pub token: CapabilityToken,
    // Aquí iría el canal IPC hacia el Web Worker asociado
}

impl Process {
    pub fn new(pid: u32, token: CapabilityToken) -> Self {
        Self {
            pid,
            state: ProcessState::Ready,
            token,
        }
    }
}

pub struct Microkernel {
    processes: Vec<Process>,
    next_pid: u32,
}

impl Microkernel {
    pub fn new() -> Self {
        Self {
            processes: Vec::new(),
            next_pid: 1,
        }
    }

    pub fn spawn_process(&mut self, token: CapabilityToken) -> u32 {
        let pid = self.next_pid;
        self.next_pid += 1;
        
        let process = Process::new(pid, token);
        self.processes.push(process);
        
        pid
    }
    
    // El bucle principal del kernel (mock)
    pub fn tick(&mut self) {
        // En un escenario real asíncrono, aquí se despacharían
        // mensajes IPC pendientes y se cedería el control.
        for process in &mut self.processes {
            match process.state {
                ProcessState::Ready => {
                    // Pasar a running y procesar
                    process.state = ProcessState::Running;
                }
                ProcessState::Running => {
                    // Ceder (cooperative scheduling)
                    process.state = ProcessState::Ready;
                }
                _ => {}
            }
        }
    }
}

