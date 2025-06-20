import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClipboardHistoryRow } from './ClipboardHistoryRow'
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
    Clipboard: () => <div data-testid="clipboard-icon" />,
    ClipboardPaste: () => <div data-testid="clipboard-paste-icon" />,
    Grip: () => <div data-testid="grip-icon" />,
    MoreVertical: () => <div data-testid="more-vertical-icon" />,
    MoveUp: () => <div data-testid="move-up-icon" />,
    MoveDown: () => <div data-testid="move-down-icon" />,
    Check: () => <div data-testid="check-icon" />,
    ArrowDownToLine: () => <div data-testid="arrow-down-to-line-icon" />,
    X: () => <div data-testid="x-icon" />,
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
    valuePreview: valuePreview ?? value,
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
  setExpanded: vi.fn(),
  setWrapText: vi.fn(),
  setSavingItem: vi.fn(),
  setLargeViewItemId: vi.fn(),
  invalidateClipboardHistoryQuery: vi.fn(),
  isExpanded: false,
  isWrapText: false,
  isKeyboardSelected: false,
}

describe('ClipboardHistoryRow', () => {
  // Text content tests
  describe('Text Content Preview', () => {
    it('renders default preview lines when historyPreviewLineLimit is not provided', () => {
      const item = createMockClipboardItem('1', 'line1\nline2\nline3\nline4\nline5\nline6', 'line1\nline2\nline3\nline4\nline5')
      render(<ClipboardHistoryRow {...defaultProps} clipboard={item} />)
      expect(screen.getByText(/line1/)).toBeInTheDocument()
      expect(screen.getByText(/line5/)).toBeInTheDocument()
      expect(screen.queryByText(/line6/)).not.toBeInTheDocument()
      // Assuming default char limit might show '...' or line count based on original component logic
      // This test focuses on line limit overriding, so exact char limit assertion isn't primary here.
    })

    it('renders limited lines when historyPreviewLineLimit is set (e.g., 3)', () => {
      const item = createMockClipboardItem('1', 'line1\nline2\nline3\nline4\nline5')
      render(<ClipboardHistoryRow {...defaultProps} clipboard={item} historyPreviewLineLimit={3} />)
      expect(screen.getByText(/line1/)).toBeInTheDocument()
      expect(screen.getByText(/line3/)).toBeInTheDocument()
      expect(screen.queryByText(/line4/)).not.toBeInTheDocument()
      expect(screen.getByText(/\.\.\./)).toBeInTheDocument() // For the ellipsis
      expect(screen.getByText(/Show all/)).toHaveTextContent('+2 lines')
    })

    it('renders all lines if content lines are fewer than historyPreviewLineLimit', () => {
      const item = createMockClipboardItem('1', 'line1\nline2')
      render(<ClipboardHistoryRow {...defaultProps} clipboard={item} historyPreviewLineLimit={3} />)
      expect(screen.getByText(/line1/)).toBeInTheDocument()
      expect(screen.getByText(/line2/)).toBeInTheDocument()
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument()
      expect(screen.queryByText(/Show all/)).not.toBeInTheDocument() // No "Show all" if not truncated
    })

    it('renders all lines if content lines are equal to historyPreviewLineLimit', () => {
      const item = createMockClipboardItem('1', 'line1\nline2\nline3')
      render(<ClipboardHistoryRow {...defaultProps} clipboard={item} historyPreviewLineLimit={3} />)
      expect(screen.getByText(/line1/)).toBeInTheDocument()
      expect(screen.getByText(/line3/)).toBeInTheDocument()
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument()
      expect(screen.queryByText(/Show all/)).not.toBeInTheDocument()
    })

    it('renders full preview when historyPreviewLineLimit is 0', () => {
      const item = createMockClipboardItem('1', 'line1\nline2\nline3\nline4\nline5\nline6')
      render(<ClipboardHistoryRow {...defaultProps} clipboard={item} historyPreviewLineLimit={0} />)
      expect(screen.getByText(/line1/)).toBeInTheDocument()
      expect(screen.getByText(/line6/)).toBeInTheDocument()
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument() // No line-based ellipsis
      // It might still show ellipsis due to character limit if that's separate logic
    })

    it('renders full content when isExpanded is true, ignoring historyPreviewLineLimit', () => {
      const item = createMockClipboardItem('1', 'line1\nline2\nline3\nline4\nline5')
      render(
        <ClipboardHistoryRow
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
      undefined, // let valuePreview be same as value initially
      'javascript'
    )

    it('renders limited lines for code when historyPreviewLineLimit is set (e.g., 3)', () => {
      render(<ClipboardHistoryRow {...defaultProps} clipboard={codeItem(5)} historyPreviewLineLimit={3} />)
      expect(screen.getByText(/const line1 = 1;/)).toBeInTheDocument()
      expect(screen.getByText(/const line3 = 3;/)).toBeInTheDocument()
      expect(screen.queryByText(/const line4 = 4;/)).not.toBeInTheDocument()
      // Highlight component renders each line in a div, check for ellipsis in the last visible line
      const lines = screen.getAllByText(/const line/i)
      expect(lines.length).toBe(3)
      expect(within(lines[2].closest('div')!).getByText('...')).toBeInTheDocument()
      expect(screen.getByText(/Show all/)).toHaveTextContent('+2 lines')
    })

    it('renders all lines for code if content lines are fewer than historyPreviewLineLimit', () => {
      render(<ClipboardHistoryRow {...defaultProps} clipboard={codeItem(2)} historyPreviewLineLimit={3} />)
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
      render(<ClipboardHistoryRow {...defaultProps} clipboard={codeItem(6)} historyPreviewLineLimit={0} />)
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
        <ClipboardHistoryRow
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
      render(<ClipboardHistoryRow {...defaultProps} clipboard={item} historyPreviewLineLimit={3} />)
      expect(screen.getByText(/Show all/)).toHaveTextContent('+2 lines')
    })

    it('shows correct "+X lines" when truncated by line limit (code)', () => {
      const item = createMockClipboardItem('code1', 'c1\nc2\nc3\nc4\nc5', undefined, 'javascript')
      render(<ClipboardHistoryRow {...defaultProps} clipboard={item} historyPreviewLineLimit={2} />)
      expect(screen.getByText(/Show all/)).toHaveTextContent('+3 lines')
    })

    it('shows correct "+X chars" when truncated by char limit (line limit is 0 or not applicable)', () => {
      const longLine = 'a'.repeat(100)
      const previewChar = 'a'.repeat(50)
      const item = createMockClipboardItem('char1', `${longLine}\nline2`, `${previewChar}\nline2`)
      item.valueMorePreviewChars = 50 // Manually set for this test case
      item.valueMorePreviewLines = 0

      render(<ClipboardHistoryRow {...defaultProps} clipboard={item} historyPreviewLineLimit={0} />)
      // Check if the "Show all" button exists and then check its content
      const showAllButton = screen.getByText(/Show all/)
      expect(showAllButton).toBeInTheDocument()
      expect(showAllButton).toHaveTextContent('+50 chars')
    })

     it('prioritizes line limit message over char limit message when both could apply', () => {
      const longText = Array.from({ length: 5 }, (_, i) => `line${i+1} ` + 'char'.repeat(10)).join('\n'); // 5 lines, each long
      // Preview is only 1 line, and that line is also char limited
      const previewText = "line1 " + 'char'.repeat(5);

      const item = createMockClipboardItem('combo1', longText, previewText);
      // Simulate that the original logic determined these char/line differences based on `valuePreview`
      item.valueMorePreviewLines = 4; // 5 total - 1 previewed = 4 more lines
      item.valueMorePreviewChars = (("line1 " + 'char'.repeat(10)).length - previewText.length) +
                                   (4 * ("lineX " + 'char'.repeat(10)).length); // remaining chars

      render(<ClipboardHistoryRow {...defaultProps} clipboard={item} historyPreviewLineLimit={2} />);
      // With historyPreviewLineLimit={2}, it should show "+3 lines" (5 total - 2 displayed)
      expect(screen.getByText(/Show all/)).toHaveTextContent('+3 lines');
      expect(screen.queryByText(/chars/)).not.toBeInTheDocument();
    });

    it('shows "show less" when expanded', () => {
      const item = createMockClipboardItem('any', 'l1\nl2\nl3')
      render(<ClipboardHistoryRow {...defaultProps} clipboard={item} isExpanded={true} />)
      expect(screen.getByText(/show less/)).toBeInTheDocument()
    })
  })
})

// Basic test to confirm the component renders
it('ClipboardHistoryRow renders', () => {
  const mockItem = createMockClipboardItem('id1', 'Test content')
  render(<ClipboardHistoryRow {...defaultProps} clipboard={mockItem} />)
  expect(screen.getByText('Test content')).toBeInTheDocument()
})
