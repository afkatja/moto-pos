import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import type { ChargeInput, ChargeResult } from '@moto-pos/core/types'

export interface UseChargeOptions extends Omit<UseMutationOptions<ChargeResult, Error, ChargeInput>, 'mutationFn'> {
  endpoint?: string
}

export function useCharge(options: UseChargeOptions = {}) {
  const { endpoint = '/api/pos/charge', ...mutationOptions } = options

  return useMutation<ChargeResult, Error, ChargeInput>({
    mutationFn: async (input) => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        const error = new Error(data.error || 'Charge failed') as Error & {
          status: number
          details?: Array<{ field: string; message: string }>
        }
        error.status = response.status
        error.details = data.details
        throw error
      }

      return data as ChargeResult
    },
    onSuccess: (...args) => {
      mutationOptions.onSuccess?.(...args)
    },
    onError: (...args) => {
      mutationOptions.onError?.(...args)
    },
    ...mutationOptions,
  })
}