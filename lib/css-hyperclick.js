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
    linkedFile = found.match[1] || found.match[2]
    linkRange = found.range
    found.stop()
  })
  return {
    linkedFile,
    linkRange
  }
}

const getPotentialFilePaths = (currentPath, targetPath) => {
  let {dir: currentDir, ext: currentExt} = path.parse(currentPath)
  let {dir: linkedDir, ext: linkedExt, name: linkedName} = path.parse(targetPath)

  let filepath = path.join(currentDir, linkedDir, linkedName + (linkedExt || currentExt))
  const filepaths = [filepath]
  // TODO: language specific features should use the file grammar rather than the file extension
  if(!linkedExt && ['.scss', '.sass'].includes(currentExt.toLowerCase())) {
    // SCSS files that link to other SCSS files could refer to the filename prepended by an underscore
    filepaths.push(path.join(currentDir, linkedDir, '_' + linkedName + currentExt))
  }
  return filepaths
}

export function getProvider() {
  return {
    priority: 1,
    grammarScopes: ['source.css', 'source.css.scss', 'source.sass', 'source.css.less', 'source.stylus'],
    getSuggestionForWord(
      textEditor: TextEditor,
      text: string,
      range: Range
    ): ?HyperclickSuggestion {
      const {linkRange, linkedFile} = getRange(textEditor, range)
      if(linkRange && linkedFile) {
        return {
          range: linkRange,
          callback() {
            let filepaths = getPotentialFilePaths(textEditor.getPath(), linkedFile)
            let filepath = filepaths.find((filepath) => fs.existsSync(filepath))
            if (filepath) {
              filepath = fs.realpathSync(filepath)
            } else {
              filepath = filepaths[0]
            }
            atom.workspace.open(filepath)
          }
        }
      }
    }
  }
}
