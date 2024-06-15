import { LogLevel } from './LogLevel.enum';

/**
 * Exec only 'ERROR' or when 'verbose' flag is available.
 */
export function filter(): (
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) => void {
  return function (_target, _propertyKey, descriptor: PropertyDescriptor) {
    const valueDescriptor = descriptor.value;

    descriptor.value = function (...args: [string, LogLevel]): unknown {
      console.log('AMIGOS', this.verbose);
      const [, level] = args;
      const shouldLog =
        this.verbose || level === LogLevel.SUCCESS || level === LogLevel.ERROR;

      return shouldLog ? valueDescriptor.call(this, ...args, level) : null;
    };

    return descriptor;
  };
}
