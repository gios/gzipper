import { Logger } from './Logger';
import { LogLevel } from './LogLevel.enum';

/**
 * Exec only 'error', 'warn', 'success' or when 'verbose' flag is available.
 */
export function filter(
  level: LogLevel,
): (
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) => void {
  return function(_target, _propertyKey, descriptor): PropertyDescriptor {
    const valueDescriptor = descriptor.value;

    descriptor.value = function(...args: unknown[]): unknown {
      const shouldLog =
        (this as Logger).verbose ||
        level === LogLevel.ERROR ||
        level === LogLevel.WARNING ||
        level === LogLevel.SUCCESS;

      if (shouldLog) {
        return valueDescriptor.call(this, ...args);
      }
      return null;
    };

    return descriptor;
  };
}
