import { Logger } from './Logger'
import { LogLevel } from './LogLevel.enum'

/**
 * Exec only 'ERROR', 'WARNING', 'SUCCESS' or when 'verbose' flag is available.
 */
export function filter(): (
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => void {
  return function (_target, _propertyKey, descriptor): PropertyDescriptor {
    const valueDescriptor = descriptor.value

    descriptor.value = function (...args: [string, LogLevel]): unknown {
      const [, level] = args
      const shouldLog =
        Logger.verbose ||
        level === LogLevel.ERROR ||
        level === LogLevel.WARNING ||
        level === LogLevel.SUCCESS

      return shouldLog ? valueDescriptor.call(this, ...args, level) : null
    }

    return descriptor
  }
}
