import { 
  ConsoleSpanExporter, 
  SimpleSpanProcessor 
} from '@opentelemetry/sdk-trace-base';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { trace, Tracer } from '@opentelemetry/api';

const SERVICE_NAME = 'ember-worry-release';

let tracer: Tracer | null = null;

export const initTelemetry = () => {
  if (tracer) return;

  // Create a provider for activating and tracking spans
  const provider = new WebTracerProvider();

  // Export spans to the console for demonstration
  // In a production environment, this would be an OTLP exporter
  // Using type assertion to avoid TS errors due to potential library version mismatches
  (provider as any).addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  
  // Register the provider to use the global tracer
  provider.register();

  tracer = trace.getTracer(SERVICE_NAME);
  console.log('[Telemetry] Initialized OpenTelemetry with Console Exporter');
};

export const getTracer = (): Tracer => {
  if (!tracer) {
    initTelemetry();
  }
  return trace.getTracer(SERVICE_NAME);
};