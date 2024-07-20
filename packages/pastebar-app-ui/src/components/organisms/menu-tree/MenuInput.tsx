import { NodeApi } from '~/components/libs/react-arborist'
import { Input } from '~/components/ui'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MenuInputNode({ node }: { node: NodeApi<any> }) {
  return (
    <Input
      autoFocus
      type="text"
      classNameInput="border-0 text-[15px] w-full bg-transparent p-0"
      className="!justify-start pl-1 border-0"
      defaultValue={node.data.name}
      onFocus={e => e.currentTarget.select()}
      onBlur={() => node.reset()}
      onKeyDown={e => {
        if (e.key === 'Escape') node.reset()
        if (e.key === 'Enter') node.submit(e.currentTarget.value)
      }}
    />
  )
}
