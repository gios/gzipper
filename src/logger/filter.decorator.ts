import { Logger } from './Logger';
import { Types } from './types.enum';

/**
 * Exec only 'error', 'warn', 'success' or when 'verbose' flag is available.
 */
export function filter(
  type: Types,
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
        type === Types.Error ||
        type === Types.Warning ||
        type === Types.Success;

      if (shouldLog) {
        return valueDescriptor.call(this, ...args);
      }
      return null;
    };

    return descriptor;
  };
}
