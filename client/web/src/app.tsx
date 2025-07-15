import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { AuthProvider } from "./lib/auth";
import "./app.css";

export default function App() {
  return (
    <AuthProvider>
      <Router
        root={props => (
          <MetaProvider>
            <Title>H3 Template Web App</Title>
            <Suspense fallback={
              <div class="flex items-center justify-center min-h-screen">
                <div class="text-lg">加载中...</div>
              </div>
            }>
              {props.children}
            </Suspense>
          </MetaProvider>
        )}
      >
        <FileRoutes />
      </Router>
    </AuthProvider>
  );
}
