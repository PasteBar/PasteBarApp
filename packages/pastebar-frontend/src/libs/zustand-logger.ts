import { StateCreator, StoreMutatorIdentifier } from 'zustand'

type TLoggerFn = (actionName: string, args: unknown[]) => void

type TLogger = <
  T extends object,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  options: { enabled?: boolean; logger?: TLoggerFn } // Add the "enabled" option
) => StateCreator<T, Mps, Mcs>

type TLoggerImpl = <T>(
  storeInitializer: StateCreator<T, [], []>,
  options: { enabled?: boolean; logger?: TLoggerFn } // Add the "enabled" option
) => StateCreator<T, [], []>

const logger: TLoggerImpl =
  (config, options = { enabled: true }) =>
  (set, get, api) => {
    if (!options.enabled || process.env.NODE_ENV === 'production') {
      return config(set, get, api)
    }

    const originalConfig = config(set, get, api)
    // @ts-expect-error no types
    const actions = originalConfig['actions']

    if (actions && typeof actions === 'object') {
      const newActions = Object.fromEntries(
        Object.entries(actions).map(([actionName, actionFn]) => {
          let enhancedFn = actionFn
          if (typeof actionFn === 'function') {
            enhancedFn = (...args: unknown[]) => {
              const ret = actionFn(...args)
              options.logger?.(actionName, args) // Call the logger function if provided
              return ret
            }
          }
          return [actionName, enhancedFn]
        })
      )

      // Spread originalConfig and overwrite the actions property
      return { ...originalConfig, actions: newActions }
    }

    return originalConfig
  }

export default logger as unknown as TLogger
