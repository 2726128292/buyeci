import { cet4Words } from './cet4.js'
import { cet6Words } from './cet6.js'
import { kaoyanWords } from './kaoyan.js'
import { ieltsWords } from './ielts.js'
import { toeflWords } from './toefl.js'

export const bookData = [
  {
    id: 'cet4',
    name: 'CET-4 高频',
    words: cet4Words,
    unitSize: 20,
  },
  {
    id: 'cet6',
    name: 'CET-6 核心',
    words: cet6Words,
    unitSize: 20,
  },
  {
    id: 'kaoyan',
    name: '考研核心',
    words: kaoyanWords,
    unitSize: 20,
  },
  {
    id: 'ielts',
    name: '雅思必备',
    words: ieltsWords,
    unitSize: 20,
  },
  {
    id: 'toefl',
    name: '托福常用',
    words: toeflWords,
    unitSize: 20,
  },
]
