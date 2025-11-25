import React, { Component, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 [ErrorBoundary] Erro capturado:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Callback opcional para logging externo
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log estruturado para monitoramento
    this.logError(error, errorInfo);
  }

  private logError(error: Error, errorInfo: React.ErrorInfo) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      type: 'react_error',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Enviar para console estruturado
    console.error('📊 [ErrorLog]', JSON.stringify(errorLog, null, 2));

    // Aqui você pode enviar para serviço de monitoramento
    // ex: Sentry, LogRocket, etc.
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Renderizar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Renderizar componente de erro padrão
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
