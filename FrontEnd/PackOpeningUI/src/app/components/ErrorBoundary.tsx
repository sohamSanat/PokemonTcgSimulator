import React from "react";
export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div style={{color: "red", padding: "20px", background: "black", width: "100%", height: "100vh", position: "absolute", zIndex: 9999}}><pre>{this.state.error?.toString()}</pre></div>;
    }
    return this.props.children;
  }
}
