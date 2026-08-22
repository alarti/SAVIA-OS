import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SaviaOS Kernel ErrorBoundary Trap]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[220px] bg-[#0E0E12] border border-red-500/30 text-white p-6 rounded-xl flex flex-col items-center justify-center text-center select-none font-sans">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-base font-bold text-red-300 mb-1">
            {this.props.fallbackTitle || 'Fallo de Ejecución en la Aplicación'}
          </h3>
          <p className="text-xs text-gray-400 max-w-md mb-4 leading-relaxed">
            El subsistema de ventanas de Savia OS ha aislado el error para prevenir un colapso del kernel.
          </p>

          {this.state.error && (
            <div className="w-full max-w-md bg-black/60 border border-white/10 rounded-lg p-2.5 mb-4 text-left font-mono text-[11px] text-red-200 overflow-x-auto">
              <span className="text-red-400 font-bold block mb-1">Error: {this.state.error.name}</span>
              {this.state.error.message}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-3.5 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reiniciar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
