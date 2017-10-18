'use babel'
/*global atom */
// @flow

import fs from "fs"
import path from "path"
import type { HyperclickSuggestion } from 'atom-ide-ui'

import type { TextEditor } from "atom"
import type { Range } from "./types"

const linkRegexp = /@import (?:"([^"]+)"|'([^"]+)')/

const getRange = (textEditor, range) => {
	const searchStart = [range.start.row, 0]
	const searchEnd = [range.end.row + 1, 0]
	const searchRange = [searchStart, searchEnd]

	let linkRange = null
  let linkedFile = null

	textEditor.scanInBufferRange(linkRegexp, searchRange, (found) => {
    if (found.match.length > 1) {
      linkedFile = found.match[1]
      linkRange = found.range
      found.stop()
    }
	})
	return {
    linkedFile,
    linkRange
  }
}

export function getProvider() {
  return {
    priority: 1,
    grammarScopes: ['source.css'],
    getSuggestionForWord(
      textEditor: TextEditor,
      text: string,
      range: Range
    ): ?HyperclickSuggestion {
      const {linkRange, linkedFile} = getRange(textEditor, range)
      if(linkRange && linkedFile) {
        let filepath = path.join(path.parse(textEditor.getPath()).dir, linkedFile + '.css')
        return {
          range: linkRange,
          callback() {
            if (fs.existsSync(filepath)) {
              filepath = fs.realpathSync(filepath)
            }
            atom.workspace.open(filepath)
          },
        }
      }
    },
  }
}
