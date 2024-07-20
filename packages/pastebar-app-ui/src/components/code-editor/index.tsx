import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import CodeMirror, { fromTextArea } from 'codemirror'

import 'codemirror/addon/scroll/simplescrollbars.js'
import 'codemirror/mode/meta'
import './codemirror-colors.css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/xml/xml'
import 'codemirror/addon/selection/active-line'
import 'codemirror/addon/mode/simple.js'
import 'codemirror/addon/runmode/runmode.js'

import { Flex } from '../ui'

window.CodeMirror = CodeMirror

interface ReactCodeMirrorProps {
  options?: CodeMirror.EditorConfiguration
  onChange?: (instance: CodeMirror.Editor, changeObj: CodeMirror.EditorChange) => void
  value?: string
  width?: string
  height?: string
  lineNumbers?: boolean
  isCmd?: boolean
  lineWrapping?: boolean
  autofocus?: boolean
  isDark?: boolean
  lazyLoadMode?: boolean
}

const ReactCodeMirror = forwardRef<CodeMirror.Editor, ReactCodeMirrorProps>(
  (props, ref) => {
    const {
      options = {},
      value = '',
      width = '100%',
      height = '100%',
      isDark = false,
      isCmd = false,
      autofocus = true,
      lineWrapping,
      lineNumbers = true,
      lazyLoadMode = true,
    } = props

    const editor = useRef<CodeMirror.Editor | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const latestProps = useRef(props)

    const defaultOptions: CodeMirror.EditorConfiguration = {
      tabSize: 2,
      scrollbarStyle: 'simple',
      lineNumbers,
      viewportMargin: Infinity,
      styleActiveLine: true,
      lineWrapping,
      autofocus,
      lineNumberFormatter: (line: number) => {
        if (!isCmd) return `${line}`
        return '>_'
      },
      showCursorWhenSelecting: true,
    }

    // @ts-expect-error
    useImperativeHandle(ref, () => ({ editor, textarea: textareaRef.current }))

    latestProps.current = props

    function getEventHandleFromProps() {
      const propNames = Object.keys(props)
      const eventHandle = propNames.filter(keyName => /^on+/.test(keyName))

      const eventDict: { [key: string]: string } = {}
      eventHandle.forEach(ele => {
        const name = ele.slice(2)
        if (name && name[0]) {
          eventDict[ele] = name.replace(name[0], name[0].toLowerCase())
        }
      })

      return eventDict
    }

    async function setOptions(
      instance: CodeMirror.Editor,
      opt: CodeMirror.EditorConfiguration = {}
    ) {
      if (typeof opt === 'object' && window) {
        const mode = CodeMirror.findModeByName((opt.mode as string) || '')
        if (lazyLoadMode && mode && mode.mode) {
          if (mode.mode === 'dart') {
            // @ts-expect-error
            await import('codemirror/mode/clike/clike')
          }
          await import(`codemirror/mode/${mode.mode}/${mode.mode}`)
        }
        if (mode) {
          opt.mode = mode.mime
        }
        Object.keys(opt).forEach(name => {
          // @ts-expect-error
          if ((opt[name] || opt[name] === false) && JSON.stringify(opt[name])) {
            // @ts-expect-error
            instance.setOption(name, opt[name])
          }
        })
      }
    }

    useEffect(() => {
      if (!editor.current && textareaRef.current) {
        const instance = fromTextArea(textareaRef.current, {
          ...defaultOptions,
          ...options,
        })
        const eventDict = getEventHandleFromProps()
        Object.keys(eventDict).forEach(event => {
          // @ts-expect-error
          instance.on(eventDict[event], (...params) =>
            // @ts-expect-error
            latestProps.current[event](...params)
          )
        })
        if (width || height) {
          instance.setSize(width, height)
        }
        editor.current = instance
        setOptions(instance, { ...defaultOptions, ...options })
      }
      return () => {
        if (editor.current) {
          // @ts-expect-error
          editor.current.toTextArea()
          editor.current = null
        }
      }
    }, [textareaRef.current])

    useMemo(() => {
      if (!editor.current) return
      const val = editor.current.getValue()
      if (value !== undefined && value !== val) {
        editor.current.setValue(value)
      }
    }, [value, editor])

    useMemo(() => {
      if (!editor.current) return
      editor.current.setSize(width, height)
    }, [width, height, editor])

    useMemo(() => {
      if (!editor.current) return
      setOptions(editor.current, { ...defaultOptions, ...options })
    }, [editor, options])

    return (
      <div className={`${!isDark ? 'code-is-light' : 'code-is-dark'} w-full`}>
        <textarea ref={textareaRef} defaultValue={value} className="hidden" />
        <Flex className="absolute w-full items-end justify-end h-0">
          <div className="bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5 relative top-[-16px] right-[36px] select-none">
            {options.mode?.toString()}
          </div>
        </Flex>
      </div>
    )
  }
)

export default ReactCodeMirror
