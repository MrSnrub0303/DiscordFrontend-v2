import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          color: '#dc3545', 
          background: '#f8f9fa', 
          border: '1px solid #dc3545',
          borderRadius: '4px',
          margin: '20px',
          fontFamily: 'monospace'
        }}>
          <h2>🛠️ Something went wrong</h2>
          <p>The Discord Activity encountered an unexpected error.</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            <summary>Error Details</summary>
            <div style={{ fontSize: '12px', marginTop: '10px' }}>
              <strong>Error:</strong> {this.state.error && this.state.error.toString()}
              <br />
              <strong>Stack:</strong> {this.state.errorInfo && this.state.errorInfo.componentStack || 'No stack trace available'}
            </div>
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Activity
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
