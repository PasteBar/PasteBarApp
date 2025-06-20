import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ClipboardHistoryQuickPasteRow } from './ClipboardHistoryQuickPasteRow'
import { ClipboardHistoryItem } from '~/types/history'

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      if (key === 'lines') return options?.count === 1 ? 'line' : 'lines'
      if (key === 'chars') return options?.count === 1 ? 'char' : 'chars'
      if (key === 'Show all') return 'Show all'
      if (key === 'show less') return 'show less'
      return key
    },
  }),
}))

// Mock Lucide icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual<typeof import('lucide-react')>('lucide-react')
  return {
    ...actual,
    WrapIcon: () => <div data-testid="wrap-icon" />,
    NoWrapIcon: () => <div data-testid="nowrap-icon" />,
    Star: () => <div data-testid="star-icon" />,
    Dot: () => <div data-testid="dot-icon" />,
    Check: () => <div data-testid="check-icon" />,
  }
})

vi.mock('~/components/atoms/image/image-with-fallback-on-error', () => ({
  __esModule: true,
  default: ({ src }: { src: string }) => <img src={src} alt="mocked image" />,
}))

vi.mock('~/components/atoms/link-card/link-card', () => ({
  __esModule: true,
  default: () => <div data-testid="link-card-mock">Link Card</div>,
}))

vi.mock('~/components/video-player/YoutubeEmbed', () => ({
  __esModule: true,
  default: () => <div data-testid="youtube-embed-mock">Youtube Embed</div>,
}))


const createMockClipboardItem = (
  id: string,
  value: string,
  valuePreview?: string,
  detectedLanguage?: string,
  isLink?: boolean,
  isImage?: boolean,
  isImageData?: boolean,
  isVideo?: boolean
): ClipboardHistoryItem => {
  const lines = value.split('\n')
  const previewLines = valuePreview?.split('\n') ?? lines
  return {
    historyId: id,
    value,
    valuePreview: valuePreview ?? value, // QuickPasteRow uses `value` directly for text sometimes, but preview logic relies on this structure
    valueLines: lines.length,
    valueMorePreviewLines: previewLines.length < lines.length ? lines.length - previewLines.length : 0,
    valueMorePreviewChars: valuePreview && value.length > valuePreview.length ? value.length - valuePreview.length : 0,
    detectedLanguage,
    isLink: isLink ?? false,
    isImage: isImage ?? false,
    isImageData: isImageData ?? false,
    isVideo: isVideo ?? false,
    isFavorite: false,
    isPinned: false,
    updatedAt: Date.now(),
    createdAt: Date.now(),
    copiedFromApp: 'test-app',
    historyOptions: null,
    options: null,
    arrLinks: [],
    hasEmoji: false,
    hasMaskedWords: false,
    isMasked: false,
    imageHeight: null,
    imageWidth: null,
    imageDataUrl: null,
    linkMetadata: null,
    timeAgo: 'just now',
    timeAgoShort: 'now',
    showTimeAgo: false,
    pinnedOrderNumber: 0,
  }
}

const defaultProps = {
  isDark: false,
  showSelectHistoryItems: false,
  setBrokenImageItem: vi.fn(),
  setSelectHistoryItem: vi.fn(),
  onCopy: vi.fn(),
  onCopyPaste: vi.fn(),
  setKeyboardSelected: vi.fn(),
  setExpanded: vi.fn(),
  setWrapText: vi.fn(),
  setSavingItem: vi.fn(),
  setLargeViewItemId: vi.fn(),
  invalidateClipboardHistoryQuery: vi.fn(),
  isExpanded: false,
  isWrapText: false,
  isKeyboardSelected: false, // Important for QuickPasteRow
}

