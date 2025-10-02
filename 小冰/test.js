import * as Sentry from "@sentry/browser";

Sentry.init({
  // dsn: "https://cb7e490368027e0f78027ac9f1bf5df9@aic-sentry.xiaoice.cn/13", // 新的sentry
  dsn: "https://588b30ebd48a4900b5e417c9c3a4bebb@aic-sentry.xiaoice.com/81", // 旧的sentry
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  tracesSampleRate: 1.0,
  // 限制面包屑数量（默认为100，可以降低）
  maxBreadcrumbs: 20,
  beforeBreadcrumb: (breadcrumb, hint) => {
    // 过滤掉所有控制台日志面包屑
    if (breadcrumb.category === 'console') {
      return null; // 返回null表示完全丢弃这个面包屑
    }
    return breadcrumb;
  },
  environment: process.env.NODE_ENV,
});

const genMessage = (config) => {
  const { projectId = '', taskId = '', text = '' } = config || {};
  return {
    message: `${projectId}_${taskId}_${text}`,
    fingerprint: [`livekit-${projectId}-${taskId}`]
  }
}

const report = {
  info: (config: Record<string, any>) => {
    const { message, fingerprint } = genMessage(config);
    Sentry.captureEvent({
      message,
      level: 'info',
      fingerprint,
      extra: {
        ...config
      }
    });
  },
  warning: (config: Record<string, any>) => {
    const { message, fingerprint } = genMessage(config);
    Sentry.captureEvent({
      message,
      level: 'warning',
      fingerprint,
      extra: {
        ...config
      }
    });
  },
  error: (config: Record<string, any>) => {
    const { message, fingerprint } = genMessage(config);
    Sentry.captureEvent({
      message,
      level: 'error',
      fingerprint,
      extra: {
        ...config
      }
    });
  }
}

export default report;