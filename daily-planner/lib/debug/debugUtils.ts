// lib/debug/debugUtils.ts - Debugging utilities for LLM development
import { Platform } from 'react-native';

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryBefore?: number;
  memoryAfter?: number;
  step: string;
}

class DebugManager {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private isDebugMode: boolean = __DEV__ || process.env.DEBUG_INFERENCE === 'true';

  startTimer(key: string, step: string): void {
    if (!this.isDebugMode) return;
    
    this.metrics.set(key, {
      startTime: performance.now(),
      step,
      memoryBefore: this.getMemoryUsage()
    });
    
    console.log(`🚀 [DEBUG] Starting ${step} - ${key}`);
  }

  endTimer(key: string): PerformanceMetrics | null {
    if (!this.isDebugMode) return null;
    
    const metric = this.metrics.get(key);
    if (!metric) return null;

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    const memoryAfter = this.getMemoryUsage();

    const updatedMetric: PerformanceMetrics = {
      ...metric,
      endTime,
      duration,
      memoryAfter
    };

    this.metrics.set(key, updatedMetric);
    
    console.log(`✅ [DEBUG] Completed ${metric.step} - ${key}`);
    console.log(`   Duration: ${duration.toFixed(2)}ms`);
    if (
      metric.memoryBefore !== undefined && metric.memoryBefore !== null &&
      memoryAfter !== undefined && memoryAfter !== null
    ) {
      const memoryDelta = memoryAfter - metric.memoryBefore;
      console.log(
        `   Memory: ${memoryDelta > 0 ? '+' : ''}${memoryDelta.toFixed(2)}MB`
      );
    }
    return updatedMetric;
  }

  logInferenceStep(step: string, data?: any): void {
    if (!this.isDebugMode) return;
    
    console.log(`🧠 [INFERENCE] ${step}`);
    if (data) {
      console.log(data);
    }
  }

  logModelInfo(modelPath: string, size: number): void {
    if (!this.isDebugMode) return;
    
    console.log(`📦 [MODEL] Loaded: ${modelPath}`);
    console.log(`   Size: ${(size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Platform: ${Platform.OS}`);
  }

  logError(context: string, error: Error): void {
    console.error(`❌ [ERROR] ${context}:`, error);
    
    // In development, also log stack trace
    if (this.isDebugMode && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }

  getMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  private getMemoryUsage(): number | undefined {
    // This is a placeholder - actual memory monitoring would need native modules
    // For now, we'll return undefined and implement platform-specific solutions later
    if (Platform.OS === 'ios') {
      // iOS: Would use native module to get memory info
      return undefined;
    } else if (Platform.OS === 'android') {
      // Android: Would use native module to get memory info  
      return undefined;
    }
    return undefined;
  }
}

export const debugManager = new DebugManager();

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  const startTimer = (key: string, step: string) => debugManager.startTimer(key, step);
  const endTimer = (key: string) => debugManager.endTimer(key);
  const logStep = (step: string, data?: any) => debugManager.logInferenceStep(step, data);
  
  return {
    startTimer,
    endTimer,
    logStep,
    getMetrics: () => debugManager.getMetrics(),
    clearMetrics: () => debugManager.clearMetrics()
  };
};