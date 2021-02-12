/**
 * [[include:packages/errors/README.md]]
 * @packageDocumentation
 * @module @jsvfs/errors
 */
import { JournalEntry, JSON_SCHEMA } from '@jsvfs/types'
import Ajv, { ValidateFunction } from 'ajv'

/** Journal class for error handling, extending built-in Array class. */
export class Journal extends Array<JournalEntry> {
  /** Constructs an instance of Journal; typical usage will not pass options, and if options are passed they will be validated. */
  constructor (length: number)
  constructor (...items: JournalEntry[])
  constructor (...inputs: [number] | JournalEntry[]) {
    if (inputs.length === 1 && typeof inputs[0] === 'number') {
      super(inputs[0])
    } else {
      super()
    }

    const ajv = new Ajv({ allErrors: true })
    this.validate = ajv.compile(JSON_SCHEMA.JournalEntry)

    if (inputs.length > 0 && typeof inputs[0] === 'object') {
      this.push(...inputs as JournalEntry[])
    }
  }

  /** Journal entry validator function. */
  private validate: ValidateFunction<JournalEntry>

  /** Get all journal entries matching an operation and optionally a certain level. */
  getEntries (op: JournalEntry['op'] | 'all', ...level: Array<JournalEntry['level']>): JournalEntry[] {
    return this.filter(entry => {
      if (Array.isArray(level) && level.length > 0) {
        return (op === 'all' || entry.op === op) && level.includes(entry.level)
      }

      return op === 'all' || entry.op === op
    })
  }

  /** Does the journal have one or more errors. */
  get hasError (): boolean {
    return this.errors.length > 0
  }

  /** Get the highest level of journal entry in this journal. */
  get maxLevel (): JournalEntry['level'] {
    switch (true) {
      case this.critical.length > 0:
        return 'crit'
      case this.errors.length > 0:
        return 'error'
      case this.warnings.length > 0:
        return 'warn'
      default:
        return 'info'
    }
  }

  /** List all critical errors. */
  get critical (): JournalEntry[] {
    return this.getEntries('all', 'crit')
  }

  /** List all errors including critical. */
  get errors (): JournalEntry[] {
    return this.getEntries('all', 'error', 'crit')
  }

  /** List all information entries. */
  get info (): JournalEntry[] {
    return this.getEntries('all', 'info')
  }

  /** List all warning entries. */
  get warnings (): JournalEntry[] {
    return this.getEntries('all', 'crit')
  }

  /** Get critical errors by operation name. */
  getCritical (op: JournalEntry['op']): JournalEntry[] {
    return this.getEntries(op, 'crit')
  }

  /** Get errors, including critical, by operation name. */
  getErrors (op: JournalEntry['op']): JournalEntry[] {
    return this.getEntries(op, 'error', 'crit')
  }

  /** Get information by operation name. */
  getInfo (op: JournalEntry['op']): JournalEntry[] {
    return this.getEntries(op, 'info')
  }

  /** Get warnings by operation name. */
  getWarnings (op: JournalEntry['op']): JournalEntry[] {
    return this.getEntries(op, 'warn')
  }

  /** Only valid journal entries will be added to the array; invalid entries will be dropped. If no entry `id` is provided, it will be added. */
  push (...entries: JournalEntry[]): number {
    for (const entry of entries) {
      const result = this.validate(entry)

      if (result) {
        if (typeof entry.id === 'undefined') {
          entry.id = this.length
        }

        super.push(entry)
      }
    }

    return this.length
  }
}
