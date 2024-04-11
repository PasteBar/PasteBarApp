import { Check } from 'lucide-react'

import { Box, Text } from '~/components/ui'

export const CheckBoxFilter = ({
  checked,
  label,
}: {
  checked: boolean
  label: string
}) => {
  return (
    <>
      <Box className="flex flex-row items-center pr-2 z-100">
        {checked ? (
          <Check className="form-checkbox h-[16px] w-[16px] text-white bg-blue-500 rounded-sm border-slate-200 border" />
        ) : (
          <div className="form-checkbox h-[16px] w-[16px] bg-slate-100 rounded-sm border-slate-200 border" />
        )}
      </Box>
      <Text className={`${checked && 'font-semibold'}`}>
        <label>{label}</label>
      </Text>
    </>
  )
}
