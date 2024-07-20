import { useMutation, UseMutationOptions, useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/tauri'

export const invokeFetcher = async <TArgs extends Record<string, unknown>, TResult>(
  command: string,
  args?: TArgs
): Promise<TResult> => {
  try {
    return invoke(command, args)
  } catch (error) {
    console.error(`invoke command ${command}`, error)
    throw error
  }
}

export const useInvokeQuery = <TArgs extends Record<string, unknown>, TResult>(
  command: string,
  args?: TArgs
) => {
  return useQuery({
    queryKey: [command, args],
    queryFn: () => invokeFetcher(command, args) as Promise<TResult>,
    ...(args?.useQueryOptions ?? {}),
  })
}

export const useInvokeMutation = <TArgs extends Record<string, unknown>, TResult>(
  command: string,
  options?: UseMutationOptions<TResult, Error, TArgs>
) => {
  return useMutation<TResult, Error, TArgs>({
    mutationFn: args => {
      return invokeFetcher(command, args)
    },
    ...(options ?? {}),
  })
}