describe('ClipboardHistoryQuickPasteRow', () => {
  // Text content tests
  describe('Text Content Preview', () => {
    it('renders default preview lines when historyPreviewLineLimit is not provided', () => {
      const item = createMockClipboardItem('1', 'line1\nline2\nline3\nline4\nline5\nline6', 'line1\nline2\nline3\nline4\nline5')
      render(<ClipboardHistoryQuickPasteRow {...defaultProps} clipboard={item} />)
      expect(screen.getByText(/line1/)).toBeInTheDocument()
      expect(screen.getByText(/line5/)).toBeInTheDocument()
      expect(screen.queryByText(/line6/)).not.toBeInTheDocument()
    })

    it('renders limited lines when historyPreviewLineLimit is set (e.g., 3)', () => {
      const item = createMockClipboardItem('1', 'line1\nline2\nline3\nline4\nline5')
      render(<ClipboardHistoryQuickPasteRow {...defaultProps} clipboard={item} historyPreviewLineLimit={3} />)
      expect(screen.getByText(/line1/)).toBeInTheDocument()
      expect(screen.getByText(/line3/)).toBeInTheDocument()
      expect(screen.queryByText(/line4/)).not.toBeInTheDocument()
      expect(screen.getByText(/\.\.\./)).toBeInTheDocument()
      expect(screen.getByText(/Show all/)).toHaveTextContent('+2 lines')
    })

    it('renders all lines if content lines are fewer than historyPreviewLineLimit', () => {
      const item = createMockClipboardItem('1', 'line1\nline2')
      render(<ClipboardHistoryQuickPasteRow {...defaultProps} clipboard={item} historyPreviewLineLimit={3} />)
      expect(screen.getByText(/line1/)).toBeInTheDocument()
      expect(screen.getByText(/line2/)).toBeInTheDocument()
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument()
      expect(screen.queryByText(/Show all/)).not.toBeInTheDocument()
    })

    it('renders all lines if content lines are equal to historyPreviewLineLimit', () => {
      const item = createMockClipboardItem('1', 'line1\nline2\nline3')
      render(<ClipboardHistoryQuickPasteRow {...defaultProps} clipboard={item} historyPreviewLineLimit={3} />)
      expect(screen.getByText(/line1/)).toBeInTheDocument()
      expect(screen.getByText(/line3/)).toBeInTheDocument()
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument()
      expect(screen.queryByText(/Show all/)).not.toBeInTheDocument()
    })

    it('renders full preview when historyPreviewLineLimit is 0', () => {
      const item = createMockClipboardItem('1', 'line1\nline2\nline3\nline4\nline5\nline6')
      render(<ClipboardHistoryQuickPasteRow {...defaultProps} clipboard={item} historyPreviewLineLimit={0} />)
      expect(screen.getByText(/line1/)).toBeInTheDocument()
      expect(screen.getByText(/line6/)).toBeInTheDocument()
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument()
    })

    it('renders full content when isExpanded is true, ignoring historyPreviewLineLimit', () => {
      const item = createMockClipboardItem('1', 'line1\nline2\nline3\nline4\nline5')
      render(
        <ClipboardHistoryQuickPasteRow
          {...defaultProps}
          clipboard={item}
          historyPreviewLineLimit={2}
          isExpanded={true}
        />
      )
      expect(screen.getByText(/line1/)).toBeInTheDocument()
      expect(screen.getByText(/line5/)).toBeInTheDocument()
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument()
      expect(screen.getByText(/show less/)).toBeInTheDocument()
    })
  })

  // Code content tests
  describe('Code Content Preview (Highlight component)', () => {
    const codeItem = (lines: number) => createMockClipboardItem(
      'code1',
      Array.from({ length: lines }, (_, i) => `const line${i + 1} = ${i + 1};`).join('\n'),
      undefined,
      'javascript'
    )

    it('renders limited lines for code when historyPreviewLineLimit is set (e.g., 3)', () => {
      render(<ClipboardHistoryQuickPasteRow {...defaultProps} clipboard={codeItem(5)} historyPreviewLineLimit={3} />)
      expect(screen.getByText(/const line1 = 1;/)).toBeInTheDocument()
      expect(screen.getByText(/const line3 = 3;/)).toBeInTheDocument()
      expect(screen.queryByText(/const line4 = 4;/)).not.toBeInTheDocument()
      const lines = screen.getAllByText(/const line/i)
      expect(lines.length).toBe(3)
      expect(within(lines[2].closest('div')!).getByText('...')).toBeInTheDocument()
      expect(screen.getByText(/Show all/)).toHaveTextContent('+2 lines')
    })

    it('renders all lines for code if content lines are fewer than historyPreviewLineLimit', () => {
      render(<ClipboardHistoryQuickPasteRow {...defaultProps} clipboard={codeItem(2)} historyPreviewLineLimit={3} />)
      expect(screen.getByText(/const line1 = 1;/)).toBeInTheDocument()
      expect(screen.getByText(/const line2 = 2;/)).toBeInTheDocument()
      const lines = screen.getAllByText(/const line/i)
      expect(lines.length).toBe(2)
      lines.forEach(line => {
        expect(within(line.closest('div')!).queryByText('...')).not.toBeInTheDocument()
      })
      expect(screen.queryByText(/Show all/)).not.toBeInTheDocument()
    })

    it('renders full code preview when historyPreviewLineLimit is 0', () => {
      render(<ClipboardHistoryQuickPasteRow {...defaultProps} clipboard={codeItem(6)} historyPreviewLineLimit={0} />)
      expect(screen.getByText(/const line1 = 1;/)).toBeInTheDocument()
      expect(screen.getByText(/const line6 = 6;/)).toBeInTheDocument()
      const lines = screen.getAllByText(/const line/i)
      expect(lines.length).toBe(6)
      lines.forEach(line => {
        expect(within(line.closest('div')!).queryByText('...')).not.toBeInTheDocument()
      })
    })

    it('renders full code content when isExpanded is true, ignoring historyPreviewLineLimit', () => {
      render(
        <ClipboardHistoryQuickPasteRow
          {...defaultProps}
          clipboard={codeItem(5)}
          historyPreviewLineLimit={2}
          isExpanded={true}
        />
      )
      expect(screen.getByText(/const line1 = 1;/)).toBeInTheDocument()
      expect(screen.getByText(/const line5 = 5;/)).toBeInTheDocument()
      const lines = screen.getAllByText(/const line/i)
      expect(lines.length).toBe(5)
      lines.forEach(line => {
        expect(within(line.closest('div')!).queryByText('...')).not.toBeInTheDocument()
      })
      expect(screen.getByText(/show less/)).toBeInTheDocument()
    })
  })

  describe('Show all / Show less button text', () => {
    it('shows correct "+X lines" when truncated by line limit (text)', () => {
      const item = createMockClipboardItem('txt1', 'l1\nl2\nl3\nl4\nl5')
      render(<ClipboardHistoryQuickPasteRow {...defaultProps} clipboard={item} historyPreviewLineLimit={3} />)
      expect(screen.getByText(/Show all/)).toHaveTextContent('+2 lines')
    })

    it('shows correct "+X lines" when truncated by line limit (code)', () => {
      const item = createMockClipboardItem('code1', 'c1\nc2\nc3\nc4\nc5', undefined, 'javascript')
      render(<ClipboardHistoryQuickPasteRow {...defaultProps} clipboard={item} historyPreviewLineLimit={2} />)
      expect(screen.getByText(/Show all/)).toHaveTextContent('+3 lines')
    })

    it('shows correct "+X chars" when truncated by char limit (line limit is 0 or not applicable)', () => {
      const longLine = 'a'.repeat(100)
      const previewChar = 'a'.repeat(50)
      const item = createMockClipboardItem('char1', `${longLine}\nline2`, `${previewChar}\nline2`)
      item.valueMorePreviewChars = 50
      item.valueMorePreviewLines = 0

      render(<ClipboardHistoryQuickPasteRow {...defaultProps} clipboard={item} historyPreviewLineLimit={0} />)
      const showAllButton = screen.getByText(/Show all/)
      expect(showAllButton).toBeInTheDocument()
      expect(showAllButton).toHaveTextContent('+50 chars')
    })

    it('prioritizes line limit message over char limit message when both could apply', () => {
      const longText = Array.from({ length: 5 }, (_, i) => `line${i+1} ` + 'char'.repeat(10)).join('\n');
      const previewText = "line1 " + 'char'.repeat(5);
      const item = createMockClipboardItem('combo1', longText, previewText);
      item.valueMorePreviewLines = 4;
      item.valueMorePreviewChars = (("line1 " + 'char'.repeat(10)).length - previewText.length) +
                                   (4 * ("lineX " + 'char'.repeat(10)).length);

      render(<ClipboardHistoryQuickPasteRow {...defaultProps} clipboard={item} historyPreviewLineLimit={2} />);
      expect(screen.getByText(/Show all/)).toHaveTextContent('+3 lines');
      expect(screen.queryByText(/chars/)).not.toBeInTheDocument();
    });


    it('shows "show less" when expanded', () => {
      const item = createMockClipboardItem('any', 'l1\nl2\nl3')
      render(<ClipboardHistoryQuickPasteRow {...defaultProps} clipboard={item} isExpanded={true} />)
      expect(screen.getByText(/show less/)).toBeInTheDocument()
    })
  })
})

// Basic test to confirm the component renders
it('ClipboardHistoryQuickPasteRow renders', () => {
  const mockItem = createMockClipboardItem('id1', 'Test content quick paste')
  render(<ClipboardHistoryQuickPasteRow {...defaultProps} clipboard={mockItem} />)
  expect(screen.getByText('Test content quick paste')).toBeInTheDocument()
})
