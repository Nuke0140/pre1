/**
 * PreOne — Spreadsheet & Tabular Text Parser
 *
 * Supports RFC 4180 CSV strings and Tab-Separated Values (TSV)
 * copied directly from Microsoft Excel or Google Sheets.
 */

/**
 * Sanitizes an exported or rendered cell value to prevent formula injection
 * in spreadsheet software (=, +, -, @, \t, \r).
 */
export function sanitizeCsvCell(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""'
  const raw = String(val)
  let s = raw.trim()
  if (/^[=+\-@\t\r]/.test(raw) || /^[=+\-@]/.test(s)) {
    s = `'${s}`
  }
  return `"${s.replace(/"/g, '""')}"`
}

/**
 * Strips dangerous formula injection prefixes from imported user inputs.
 */
export function sanitizeInputCellValue(val: string | null | undefined): string {
  if (!val) return ''
  let cleaned = String(val).replace(/^["']|["']$/g, '').trim()
  if (/^[=+\-@]/.test(cleaned)) {
    cleaned = cleaned.replace(/^[=+\-@]+/, '').trim()
  }
  return cleaned
}

/**
 * Automatically parses CSV or TSV string into structured headers and rows.
 */
export function parseTabularContent(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n').filter((l) => l.trim().length > 0)

  if (lines.length === 0) return { headers: [], rows: [] }

  // Detect delimiter from first non-empty line: if tabs present, treat as TSV (clipboard from Excel/Sheets)
  const firstLine = lines[0]
  const isTsv = firstLine.includes('\t') && (firstLine.split('\t').length >= firstLine.split(',').length)
  const delimiter = isTsv ? '\t' : ','

  const parseLine = (line: string): string[] => {
    const values: string[] = []
    let current = ''
    let insideQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          insideQuotes = !insideQuotes
        }
      } else if (char === delimiter && !insideQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        values.push(char) // Note: fixed below
      }
    }
    return values
  }

  // Proper state machine for line parsing
  const tokenizeLine = (line: string): string[] => {
    const values: string[] = []
    let current = ''
    let insideQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          insideQuotes = !insideQuotes
        }
      } else if (char === delimiter && !insideQuotes) {
        values.push(sanitizeInputCellValue(current))
        current = ''
      } else {
        current += char
      }
    }
    values.push(sanitizeInputCellValue(current))
    return values
  }

  const rawHeaders = tokenizeLine(lines[0])
  const headers = rawHeaders.map((h) => h.trim())

  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = tokenizeLine(lines[i])
    // Skip entirely empty row
    if (values.every((v) => !v.trim())) continue

    const rowObj: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      const h = headers[j]
      rowObj[h] = values[j] !== undefined ? values[j] : ''
    }
    rows.push(rowObj)
  }

  return { headers, rows }
}

/**
 * Normalizes a column name to match schema keys flexibly.
 * e.g. "Classroom Name" -> "name" or "classroomName"
 */
export function normalizeHeaderKey(rawHeader: string): string {
  return rawHeader.toLowerCase().replace(/[^a-z0-9]/g, '')
}
