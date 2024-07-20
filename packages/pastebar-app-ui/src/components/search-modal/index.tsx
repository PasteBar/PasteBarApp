import * as React from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'
import { clsx } from 'clsx'

import { useDebounce } from '~/hooks/use-debounce'

import Spinner from '../atoms/spinner'
import useKeyboardNavigationList from './use-keyboard-navigation-list'

// const getTotal = (...lists) => lists.reduce((total, list = []) => total + list.length, 0)

const SearchModal = ({ handleClose }) => {
  const [q, setQ] = React.useState('')
  // const query = useDebounce(q, 500)
  // const onChange = e => setQ(e.target.value)
  // const handleClear = () => {
  //   setQ('')
  // }

  // const { orders, isFetching: isFetchingOrders } = useAdminOrders(
  //   {
  //     q: query,
  //     limit: 5,
  //     offset: 0,
  //   },
  //   { enabled: !!query, keepPreviousData: true }
  // )
  // const { customers, isFetching: isFetchingCustomers } = useAdminCustomers(
  //   {
  //     q: query,
  //     limit: 5,
  //     offset: 0,
  //   },
  //   { enabled: !!query, keepPreviousData: true, retry: 0 }
  // )
  // const { discounts, isFetching: isFetchingDiscounts } = useAdminDiscounts(
  //   { q: query, limit: 5, offset: 0 },
  //   { enabled: !!query, keepPreviousData: true }
  // )
  // const { products, isFetching: isFetchingProducts } = useAdminProducts(
  //   { q: query, limit: 5 },
  //   { enabled: !!query, keepPreviousData: true }
  // )

  // const isFetching =
  //   isFetchingDiscounts || isFetchingCustomers || isFetchingProducts || isFetchingOrders

  // const totalLength = getTotal(products, discounts, customers, orders)

  const isFetching = false

  const totalLength = 10
  //
  const { getInputProps, getLIProps, getULProps, selected } = useKeyboardNavigationList({
    length: 10,
  })

  return (
    <RadixDialog.Root open onOpenChange={handleClose}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className={clsx(
            'fixed inset-0 z-50 pt-[140px] pb-[100px] backdrop-brightness-50',
            {
              flex: totalLength > 0,
            }
          )}
        >
          <RadixDialog.Content
            className={clsx(
              'bg-grey-0 rounded-rounded shadow-searchModal mx-auto flex max-w-[640px] flex-1'
            )}
          >
            <div className="py-large flex flex-1 flex-col">
              {totalLength > 0 ? (
                <ul
                  {...getULProps()}
                  className="mt-large px-xlarge flex-1 overflow-y-auto"
                >
                  {isFetching ? (
                    <div className="pt-2xlarge flex w-full items-center justify-center">
                      <Spinner size={'large'} variant={'secondary'} />
                    </div>
                  ) : (
                    <>
                      <div>Result menus here</div>

                      <div className="mt-xlarge">Result clipboard history here</div>

                      <div className="mt-xlarge">Results saved clips here</div>
                    </>
                  )}
                </ul>
              ) : null}
            </div>
          </RadixDialog.Content>
        </RadixDialog.Overlay>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

export default SearchModal
